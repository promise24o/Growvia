import { Campaign } from '../models/CampaignModel';
import MarketerApplication from '../models/MarketerApplication';
import { SavedCampaign } from '../models/SavedCampaign';
import { User } from '../models/User';
import { CampaignAffiliate } from '../models/CampaignAffiliate';
import mongoose from 'mongoose';

export interface MarketplaceFilters {
  categories?: string[] | undefined;
  conversionTypes?: string[] | undefined;
  validationMethods?: string[] | undefined;
  payoutTypes?: string[] | undefined;
  sortBy?: string | undefined;
  payoutRange?: number[] | undefined;
  minPayout?: number | undefined;
  maxPayout?: number | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

class MarketplaceService {
  async getMarketplaceCampaigns(userId: string, filters: MarketplaceFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = {
      visibility: 'public',
      status: 'active'
    };

    // Category filter (case-insensitive)
    if (filters.categories && filters.categories.length > 0) {
      // For string fields, use $or with individual regex matches instead of $in
      const categoryConditions = filters.categories.map(cat => ({
        category: { $regex: `^${cat}$`, $options: 'i' }
      }));
      
      if (query.$or) {
        query.$or.push(...categoryConditions);
      } else {
        query.$or = categoryConditions;
      }
    }

    // Search filter
    if (filters.search) {
      const fuzzySearch = filters.search.split('').join('.*');
      query.$or = [
        { name: { $regex: fuzzySearch, $options: 'i' } },
        { description: { $regex: fuzzySearch, $options: 'i' } }
      ];
    }

    // Store commission filters to apply after population
    const minPayout = filters.minPayout || (filters.payoutRange ? filters.payoutRange[0] : undefined);
    const maxPayout = filters.maxPayout || (filters.payoutRange ? filters.payoutRange[1] : undefined);
    const hasCommissionFilters = 
      (filters.conversionTypes && filters.conversionTypes.length > 0) ||
      (filters.validationMethods && filters.validationMethods.length > 0) ||
      (filters.payoutTypes && filters.payoutTypes.length > 0) ||
      minPayout !== undefined ||
      maxPayout !== undefined;

    // Sorting logic
    let sortQuery: any = { createdAt: -1 };
    
    switch (filters.sortBy) {
      case 'highest_payout':
        sortQuery = { 'commissionModels.value': -1 };
        break;
      case 'best_conversion':
        sortQuery = { 'expectedConversionsPerAffiliate': -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'recommended':
        // For recommended, we'll handle separately after fetching
        sortQuery = { createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Fetch campaigns with populated commission models
    let campaigns = await Campaign.find(query)
      .populate('organizationId', 'name logo')
      .populate('commissionModels')
      .sort(sortQuery)
      .lean();

    // Apply commission model filters after population
    if (hasCommissionFilters) {
      campaigns = campaigns.filter(campaign => {
        const commissionModels = campaign.commissionModels as any[];
        if (!commissionModels || commissionModels.length === 0) return false;

        return commissionModels.some(model => {
          // Filter by conversion type (commission.type)
          if (filters.conversionTypes && filters.conversionTypes.length > 0) {
            if (!filters.conversionTypes.includes(model.type)) return false;
          }

          // Filter by validation method
          if (filters.validationMethods && filters.validationMethods.length > 0) {
            if (!filters.validationMethods.includes(model.validationMethod)) return false;
          }

          // Filter by payout type (fixed vs percentage)
          if (filters.payoutTypes && filters.payoutTypes.length > 0) {
            const payoutType = model.payout?.isPercentage ? 'percentage' : 'fixed';
            if (!filters.payoutTypes.includes(payoutType)) return false;
          }

          // Filter by payout range
          if (minPayout !== undefined || maxPayout !== undefined) {
            const amount = model.payout?.amount;
            if (amount === undefined) return false;
            if (minPayout !== undefined && amount < minPayout) return false;
            if (maxPayout !== undefined && amount > maxPayout) return false;
          }

          return true;
        });
      });
    }

    // Apply pagination after filtering
    const total = campaigns.length;
    campaigns = campaigns.slice(skip, skip + limit);


    let campaignsWithApplicationStatus = await Promise.all(
      campaigns.map(async (campaign) => {
        const application = await MarketerApplication.findOne({
          user: userId,
          organizationId: campaign.organizationId
        });

        const saved = await SavedCampaign.findOne({
          userId,
          campaignId: campaign._id
        });

        return {
          ...campaign,
          id: campaign._id,
          title: campaign.name,
          brandName: (campaign.organizationId as any)?.name || 'Unknown',
          commissionModel: 'percentage',
          commissionValue: 0,
          userApplication: application ? { status: application.status } : null,
          isSaved: !!saved
        };
      })
    );

    // Handle recommended sorting
    if (filters.sortBy === 'recommended') {
      const user = await User.findById(userId).lean();
      if (user) {
        const affiliateHistory = await CampaignAffiliate.find({
          userId: new mongoose.Types.ObjectId(userId),
          status: { $in: ['active', 'inactive'] }
        })
          .populate('campaignId')
          .lean();

        // Score each campaign
        const scoredCampaigns = await Promise.all(
          campaignsWithApplicationStatus.map(async (campaign) => {
            const score = await this.calculateRecommendationScore(
              campaign,
              user,
              affiliateHistory
            );
            return {
              ...campaign,
              matchScore: score.matchScore
            };
          })
        );

        // Sort by match score
        campaignsWithApplicationStatus = scoredCampaigns.sort((a, b) => 
          (b.matchScore || 0) - (a.matchScore || 0)
        );
      }
    }

    return {
      campaigns: campaignsWithApplicationStatus,
      total,
      page,
      limit
    };
  }

  async getRecommendations(userId: string, limit: number = 10) {
    // Get user data for scoring
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's affiliate performance history
    const affiliateHistory = await CampaignAffiliate.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: ['active', 'inactive'] }
    })
      .populate('campaignId')
      .lean();

    // Smart filters: exclude campaigns that don't meet basic criteria
    const eligibleCampaigns = await Campaign.find({
      visibility: 'public',
      status: 'active'
    })
      .populate('organizationId', 'name logo')
      .populate('commissionModels')
      .lean();

    // Score each campaign
    const scoredCampaigns = await Promise.all(
      eligibleCampaigns.map(async (campaign) => {
        const score = await this.calculateRecommendationScore(
          campaign,
          user,
          affiliateHistory
        );
        return {
          campaign,
          ...score
        };
      })
    );

    // Sort by match score and return top N
    const recommendations = scoredCampaigns
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(rec => ({
        campaignId: rec.campaign._id,
        campaignName: rec.campaign.name,
        organizationName: (rec.campaign.organizationId as any)?.name || 'Unknown',
        category: rec.campaign.category,
        matchScore: rec.matchScore,
        matchReasons: rec.matchReasons
      }));

    return recommendations;
  }

