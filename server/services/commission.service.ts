import mongoose, { Types } from 'mongoose';
import { Commission, ICommission } from '../models/CommissionModel';
import { Organization } from '../models/Organization';
import { BadRequestError, NotFoundError } from '../utils/errors';
interface CreateCommissionInput {
  name: string;
  description?: string | undefined;
  type: string;
  conversionEvent?: string | undefined;
  payout: {
    amount: number;
    isPercentage: boolean;
    currency?: string | undefined;
    baseField?: string | undefined;
    conversionValueEstimate?: number | undefined;
  };
  maxPerMarketer?: number | null | undefined;
  maxTotalPayout?: number | null | undefined;
  validationMethod: string;
  webhookUrl?: string | undefined;
  secretToken?: string | undefined;
  oneConversionPerUser?: boolean | undefined;
  minSessionDuration?: number | null | undefined;
  fraudDetection: {
    conversionDelay?: number | null | undefined;
    ipRestriction?: string | null | undefined;
    deviceFingerprintChecks?: boolean | undefined;
    duplicateEmailPhoneBlock?: boolean | undefined;
    geoTargeting?: string[] | null | undefined;
    minimumOrderValue?: number | null | undefined;
    conversionSpikeAlert?: boolean | undefined;
    cookieTamperDetection?: boolean | undefined;
    affiliateBlacklist?: boolean | undefined;
    kycVerifiedOnly?: boolean | undefined;
  };
  organizationId?: Types.ObjectId | undefined;
  saveAndCreate?: boolean | undefined;
  duplicate?: boolean | undefined;
}

interface UpdateCommissionInput {
  name?: string | undefined;
  description?: string | undefined;
  type?: string | undefined;
  conversionEvent?: string | undefined;
  payout?: {
    amount?: number | undefined;
    isPercentage?: boolean | undefined;
    currency?: string | undefined;
    baseField?: string | undefined;
    conversionValueEstimate?: number | undefined;
  } | undefined;
  maxPerMarketer?: number | null | undefined;
  maxTotalPayout?: number | null | undefined;
  validationMethod?: string | undefined;
  webhookUrl?: string | undefined;
  secretToken?: string | undefined;
  oneConversionPerUser?: boolean | undefined;
  minSessionDuration?: number | null | undefined;
  fraudDetection?: {
    conversionDelay?: number | null | undefined;
    ipRestriction?: string | null | undefined;
    deviceFingerprintChecks?: boolean | undefined;
    duplicateEmailPhoneBlock?: boolean | undefined;
    geoTargeting?: string[] | null | undefined;
    minimumOrderValue?: number | null | undefined;
    conversionSpikeAlert?: boolean | undefined;
    cookieTamperDetection?: boolean | undefined;
    affiliateBlacklist?: boolean | undefined;
    kycVerifiedOnly?: boolean | undefined;
  } | undefined;
  organizationId?: Types.ObjectId | undefined;
  saveAndCreate?: boolean | undefined;
  duplicate?: boolean | undefined;
}

interface CommissionStats {
  totalModels: number;
  activeModels: number;
}

export class CommissionService {
  async createCommission(data: CreateCommissionInput): Promise<ICommission> {
    if (data.organizationId) {
      const organization = await Organization.findById(data.organizationId);
      if (!organization) {
        throw new NotFoundError('Organization not found');
      }
    }
    
    const commission = new Commission({
      ...data,
      organizationId: data.organizationId || null,
      payoutDelay: data.fraudDetection.conversionDelay || 0,
      oneConversionPerUser: data.oneConversionPerUser || data.fraudDetection.duplicateEmailPhoneBlock || false,
      minSessionDuration: data.minSessionDuration || null,
      webhookUrl: data.webhookUrl || null,
      secretToken: data.secretToken || null,
    });

    await commission.save();
    return commission;
  }

  async getCommissionById(id: string): Promise<ICommission> {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new NotFoundError('Commission model not found');
    }
    return commission;
  }

  async getCommissionsByOrganization(organizationId: string): Promise<ICommission[]> {
    return Commission.find({ organizationId: new Types.ObjectId(organizationId) });
  }

  async updateCommission(id: string, data: UpdateCommissionInput): Promise<ICommission> {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new NotFoundError('Commission model not found');
    }

    const updateData = {
      ...data,
      payoutDelay: data.fraudDetection?.conversionDelay !== undefined ? 
                   data.fraudDetection.conversionDelay : 
                   commission.payoutDelay,
      oneConversionPerUser: data.oneConversionPerUser !== undefined ? data.oneConversionPerUser :
                           data.fraudDetection?.duplicateEmailPhoneBlock !== undefined ? 
                           data.fraudDetection.duplicateEmailPhoneBlock : 
                           commission.oneConversionPerUser,
    };

    Object.assign(commission, updateData);
    await commission.save();
    return commission;
  }

  async duplicateCommission(id: string, organizationId: Types.ObjectId): Promise<ICommission> {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new NotFoundError('Commission model not found');
    }

    const newCommission = new Commission({
      ...commission.toObject(),
      _id: new mongoose.Types.ObjectId(),
      name: `${commission.name} (Copy)`,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newCommission.save();
    return newCommission;
  }

  async deleteCommission(id: string): Promise<void> {
    const commission = await Commission.findById(id);
    if (!commission) {
      throw new NotFoundError('Commission model not found');
    }

    await commission.deleteOne();
  }

  async getOrganizationCommissionStats(organizationId: string): Promise<CommissionStats> {
    console.log("Organization ID:", organizationId);
    const stats = await Commission.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          totalModels: { $sum: 1 },
          activeModels: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalModels: 1,
          activeModels: 1,
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : { totalModels: 0, activeModels: 0 };
  }
}

export const commissionService = new CommissionService();