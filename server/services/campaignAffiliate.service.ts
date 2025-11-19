import { Types } from 'mongoose';
import { CampaignAffiliate, ICampaignAffiliate } from '../models/CampaignAffiliate';
import { Campaign } from '../models/CampaignModel';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Activity } from '../models/Activity';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { AuditLog } from '../models/AuditLog';
import { sendCampaignInvitationEmail } from '../utils/email';
import emailQueue from '../queue/emailQueue';

// Helper function to get the correct base URL based on environment
function getBaseUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://app.growviapro.com'
    : process.env.LOCAL_URL || 'http://localhost:3000';
}

interface AssignUserToCampaignInput {
  campaignId: string;
  userId: string;
  assignedBy: string;
  organizationId: string;
  participationNotes?: string | undefined;
}

interface RemoveUserFromCampaignInput {
  campaignId: string;
  userId: string;
  removedBy: string;
  removalReason?: string | undefined;
}

interface CampaignAffiliateFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class CampaignAffiliateService {
  /**
   * Assign a user to a campaign with full policy validation
   */
  async assignUserToCampaign(data: AssignUserToCampaignInput): Promise<ICampaignAffiliate> {
    const { campaignId, userId, assignedBy, organizationId, participationNotes } = data;

    // 1. Validate campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // 2. Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 3. Validate assigner exists and has permission
    const assigner = await User.findById(assignedBy);
    if (!assigner) {
      throw new NotFoundError('Assigner not found');
    }

    // 4. Organization Match: User and campaign must belong to same organization
    const userOrgIds = user.organizationId.map(id => id.toString());
    const campaignOrgId = campaign.organizationId?.toString();
    
    if (!campaignOrgId || !userOrgIds.includes(campaignOrgId)) {
      throw new BadRequestError('User and campaign must belong to the same organization');
    }

    if (campaignOrgId !== organizationId) {
      throw new BadRequestError('Campaign does not belong to your organization');
    }

    // 5. Role Validation: Check if assigner has permission (admin or management)
    const assignerOrgIds = assigner.organizationId.map(id => id.toString());
    if (!assignerOrgIds.includes(organizationId)) {
      throw new ForbiddenError('You do not have permission to assign users in this organization');
    }

    if (!['admin', 'management'].includes(assigner.role)) {
      throw new ForbiddenError('Only admins and managers can assign users to campaigns');
    }

    // 6. Campaign Status Validation: Cannot assign to ended or archived campaigns
    if (['completed', 'archived'].includes(campaign.status)) {
      throw new BadRequestError(`Cannot assign users to ${campaign.status} campaigns`);
    }

    // 7. Check if user is already assigned
    const existingAssignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (existingAssignment) {
      if (existingAssignment.status === 'removed') {
        // Reactivate the assignment
        existingAssignment.status = 'active';
        existingAssignment.assignedBy = new Types.ObjectId(assignedBy);
        existingAssignment.assignedAt = new Date();
        existingAssignment.removedBy = undefined as any;
        existingAssignment.removedAt = undefined as any;
        existingAssignment.removalReason = undefined as any;
        if (participationNotes) {
          existingAssignment.participationNotes = participationNotes;
        }
        await existingAssignment.save();
        
        // Log the reactivation
        await this.createAuditLog({
          action: 'campaign_affiliate_reactivated',
          performedBy: assignedBy,
          organizationId,
          entityType: 'CampaignAffiliate',
          entityId: (existingAssignment._id as Types.ObjectId).toString(),
          details: {
            campaignId,
            userId,
            campaignName: campaign.name,
            userName: user.name,
          },
        });

        return existingAssignment;
      } else {
        throw new BadRequestError('User is already assigned to this campaign');
      }
    }

    // 8. Affiliate Limit Check: Prevent assignment if limit reached
    const currentAffiliatesCount = await CampaignAffiliate.countDocuments({
      campaignId: new Types.ObjectId(campaignId),
      status: 'active',
    });

    if (currentAffiliatesCount >= campaign.maxAffiliates) {
      throw new BadRequestError(
        `Campaign has reached maximum affiliates limit (${campaign.maxAffiliates})`
      );
    }

    // 9. Campaign Visibility Rules
    if (campaign.visibility === 'invite-only') {
      // For invite-only campaigns, only manual assignment is allowed
      // This is already being done by an admin/manager, so it's valid
    }

    // 10. KYC Check (if required by campaign commission models)
    // TODO: Check if any commission model requires KYC verification
    // For now, we'll assume KYC is not required or will be checked separately
    const kycVerified = false; // This should be fetched from user's KYC status

    // 11. Create the assignment (pending status - user must accept invitation)
    const assignment = new CampaignAffiliate({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
      organizationId: new Types.ObjectId(organizationId),
      assignedBy: new Types.ObjectId(assignedBy),
      assignedAt: new Date(),
      status: 'pending',
      kycVerified,
      participationNotes,
      clicks: 0,
      conversions: 0,
      totalRevenue: 0,
      totalCommission: 0,
    });

    await assignment.save();

    // 12. Create audit log
    await this.createAuditLog({
      action: 'campaign_affiliate_assigned',
      performedBy: assignedBy,
      organizationId,
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        campaignName: campaign.name,
        userName: user.name,
        participationNotes,
      },
    });