  private async calculateRecommendationScore(
    campaign: any,
    user: any,
    affiliateHistory: any[]
  ): Promise<{ matchScore: number; matchReasons: string[] }> {
    const reasons: string[] = [];
    let totalScore = 0;

    // 1️⃣ Category Match (0-25 points)
    const categoryScore = this.scoreCategoryMatch(campaign, user, affiliateHistory, reasons);
    totalScore += categoryScore;

    // 2️⃣ Affiliate Performance Fit (0-20 points)
    const performanceScore = this.scorePerformanceFit(campaign, affiliateHistory, reasons);
    totalScore += performanceScore;

    // 3️⃣ Campaign Quality (0-15 points)
    const qualityScore = this.scoreCampaignQuality(campaign, reasons);
    totalScore += qualityScore;

    // 4️⃣ Budget & Capacity Health (0-15 points)
    const budgetScore = await this.scoreBudgetHealth(campaign, reasons);
    totalScore += budgetScore;

    // 5️⃣ Trust & Safety Fit (0-15 points)
    const trustScore = this.scoreTrustFit(campaign, user, reasons);
    totalScore += trustScore;

    // 6️⃣ Freshness & Momentum (0-10 points)
    const freshnessScore = this.scoreFreshness(campaign, reasons);
    totalScore += freshnessScore;

    return {
      matchScore: Math.round(totalScore),
      matchReasons: reasons
    };
  }

