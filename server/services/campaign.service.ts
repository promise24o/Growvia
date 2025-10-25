import mongoose, { Types } from 'mongoose';
import { Campaign, ICampaign } from '../models/CampaignModel';
import { Commission } from '../models/CommissionModel';
import { App, IApp } from '../models/Application';
import { Organization } from '../models/Organization';
import { BadRequestError, NotFoundError } from '../utils/errors';

// Ensure App model is registered
App;

interface CreateCampaignInput {
  name: string;
  category: string;
  applicationId: string;
  description: string;
  affiliateRequirements?: string | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  visibility: 'public' | 'invite-only';
  commissionModels: string[];
  safetyBufferPercent: number;
  maxAffiliates: number;
  expectedConversionsPerAffiliate?: number | null | undefined;
  organizationId?: string | undefined;
  status?: 'active' | 'paused' | 'completed' | 'archived' | 'draft' | undefined;
  budgetCalculation?: {
    baseBudget: number;
    bufferAmount: number;
    totalBudget: number;
    breakdown: Array<{
      modelName: string;
      cost: number;
      percentage: number;
    }>;
  } | undefined;
}

interface UpdateCampaignInput {
  name?: string | undefined;
  category?: string | undefined;
  applicationId?: string | undefined;
  description?: string | undefined;
  affiliateRequirements?: string | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  visibility?: 'public' | 'invite-only' | undefined;
  commissionModels?: string[] | undefined;
  safetyBufferPercent?: number | undefined;
  maxAffiliates?: number | undefined;
  expectedConversionsPerAffiliate?: number | null | undefined;
  status?: 'active' | 'paused' | 'completed' | 'archived' | 'draft' | undefined;
  budgetCalculation?: {
    baseBudget: number;
    bufferAmount: number;
    totalBudget: number;
    breakdown: Array<{
      modelName: string;
      cost: number;
      percentage: number;
    }>;
  } | undefined;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
  totalAffiliates: number;
  totalConversions: number;
  totalRevenue: number;
}

interface CampaignFilters {
  category?: string;
  status?: string;
  visibility?: string;
  applicationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CampaignService {
  async createCampaign(data: CreateCampaignInput): Promise<ICampaign> {
    // Validate organization exists
    let organizationObjectId: Types.ObjectId | null = null;
    if (data.organizationId) {
      organizationObjectId = new Types.ObjectId(data.organizationId);
      const organization = await Organization.findById(organizationObjectId);
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }
    }

    // Validate application exists and belongs to organization
    const application = await (App as any).findById(data.applicationId);
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (organizationObjectId && application.organizationId?.toString() !== organizationObjectId.toString()) {
      throw new BadRequestError('Application does not belong to your organization');
    }

    // Validate commission models exist and belong to organization
    const commissionIds = data.commissionModels.map(id => new Types.ObjectId(id));
    const commissions = await Commission.find({ 
      _id: { $in: commissionIds },
      organizationId: organizationObjectId 
    });

    if (commissions.length !== data.commissionModels.length) {
      throw new BadRequestError('One or more commission models not found or do not belong to your organization');
    }

    // Validate date range
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const campaign = new Campaign({
      ...data,
      applicationId: new Types.ObjectId(data.applicationId),
      commissionModels: commissionIds,
      organizationId: organizationObjectId,
      status: data.status || 'active',
    });

    await campaign.save();
    const populatedCampaign = await campaign.populate(['applicationId', 'commissionModels']);
    await this.populateCampaignStats(populatedCampaign);
    return populatedCampaign;
  }

  async getCampaignById(id: string): Promise<ICampaign> {
    const campaign = await Campaign.findById(id)
      .populate('applicationId')
      .populate('commissionModels');
    
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }
    
    // Calculate and populate virtual fields
    await this.populateCampaignStats(campaign);
    