    // 13. Get organization details
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // 14. Send invitation email (with queue fallback)
    const invitationUrl = `${getBaseUrl()}/auth/campaigns/${campaign._id}/invitation/${assignment._id}`;
    
    try {
      await emailQueue.add({
        type: 'campaign_invitation',
        user,
        campaign,
        organization,
        invitationUrl,
        dashboardUrl: `${getBaseUrl()}/dashboard`,
        supportUrl: `${getBaseUrl()}/support`,
      });
    } catch (queueError: any) {
      console.warn('Email queue unavailable, sending email directly:', queueError?.message || queueError);
      // Fallback to direct email sending
      await this.sendInvitationEmail(user, campaign, organization, (assignment._id as Types.ObjectId).toString());
    }

    // 15. Create activity notification for the user
    await this.createActivity({
      type: 'campaign_invitation_received',
      description: `You have been invited to join the campaign "${campaign.name}"`,
      userId,
      organizationId,
      metadata: {
        campaignId,
        campaignName: campaign.name,
        invitedBy: organization.name,
        invitedByEmail: organization.email || assigner.email,
      },
    });

    return assignment;
  }

  /**
   * Remove a user from a campaign with policy validation
   */
  async removeUserFromCampaign(data: RemoveUserFromCampaignInput): Promise<ICampaignAffiliate> {
    const { campaignId, userId, removedBy, removalReason } = data;

    // 1. Find the assignment
    const assignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (!assignment) {
      throw new NotFoundError('User is not assigned to this campaign');
    }

    if (assignment.status === 'removed') {
      throw new BadRequestError('User has already been removed from this campaign');
    }

    // 2. Validate remover exists and has permission
    const remover = await User.findById(removedBy);
    if (!remover) {
      throw new NotFoundError('Remover not found');
    }

    // 3. Check if remover has permission (admin or management)
    const removerOrgIds = remover.organizationId.map(id => id.toString());
    const assignmentOrgId = assignment.organizationId.toString();
    
    if (!removerOrgIds.includes(assignmentOrgId)) {
      throw new ForbiddenError('You do not have permission to remove users in this organization');
    }

    if (!['admin', 'management'].includes(remover.role)) {
      throw new ForbiddenError('Only admins and managers can remove users from campaigns');
    }

    // 4. Get campaign and user details
    const campaign = await Campaign.findById(campaignId);
    const user = await User.findById(userId);

    // 5. Check if campaign has started
    const now = new Date();
    const campaignStarted = campaign?.startDate && campaign.startDate <= now;

    if (!campaignStarted) {
      // Campaign hasn't started - delete the assignment completely
      await CampaignAffiliate.deleteOne({ _id: assignment._id });

      // Create audit log for deletion
      await this.createAuditLog({
        action: 'campaign_affiliate_deleted',
        performedBy: removedBy,
        organizationId: assignmentOrgId,
        entityType: 'CampaignAffiliate',
        entityId: (assignment._id as Types.ObjectId).toString(),
        details: {
          campaignId,
          userId,
          campaignName: campaign?.name,
          userName: user?.name,
          removalReason,
          note: 'User removed before campaign start - assignment deleted',
        },
      });

      // Notify user via activity
      await this.createActivity({
        type: 'campaign_invitation_cancelled',
        description: `Your invitation to campaign "${campaign?.name}" has been cancelled as the campaign has not yet started.`,
        userId,
        organizationId: assignmentOrgId,
        metadata: {
          campaignId,
          campaignName: campaign?.name,
          removedBy: remover.name,
        },
      });

      return assignment;
    }

    // 6. Campaign has started - soft delete (maintain data integrity)
    assignment.status = 'removed';
    assignment.removedBy = new Types.ObjectId(removedBy);
    assignment.removedAt = new Date();
    assignment.removalReason = removalReason || undefined;

    await assignment.save();

    // 7. Create audit log
    await this.createAuditLog({
      action: 'campaign_affiliate_removed',
      performedBy: removedBy,
      organizationId: assignmentOrgId,
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        campaignName: campaign?.name,
        userName: user?.name,
        removalReason,
        performanceSnapshot: {
          clicks: assignment.clicks,
          conversions: assignment.conversions,
          totalRevenue: assignment.totalRevenue,
          totalCommission: assignment.totalCommission,
        },
      },
    });

    // 8. Notify user via activity
    await this.createActivity({
      type: 'campaign_affiliate_removed',
      description: `You have been removed from campaign "${campaign?.name}".`,
      userId,
      organizationId: assignmentOrgId,
      metadata: {
        campaignId,
        campaignName: campaign?.name,
        removedBy: remover.name,
        removalReason,
      },
    });

    return assignment;
  }

  /**
   * Get all affiliates for a campaign
   */
  async getCampaignAffiliates(
    campaignId: string,
    filters: CampaignAffiliateFilters = {}
  ): Promise<{ affiliates: ICampaignAffiliate[]; total: number; page: number; limit: number }> {
    const { status, search, page = 1, limit = 10 } = filters;

    const query: any = { campaignId: new Types.ObjectId(campaignId) };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    let affiliatesQuery = CampaignAffiliate.find(query)
      .populate('userId', 'name email avatar role')
      .populate('assignedBy', 'name email')
      .populate('removedBy', 'name email')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Apply search if provided
    if (search) {
      // We need to do a more complex query with user name search
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const [affiliates, total] = await Promise.all([
      affiliatesQuery,
      CampaignAffiliate.countDocuments(query),
    ]);

    return {
      affiliates,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all campaigns for a user
   */
  async getUserCampaigns(
    userId: string,
    filters: CampaignAffiliateFilters = {}
  ): Promise<{ campaigns: any[]; total: number }> {
    const { status, page = 1, limit = 10 } = filters;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      CampaignAffiliate.find(query)
        .populate('campaignId')
        .populate('assignedBy', 'name email')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit),
      CampaignAffiliate.countDocuments(query),
    ]);

    const campaigns = assignments.map(assignment => ({
      ...assignment.toObject(),
      campaign: assignment.campaignId,
    }));

    return { campaigns, total };
  }

  /**
   * Resend campaign invitation
   */
  async resendCampaignInvitation(
    campaignId: string,
    userId: string,
    resentBy: string
  ): Promise<ICampaignAffiliate> {
    // 1. Find the assignment
    const assignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (!assignment) {
      throw new NotFoundError('Campaign assignment not found');
    }

    // 2. Check if assignment is in pending status
    if (assignment.status !== 'pending') {
      throw new BadRequestError(
        `Cannot resend invitation for assignment with status: ${assignment.status}. Only pending invitations can be resent.`
      );
    }

    // 3. Verify the person resending has permission
    const resender = await User.findById(resentBy);
    if (!resender) {
      throw new NotFoundError('User performing action not found');
    }

    if (!['admin', 'management'].includes(resender.role)) {
      throw new ForbiddenError('Only admins and managers can resend invitations');
    }

    // 4. Get campaign, user, and organization details
    const campaign = await Campaign.findById(campaignId);
    const user = await User.findById(userId);
    const organization = await Organization.findById(assignment.organizationId);

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // 5. Send resend invitation email (with queue fallback)
    const invitationUrl = `${getBaseUrl()}/auth/campaigns/${campaign._id}/invitation/${assignment._id}`;
    
    try {
      await emailQueue.add({
        type: 'campaign_invitation_resent',
        user,
        campaign,
        organization,
        invitationUrl,
        dashboardUrl: `${getBaseUrl()}/dashboard`,
        supportUrl: `${getBaseUrl()}/support`,
      });
    } catch (queueError: any) {
      console.warn('Email queue unavailable, sending email directly:', queueError?.message || queueError);
      // Fallback to direct email sending
      await this.sendInvitationEmail(user, campaign, organization, (assignment._id as Types.ObjectId).toString());
    }

    // 6. Create audit log
    await this.createAuditLog({
      action: 'campaign_invitation_resent',
      performedBy: resentBy,
      organizationId: assignment.organizationId.toString(),
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        campaignName: campaign.name,
        userName: user.name,
        userEmail: user.email,
      },
    });

    // 7. Create activity notification
    await this.createActivity({
      type: 'campaign_invitation_resent',
      description: `${resender.name} resent campaign invitation to ${user.name} for "${campaign.name}"`,
      userId: null,
      organizationId: assignment.organizationId.toString(),
      metadata: {
        campaignId,
        campaignName: campaign.name,
        userId,
        userName: user.name,
        userEmail: user.email,
        resentBy: resender.name,
      },
    });

    return assignment;
  }

  /**
   * Accept campaign invitation
   */
  async acceptCampaignInvitation(
    campaignId: string,
    userId: string
  ): Promise<ICampaignAffiliate> {
    const assignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (!assignment) {
      throw new NotFoundError('Campaign invitation not found');
    }

    if (assignment.status !== 'pending') {
      throw new BadRequestError(`Cannot accept invitation with status: ${assignment.status}`);
    }

    // Update status to active
    assignment.status = 'active';
    await assignment.save();

    // Get campaign and user details
    const campaign = await Campaign.findById(campaignId);
    const user = await User.findById(userId);

    // Create audit log
    await this.createAuditLog({
      action: 'campaign_invitation_accepted',
      performedBy: userId,
      organizationId: assignment.organizationId.toString(),
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        campaignName: campaign?.name,
        userName: user?.name,
      },
    });

    // Notify organization about acceptance
    await this.createActivity({
      type: 'campaign_invitation_accepted',
      description: `${user?.name} accepted the invitation to join campaign "${campaign?.name}"`,
      userId: null,
      organizationId: assignment.organizationId.toString(),
      metadata: {
        campaignId,
        campaignName: campaign?.name,
        userId,
        userName: user?.name,
        userEmail: user?.email,
      },
    });

    return assignment;
  }

  /**
   * Decline campaign invitation
   */
  async declineCampaignInvitation(
    campaignId: string,
    userId: string,
    reason?: string
  ): Promise<ICampaignAffiliate> {
    const assignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (!assignment) {
      throw new NotFoundError('Campaign invitation not found');
    }

    if (assignment.status !== 'pending') {
      throw new BadRequestError(`Cannot decline invitation with status: ${assignment.status}`);
    }

    // Update status to removed
    assignment.status = 'removed';
    assignment.removedBy = new Types.ObjectId(userId);
    assignment.removedAt = new Date();
    assignment.removalReason = reason || 'Invitation declined by user';

    await assignment.save();

    // Get campaign and user details
    const campaign = await Campaign.findById(campaignId);
    const user = await User.findById(userId);

    // Create audit log
    await this.createAuditLog({
      action: 'campaign_invitation_declined',
      performedBy: userId,
      organizationId: assignment.organizationId.toString(),
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        campaignName: campaign?.name,
        userName: user?.name,
        reason,
      },
    });

    // Notify organization about decline
    await this.createActivity({
      type: 'campaign_invitation_declined',
      description: `${user?.name} declined the invitation to join campaign "${campaign?.name}"`,
      userId: null,
      organizationId: assignment.organizationId.toString(),
      metadata: {
        campaignId,
        campaignName: campaign?.name,
        userId,
        userName: user?.name,
        userEmail: user?.email,
        reason: reason || 'No reason provided',
      },
    });

    return assignment;
  }

  /**
   * Update affiliate status (suspend/reactivate)
   */
  async updateAffiliateStatus(
    campaignId: string,
    userId: string,
    status: 'active' | 'inactive' | 'suspended',
    updatedBy: string,
    reason?: string
  ): Promise<ICampaignAffiliate> {
    const assignment = await CampaignAffiliate.findOne({
      campaignId: new Types.ObjectId(campaignId),
      userId: new Types.ObjectId(userId),
    });

    if (!assignment) {
      throw new NotFoundError('User is not assigned to this campaign');
    }

    // Validate updater has permission
    const updater = await User.findById(updatedBy);
    if (!updater) {
      throw new NotFoundError('Updater not found');
    }

    const updaterOrgIds = updater.organizationId.map(id => id.toString());
    const assignmentOrgId = assignment.organizationId.toString();
    
    if (!updaterOrgIds.includes(assignmentOrgId)) {
      throw new ForbiddenError('You do not have permission to update users in this organization');
    }

    if (!['admin', 'management'].includes(updater.role)) {
      throw new ForbiddenError('Only admins and managers can update affiliate status');
    }

    const oldStatus = assignment.status;
    assignment.status = status;
    await assignment.save();

    // Create audit log
    await this.createAuditLog({
      action: 'campaign_affiliate_status_updated',
      performedBy: updatedBy,
      organizationId: assignmentOrgId,
      entityType: 'CampaignAffiliate',
      entityId: (assignment._id as Types.ObjectId).toString(),
      details: {
        campaignId,
        userId,
        oldStatus,
        newStatus: status,
        reason,
      },
    });

    return assignment;
  }

  /**
   * Get campaign application details
   */
  async getCampaignApplication(
    campaignId: string,
    userId: string
  ): Promise<any> {
    // Validate ObjectIds
    if (!campaignId || !Types.ObjectId.isValid(campaignId)) {
      throw new BadRequestError('Invalid campaign ID');
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestError('Invalid user ID');
    }

    // Get user details to check role
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has admin or management role
    if (!['admin', 'management'].includes(user.role)) {
      throw new ForbiddenError('Only admins and managers can access campaign application details');
    }

    // Get campaign details
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Verify user belongs to the same organization as the campaign
    const userOrgIds = user.organizationId.map(id => id.toString());
    const campaignOrgId = campaign.organizationId?.toString();
    
    if (!campaignOrgId || !userOrgIds.includes(campaignOrgId)) {
      throw new ForbiddenError('You do not have access to this campaign');
    }

    // Get overall campaign stats from all affiliates
    const campaignStats = await CampaignAffiliate.aggregate([
      { $match: { campaignId: new Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: '$conversions' },
          totalClicks: { $sum: '$clicks' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalCommission: { $sum: '$totalCommission' },
        },
      },
    ]);

    const stats = campaignStats[0] || {
      totalConversions: 0,
      totalClicks: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };

    // Mock application data based on campaign info
    // In a real implementation, you'd fetch this from an Application model
    const applicationData = {
      name: campaign.name || 'Campaign Application',
      logo: (campaign as any).logo || '',
      category: campaign.category || 'General',
      type: (campaign as any).type || 'Website',
      url: (campaign as any).landingPageUrl || (campaign as any).websiteUrl || '#',
      description: campaign.description || 'Campaign application for affiliate marketing',
      totalConversions: stats.totalConversions || 0,
      totalClicks: stats.totalClicks || 0,
      totalRevenue: stats.totalRevenue || 0,
      totalCommission: stats.totalCommission || 0,
      lastSync: new Date().toISOString(),
      trackingMethod: 'Webhook + API Key',
      conversionTracking: 'Active',
      promoMaterials: {
        banners: {
          available: true,
          count: 5,
          formats: ['300x250', '728x90', '160x600', '320x50', '970x250'],
        },
        textSnippets: {
          available: true,
          count: 3,
          types: ['Social Media', 'Email', 'Blog Post'],
        },
      },
      integration: {
        method: 'API Integration',
        status: 'Connected',
        lastDataSync: new Date().toISOString(),
        webhookUrl: `${process.env.API_URL || 'https://api.growviapro.com'}/webhooks/conversion/${campaignId}`,
      },
    };

    return applicationData;
  }

  /**
   * Get affiliate performance distribution
   */
  async getAffiliatePerformanceDistribution(
    organizationId: string,
    campaignId?: string
  ): Promise<any> {
    // Validate ObjectIds
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new BadRequestError('Invalid organization ID');
    }

    if (campaignId && !Types.ObjectId.isValid(campaignId)) {
      throw new BadRequestError('Invalid campaign ID');
    }

    // Build query
    const query: any = {
      organizationId: new Types.ObjectId(organizationId),
      status: 'active',
    };

    if (campaignId) {
      query.campaignId = new Types.ObjectId(campaignId);
    }

    // Get all active affiliates sorted by conversions
    const affiliates = await CampaignAffiliate.find(query)
      .sort({ conversions: -1 })
      .select('userId conversions clicks totalRevenue totalCommission');

    const totalAffiliates = affiliates.length;

    if (totalAffiliates === 0) {
      return {
        totalAffiliates: 0,
        totalConversions: 0,
        distribution: {
          topPerformers: { count: 0, conversions: 0, percentage: 0, conversionShare: 0 },
          midTier: { count: 0, conversions: 0, percentage: 0, conversionShare: 0 },
          lowActivity: { count: 0, conversions: 0, percentage: 0, conversionShare: 0 },
        },
      };
    }

    // Calculate total conversions
    const totalConversions = affiliates.reduce((sum, aff) => sum + aff.conversions, 0);

    // Calculate distribution thresholds
    const topPerformerCount = Math.max(1, Math.ceil(totalAffiliates * 0.1)); // Top 10%
    const midTierCount = Math.ceil(totalAffiliates * 0.6); // Next 60%
    const lowActivityCount = totalAffiliates - topPerformerCount - midTierCount; // Remaining 30%

    // Split affiliates into tiers
    const topPerformers = affiliates.slice(0, topPerformerCount);
    const midTier = affiliates.slice(topPerformerCount, topPerformerCount + midTierCount);
    const lowActivity = affiliates.slice(topPerformerCount + midTierCount);

    // Calculate metrics for each tier
    const topPerformersConversions = topPerformers.reduce((sum, aff) => sum + aff.conversions, 0);
    const midTierConversions = midTier.reduce((sum, aff) => sum + aff.conversions, 0);
    const lowActivityConversions = lowActivity.reduce((sum, aff) => sum + aff.conversions, 0);

    const topPerformersRevenue = topPerformers.reduce((sum, aff) => sum + aff.totalRevenue, 0);
    const midTierRevenue = midTier.reduce((sum, aff) => sum + aff.totalRevenue, 0);
    const lowActivityRevenue = lowActivity.reduce((sum, aff) => sum + aff.totalRevenue, 0);

    const topPerformersClicks = topPerformers.reduce((sum, aff) => sum + aff.clicks, 0);
    const midTierClicks = midTier.reduce((sum, aff) => sum + aff.clicks, 0);
    const lowActivityClicks = lowActivity.reduce((sum, aff) => sum + aff.clicks, 0);

    return {
      totalAffiliates,
      totalConversions,
      totalRevenue: topPerformersRevenue + midTierRevenue + lowActivityRevenue,
      totalClicks: topPerformersClicks + midTierClicks + lowActivityClicks,
      distribution: {
        topPerformers: {
          label: 'Top Performers',
          count: topPerformerCount,
          percentage: Math.round((topPerformerCount / totalAffiliates) * 100),
          conversions: topPerformersConversions,
          conversionShare: totalConversions > 0 
            ? Math.round((topPerformersConversions / totalConversions) * 100) 
            : 0,
          revenue: topPerformersRevenue,
          revenueShare: totalConversions > 0
            ? Math.round((topPerformersRevenue / (topPerformersRevenue + midTierRevenue + lowActivityRevenue)) * 100)
            : 0,
          clicks: topPerformersClicks,
          avgConversionsPerAffiliate: topPerformerCount > 0 
            ? Math.round(topPerformersConversions / topPerformerCount) 
            : 0,
        },
        midTier: {
          label: 'Mid-tier',
          count: midTierCount,
          percentage: Math.round((midTierCount / totalAffiliates) * 100),
          conversions: midTierConversions,
          conversionShare: totalConversions > 0 
            ? Math.round((midTierConversions / totalConversions) * 100) 
            : 0,
          revenue: midTierRevenue,
          revenueShare: totalConversions > 0
            ? Math.round((midTierRevenue / (topPerformersRevenue + midTierRevenue + lowActivityRevenue)) * 100)
            : 0,
          clicks: midTierClicks,
          avgConversionsPerAffiliate: midTierCount > 0 
            ? Math.round(midTierConversions / midTierCount) 
            : 0,
        },
        lowActivity: {
          label: 'Low Activity',
          count: lowActivityCount,
          percentage: Math.round((lowActivityCount / totalAffiliates) * 100),
          conversions: lowActivityConversions,
          conversionShare: totalConversions > 0 
            ? Math.round((lowActivityConversions / totalConversions) * 100) 
            : 0,
          revenue: lowActivityRevenue,
          revenueShare: totalConversions > 0
            ? Math.round((lowActivityRevenue / (topPerformersRevenue + midTierRevenue + lowActivityRevenue)) * 100)
            : 0,
          clicks: lowActivityClicks,
          avgConversionsPerAffiliate: lowActivityCount > 0 
            ? Math.round(lowActivityConversions / lowActivityCount) 
            : 0,
        },
      },
    };
  }

  /**
   * Get campaign affiliate statistics
   */
  async getCampaignAffiliateStats(campaignId: string): Promise<any> {
    const stats = await CampaignAffiliate.aggregate([
      { $match: { campaignId: new Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalClicks: { $sum: '$clicks' },
          totalConversions: { $sum: '$conversions' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalCommission: { $sum: '$totalCommission' },
        },
      },
    ]);

    const summary = {
      total: 0,
      pending: 0,
      active: 0,
      inactive: 0,
      suspended: 0,
      removed: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat._id as keyof typeof summary] = stat.count;
      summary.totalClicks += stat.totalClicks;
      summary.totalConversions += stat.totalConversions;
      summary.totalRevenue += stat.totalRevenue;
      summary.totalCommission += stat.totalCommission;
    });

    return summary;
  }

  /**
   * Send campaign invitation email
   */
  private async sendInvitationEmail(
    user: any,
    campaign: any,
    organization: any,
    assignmentId?: string
  ): Promise<void> {
    try {
      const invitationUrl = assignmentId 
        ? `${getBaseUrl()}/auth/campaigns/${campaign._id}/invitation/${assignmentId}`
        : `${getBaseUrl()}/auth/campaigns/${campaign._id}/invitation`;
      
      await sendCampaignInvitationEmail(
        user,
        campaign,
        organization,
        invitationUrl
      );
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw error - email failure shouldn't break the main operation
    }
  }

  /**
   * Create activity notification
   */
  private async createActivity(data: {
    type: string;
    description: string;
    userId: string | null;
    organizationId: string;
    metadata: any;
  }): Promise<void> {
    try {
      await Activity.create({
        type: data.type,
        description: data.description,
        userId: data.userId ? new Types.ObjectId(data.userId) : null,
        organizationId: new Types.ObjectId(data.organizationId),
        metadata: data.metadata,
      });
    } catch (error) {
      console.error('Failed to create activity:', error);
      // Don't throw error - activity failure shouldn't break the main operation
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(data: {
    action: string;
    performedBy: string;
    organizationId: string;
    entityType: string;
    entityId: string;
    details: any;
  }): Promise<void> {
    try {
      await AuditLog.create({
        action: data.action,
        performedBy: new Types.ObjectId(data.performedBy),
        organizationId: new Types.ObjectId(data.organizationId),
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error - audit log failure shouldn't break the main operation
    }
  }

  /**
   * Get marketer invitations (pending campaign assignments)
   */
  async getMarketerInvitations(
    userId: string,
    filters: CampaignAffiliateFilters = {}
  ): Promise<{ invitations: any[]; total: number }> {
    const { status, page = 1, limit = 10 } = filters;

    const query: any = {
      userId: new Types.ObjectId(userId),
      status: status || 'pending',
    };

    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      CampaignAffiliate.find(query)
        .populate({
          path: 'campaignId',
          populate: [
            { path: 'commissionModels' },
            { path: 'applicationId' },
          ],
        })
        .populate('assignedBy', 'name email')
        .populate('organizationId', 'name')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampaignAffiliate.countDocuments(query),
    ]);

    const invitations = assignments.map(assignment => ({
      invitationId: assignment._id,
      campaign: assignment.campaignId,
      organization: assignment.organizationId,
      invitedBy: assignment.assignedBy,
      invitedAt: assignment.assignedAt,
      status: assignment.status,
      participationNotes: assignment.participationNotes,
    }));

    return { invitations, total };
  }

  /**
   * Get marketer active campaigns
   */
  async getMarketerCampaigns(
    userId: string,
    filters: CampaignAffiliateFilters = {}
  ): Promise<{ campaigns: any[]; total: number }> {
    const { status, page = 1, limit = 10 } = filters;

    const query: any = {
      userId: new Types.ObjectId(userId),
      status: status || 'active',
    };

    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      CampaignAffiliate.find(query)
        .populate('campaignId')
        .populate('organizationId', 'name')
        .sort({ assignedAt: -1 })
        .skip(skip)
        .limit(limit),
      CampaignAffiliate.countDocuments(query),
    ]);

    const campaigns = assignments.map(assignment => ({
      assignmentId: assignment._id,
      campaign: assignment.campaignId,
      organization: assignment.organizationId,
      joinedAt: assignment.assignedAt,
      status: assignment.status,
      performance: {
        clicks: assignment.clicks,
        conversions: assignment.conversions,
        revenue: assignment.totalRevenue,
        commission: assignment.totalCommission,
      },
    }));

    return { campaigns, total };
  }

  /**
   * Get marketer campaign details
   */
  async getMarketerCampaignDetails(userId: string, campaignId: string): Promise<any> {
    const assignment = await CampaignAffiliate.findOne({
      userId: new Types.ObjectId(userId),
      campaignId: new Types.ObjectId(campaignId),
    })
      .populate('campaignId')
      .populate('organizationId', 'name email')
      .populate('assignedBy', 'name email');

    if (!assignment) {
      throw new NotFoundError('You are not assigned to this campaign');
    }

    const campaign = await Campaign.findById(campaignId).populate('commissionModels');

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    return {
      assignmentId: assignment._id,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        category: campaign.category,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        status: campaign.status,
        visibility: campaign.visibility,
        commissionModels: campaign.commissionModels,
        affiliateRequirements: campaign.affiliateRequirements,
      },
      organization: assignment.organizationId,
      assignedBy: assignment.assignedBy,
      joinedAt: assignment.assignedAt,
      assignmentStatus: assignment.status,
      kycVerified: assignment.kycVerified,
      participationNotes: assignment.participationNotes,
    };
  }

  /**
   * Get marketer campaign performance metrics
   */
  async getMarketerCampaignPerformance(userId: string, campaignId: string): Promise<any> {
    const assignment = await CampaignAffiliate.findOne({
      userId: new Types.ObjectId(userId),
      campaignId: new Types.ObjectId(campaignId),
    });

    if (!assignment) {
      throw new NotFoundError('You are not assigned to this campaign');
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    // Calculate conversion rate
    const conversionRate = assignment.clicks > 0 
      ? ((assignment.conversions / assignment.clicks) * 100).toFixed(2)
      : '0.00';

    // Calculate average revenue per conversion
    const avgRevenuePerConversion = assignment.conversions > 0
      ? (assignment.totalRevenue / assignment.conversions).toFixed(2)
      : '0.00';

    // Calculate average commission per conversion
    const avgCommissionPerConversion = assignment.conversions > 0
      ? (assignment.totalCommission / assignment.conversions).toFixed(2)
      : '0.00';

    return {
      campaignName: campaign.name,
      assignmentStatus: assignment.status,
      metrics: {
        clicks: assignment.clicks,
        conversions: assignment.conversions,
        conversionRate: `${conversionRate}%`,
        totalRevenue: assignment.totalRevenue,
        totalCommission: assignment.totalCommission,
        avgRevenuePerConversion: parseFloat(avgRevenuePerConversion),
        avgCommissionPerConversion: parseFloat(avgCommissionPerConversion),
      },
      period: {
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        joinedAt: assignment.assignedAt,
      },
    };
  }

  /**
   * Get marketer campaign earnings breakdown
   */
  async getMarketerCampaignEarnings(userId: string, campaignId: string): Promise<any> {
    const assignment = await CampaignAffiliate.findOne({
      userId: new Types.ObjectId(userId),
      campaignId: new Types.ObjectId(campaignId),
    }).populate('campaignId');

    if (!assignment) {
      throw new NotFoundError('You are not assigned to this campaign');
    }

    const campaign = await Campaign.findById(campaignId).populate('commissionModels');

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    return {
      campaignName: campaign.name,
      assignmentStatus: assignment.status,
      earnings: {
        totalCommission: assignment.totalCommission,
        totalRevenue: assignment.totalRevenue,
        conversions: assignment.conversions,
        clicks: assignment.clicks,
      },
      commissionModels: campaign.commissionModels,
      paymentStatus: 'pending',
      nextPayoutDate: null,
      currency: 'NGN',
    };
  }
}

export const campaignAffiliateService = new CampaignAffiliateService();