  private scoreCategoryMatch(
    campaign: any,
    user: any,
    affiliateHistory: any[],
    reasons: string[]
  ): number {
    const campaignCategory = campaign.category;
    
    // Get user's past campaign categories
    const pastCategories = affiliateHistory
      .map(aff => aff.campaignId?.category)
      .filter(Boolean);

    // Check for exact match
    if (pastCategories.includes(campaignCategory)) {
      reasons.push(`Matches your top-performing category: ${campaignCategory}`);
      return 25;
    }

    // Check user's industry focus
    if (user.industryFocus && user.industryFocus === campaignCategory) {
      reasons.push(`Aligns with your industry focus: ${campaignCategory}`);
      return 20;
    }

    // Related categories (basic heuristic)
    const relatedCategories: Record<string, string[]> = {
      'SaaS': ['Technology', 'Software'],
      'Technology': ['SaaS', 'Software'],
      'E-commerce': ['Retail', 'Fashion'],
      'Finance': ['Banking', 'Insurance'],
      'Health': ['Wellness', 'Fitness']
    };

    const related = relatedCategories[campaignCategory] || [];
    const hasRelated = pastCategories.some(cat => related.includes(cat));
    
    if (hasRelated) {
      reasons.push(`Related to your experience in ${pastCategories[0]}`);
      return 15;
    }

    return 0;
  }

  private scorePerformanceFit(
    campaign: any,
    affiliateHistory: any[],
    reasons: string[]
  ): number {
    if (affiliateHistory.length === 0) {
      reasons.push('New affiliate - great opportunity to start');
      return 12; // Neutral score for new affiliates
    }

    // Calculate affiliate's average conversion rate
    const totalConversions = affiliateHistory.reduce((sum, aff) => sum + (aff.conversions || 0), 0);
    const totalClicks = affiliateHistory.reduce((sum, aff) => sum + (aff.clicks || 0), 0);
    const affiliateConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Get campaign's expected conversions
    const expectedConversions = campaign.expectedConversionsPerAffiliate || 10;
    const avgConversionsPerAffiliate = affiliateHistory.length > 0 
      ? totalConversions / affiliateHistory.length 
      : 0;

    if (avgConversionsPerAffiliate >= expectedConversions * 1.2) {
      reasons.push('Your performance exceeds campaign expectations');
      return 20;
    } else if (avgConversionsPerAffiliate >= expectedConversions * 0.8) {
      reasons.push('Your performance aligns well with campaign goals');
      return 15;
    } else if (avgConversionsPerAffiliate >= expectedConversions * 0.5) {
      reasons.push('Good growth opportunity for your profile');
      return 8;
    }

    return 5;
  }

  private scoreCampaignQuality(campaign: any, reasons: string[]): number {
    let score = 0;

    // Clear description
    if (campaign.description && campaign.description.length >= 50) {
      score += 5;
    }

    // Affiliate requirements provided
    if (campaign.affiliateRequirements && Object.keys(campaign.affiliateRequirements).length > 0) {
      score += 5;
      reasons.push('Clear affiliate requirements provided');
    }

    // Multiple commission models
    if (campaign.commissionModels && campaign.commissionModels.length > 1) {
      score += 5;
      reasons.push('Flexible commission structure available');
    } else if (campaign.commissionModels && campaign.commissionModels.length === 1) {
      score += 3;
    }

    return score;
  }

  private async scoreBudgetHealth(campaign: any, reasons: string[]): Promise<number> {
    // Get current affiliate count
    const currentAffiliates = await CampaignAffiliate.countDocuments({
      campaignId: campaign._id,
      status: { $in: ['active', 'pending'] }
    });

    const maxAffiliates = campaign.maxAffiliates || 100;
    const capacityUsed = maxAffiliates > 0 ? (currentAffiliates / maxAffiliates) * 100 : 0;

    // Budget health
    const totalBudget = campaign.budgetCalculation?.totalBudget || 0;
    const safetyBuffer = campaign.safetyBufferPercent || 0;

    if (capacityUsed < 50 && totalBudget > 1000 && safetyBuffer >= 10) {
      reasons.push('Campaign has healthy budget and open slots');
      return 15;
    } else if (capacityUsed < 75 && totalBudget > 500) {
      reasons.push('Good availability and budget');
      return 10;
    } else if (capacityUsed < 90) {
      return 5;
    }

    return 3;
  }