    return campaign;
  }

  async getCampaignsByOrganization(
    organizationId: string, 
    filters: CampaignFilters = {}
  ): Promise<{ campaigns: ICampaign[]; total: number; page: number; limit: number }> {
    const { 
      category, 
      status, 
      visibility, 
      applicationId, 
      search, 
      page = 1, 
      limit = 10 
    } = filters;

    // Build query
    const query: any = { organizationId: new Types.ObjectId(organizationId) };

    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    if (applicationId) query.applicationId = new Types.ObjectId(applicationId);
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('applicationId')
        .populate('commissionModels')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Campaign.countDocuments(query)
    ]);

    // Populate statistics for all campaigns
    await this.populateMultipleCampaignStats(campaigns);

    return {
      campaigns,
      total,
      page,
      limit
    };
  }

  async updateCampaign(id: string, data: UpdateCampaignInput): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Validate application if being updated
    if (data.applicationId) {
      const application = await (App as any).findById(data.applicationId);
      if (!application) {
        throw new NotFoundError('Application not found');
      }

      if (campaign.organizationId && application.organizationId?.toString() !== campaign.organizationId.toString()) {
        throw new BadRequestError('Application does not belong to your organization');
      }

      data.applicationId = application._id.toString();
    }

    // Validate commission models if being updated
    if (data.commissionModels) {
      const commissionIds = data.commissionModels.map(id => new Types.ObjectId(id));
      const commissions = await Commission.find({ 
        _id: { $in: commissionIds },
        organizationId: campaign.organizationId 
      });

      if (commissions.length !== data.commissionModels.length) {
        throw new BadRequestError('One or more commission models not found or do not belong to your organization');
      }
    }

    // Validate date range if being updated
    const startDate = data.startDate !== undefined ? data.startDate : campaign.startDate;
    const endDate = data.endDate !== undefined ? data.endDate : campaign.endDate;
    
    if (startDate && endDate && endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    // Update campaign
    Object.assign(campaign, {
      ...data,
      applicationId: data.applicationId ? new Types.ObjectId(data.applicationId) : campaign.applicationId,
      commissionModels: data.commissionModels ? 
        data.commissionModels.map(id => new Types.ObjectId(id)) : 
        campaign.commissionModels,
    });

    await campaign.save();
    const populatedCampaign = await campaign.populate(['applicationId', 'commissionModels']);
    await this.populateCampaignStats(populatedCampaign);
    return populatedCampaign;
  }

  async duplicateCampaign(id: string, organizationId: Types.ObjectId): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    const newCampaign = new Campaign({
      ...campaign.toObject(),
      _id: new mongoose.Types.ObjectId(),
      name: `${campaign.name} (Copy)`,
      organizationId,
      status: 'paused', // Start duplicated campaigns as paused
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newCampaign.save();
    const populatedCampaign = await newCampaign.populate(['applicationId', 'commissionModels']);
    await this.populateCampaignStats(populatedCampaign);
    return populatedCampaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Check if campaign has active affiliates or conversions
    // This would require checking related collections
    // For now, we'll allow deletion but in production you might want to:
    // 1. Check for active affiliate links
    // 2. Check for recent conversions
    // 3. Maybe just archive instead of delete

    await campaign.deleteOne();
  }

  async getOrganizationCampaignStats(organizationId: string): Promise<CampaignStats> {
    const stats = await Campaign.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pausedCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'paused'] }, 1, 0] } },
          completedCampaigns: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalMaxAffiliates: { $sum: '$maxAffiliates' },
        },
      },
      {
        $project: {
          _id: 0,
          totalCampaigns: 1,
          activeCampaigns: 1,
          pausedCampaigns: 1,
          completedCampaigns: 1,
          totalAffiliates: '$totalMaxAffiliates', // This would need to be calculated from actual affiliate data
          totalConversions: { $literal: 0 }, // Would need to aggregate from conversions collection
          totalRevenue: { $literal: 0 }, // Would need to aggregate from conversions collection
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : {
      totalCampaigns: 0,
      activeCampaigns: 0,
      pausedCampaigns: 0,
      completedCampaigns: 0,
      totalAffiliates: 0,
      totalConversions: 0,
      totalRevenue: 0,
    };
  }

  async pauseCampaign(id: string): Promise<ICampaign> {
    return this.updateCampaignStatus(id, 'paused');
  }

  async resumeCampaign(id: string): Promise<ICampaign> {
    return this.updateCampaignStatus(id, 'active');
  }

  async completeCampaign(id: string): Promise<ICampaign> {
    return this.updateCampaignStatus(id, 'completed');
  }

  async archiveCampaign(id: string): Promise<ICampaign> {
    return this.updateCampaignStatus(id, 'archived');
  }

  private async updateCampaignStatus(id: string, status: 'active' | 'paused' | 'completed' | 'archived' | 'draft'): Promise<ICampaign> {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    campaign.status = status;
    await campaign.save();
    
    const populatedCampaign = await campaign.populate(['applicationId', 'commissionModels']);
    await this.populateCampaignStats(populatedCampaign);
    return populatedCampaign;
  }

  async getCampaignsByApplication(applicationId: string): Promise<ICampaign[]> {
    const campaigns = await Campaign.find({ applicationId: new Types.ObjectId(applicationId) })
      .populate('commissionModels')
      .sort({ createdAt: -1 });
    
    await this.populateMultipleCampaignStats(campaigns);
    return campaigns;
  }

  async getPublicCampaigns(filters: CampaignFilters = {}): Promise<{ campaigns: ICampaign[]; total: number }> {
    const { category, search, page = 1, limit = 10 } = filters;

    const query: any = { 
      visibility: 'public',
      status: 'active'
    };

    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('applicationId')
        .populate('commissionModels')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Campaign.countDocuments(query)
    ]);

    await this.populateMultipleCampaignStats(campaigns);
    return { campaigns, total };
  }

  // Helper method to populate campaign statistics
  private async populateCampaignStats(campaign: any): Promise<void> {
    try {
      // Note: These would need to be implemented based on your actual affiliate link and conversion models
      // For now, setting default values to avoid errors
      
      // TODO: Implement actual calculations when AffiliateLink and Conversion models are available
      // const currentAffiliates = await AffiliateLink.countDocuments({ campaignId: campaign._id });
      // const totalConversions = await Conversion.countDocuments({ campaignId: campaign._id });
      // const totalRevenue = await Conversion.aggregate([
      //   { $match: { campaignId: campaign._id } },
      //   { $group: { _id: null, total: { $sum: '$amount' } } }
      // ]);
      
      // Set calculated values on the document (using underscore prefix to avoid circular reference)
      (campaign as any)._currentAffiliates = 0; // Replace with actual calculation
      (campaign as any)._totalConversions = 0; // Replace with actual calculation
      (campaign as any)._totalRevenue = 0; // Replace with actual calculation
    } catch (error) {
      // Set defaults if calculation fails
      (campaign as any)._currentAffiliates = 0;
      (campaign as any)._totalConversions = 0;
      (campaign as any)._totalRevenue = 0;
    }
  }

  // Helper method to populate stats for multiple campaigns
  private async populateMultipleCampaignStats(campaigns: ICampaign[]): Promise<void> {
    await Promise.all(campaigns.map(campaign => this.populateCampaignStats(campaign)));
  }
}

export const campaignService = new CampaignService();