  private scoreTrustFit(campaign: any, user: any, reasons: string[]): number {
    let score = 15; // Start with full trust score

    // Check affiliate requirements
    const requirements = campaign.affiliateRequirements || {};

    // Minimum followers/audience check
    if (requirements.minFollowers && user.socialMedia) {
      const hasSocialMedia = Object.values(user.socialMedia).some(val => val);
      if (hasSocialMedia) {
        score = 15;
      } else {
        score = 8;
      }
    }

    // Skills match
    if (requirements.requiredSkills && user.skills) {
      const hasMatchingSkills = requirements.requiredSkills.some((req: string) =>
        user.skills.some((skill: string) => skill.toLowerCase().includes(req.toLowerCase()))
      );
      if (hasMatchingSkills) {
        reasons.push('Your skills match campaign requirements');
        score = 15;
      }
    }

    // Geographic restrictions
    if (requirements.allowedCountries && user.country) {
      const isAllowed = requirements.allowedCountries.includes(user.country);
      if (isAllowed) {
        score = 15;
      } else {
        score = 0;
      }
    }

    if (score >= 12) {
      reasons.push('You meet all campaign requirements');
    }

    return score;
  }

  private scoreFreshness(campaign: any, reasons: string[]): number {
    const now = new Date();
    const startDate = new Date(campaign.startDate || campaign.createdAt);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // New campaigns (less than 7 days)
    if (daysSinceStart < 7) {
      reasons.push('🔥 New campaign - early bird advantage');
      return 10;
    }

    // Recent campaigns (less than 30 days)
    if (daysSinceStart < 30) {
      reasons.push('Active and trending campaign');
      return 8;
    }

    // Stable campaigns (30-90 days)
    if (daysSinceStart < 90) {
      return 6;
    }

    // Older campaigns
    return 3;
  }

  async applyToCampaign(userId: string, campaignId: string, applicationData: any) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user has already applied to this specific campaign
    const existingCampaignApplication = await CampaignAffiliate.findOne({
      userId,
      campaignId
    });

    if (existingCampaignApplication) {
      throw new Error('You have already applied to this campaign');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const campaignAffiliate = await CampaignAffiliate.create({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: campaign.organizationId,
      status: 'pending',
      assignedBy: new mongoose.Types.ObjectId(userId), // User assigns themselves
      participationNotes: applicationData.experience || '',
      kycVerified: false,
      source: 'marketplace'
    });

    return campaignAffiliate;
  }

  async toggleSavedCampaign(userId: string, campaignId: string) {
    const existing = await SavedCampaign.findOne({ userId, campaignId });

    if (existing) {
      await SavedCampaign.deleteOne({ userId, campaignId });
      return { isSaved: false };
    }

    await SavedCampaign.create({ userId, campaignId });
    return { isSaved: true };
  }

  async getSavedCampaigns(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [savedCampaigns, total] = await Promise.all([
      SavedCampaign.find({ userId })
        .populate({
          path: 'campaignId',
          populate: { path: 'organizationId', select: 'name logo' }
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      SavedCampaign.countDocuments({ userId })
    ]);

    const campaigns = savedCampaigns
      .filter(sc => sc.campaignId)
      .map(sc => {
        const campaign = sc.campaignId as any;
        return {
          ...campaign,
          id: campaign._id,
          title: campaign.name,
          brandName: campaign.organizationId?.name || 'Unknown',
          isSaved: true
        };
      });

    return { campaigns, total };
  }

  async getUserApplications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      MarketerApplication.find({ user: userId })
        .populate('organizationId', 'name logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MarketerApplication.countDocuments({ user: userId })
    ]);

    return { applications, total };
  }

  async getCampaignById(userId: string, campaignId: string) {
    const campaign = await Campaign.findOne({
      _id: campaignId,
      visibility: 'public',
      status: 'active'
    })
      .populate('organizationId', 'name logo description website')
      .populate('commissionModels')
      .lean();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const [application, saved] = await Promise.all([
      MarketerApplication.findOne({
        user: userId,
        organizationId: campaign.organizationId
      }),
      SavedCampaign.findOne({
        userId,
        campaignId: campaign._id
      })
    ]);

    return {
      ...campaign,
      id: campaign._id,
      title: campaign.name,
      brandName: (campaign.organizationId as any)?.name || 'Unknown',
      commissionModel: 'percentage',
      commissionValue: 0,
      userApplication: application ? { status: application.status } : null,
      isSaved: !!saved
    };
  }
}

export const marketplaceService = new MarketplaceService();
