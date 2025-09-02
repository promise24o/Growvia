import mongoose, { Types } from 'mongoose';
import { Commission, ICommission } from '../models/CommissionModel';
import { Organization } from '../models/Organization';
import { BadRequestError, NotFoundError } from '../utils/errors';

interface CreateCommissionInput {
  name: string;
  description?: string;
  type: string;
  conversionEvent?: string;
  payout: {
    amount: number;
    isPercentage: boolean;
    currency?: string;
    baseField?: string;
  };
  maxPerMarketer?: number | null;
  maxTotalPayout?: number | null;
  validationMethod: string;
  fraudDetection: {
    conversionDelay?: number | null;
    ipRestriction?: string | null;
    deviceFingerprintChecks?: boolean;
    duplicateEmailPhoneBlock?: boolean;
    geoTargeting?: string[] | null;
    minimumOrderValue?: number | null;
    conversionSpikeAlert?: boolean;
    cookieTamperDetection?: boolean;
    affiliateBlacklist?: boolean;
    kycVerifiedOnly?: boolean;
  };
  organizationId?: Types.ObjectId;
}

interface UpdateCommissionInput extends Partial<CreateCommissionInput> {}

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
      oneConversionPerUser: data.fraudDetection.duplicateEmailPhoneBlock || false,
      minSessionDuration: null, // Not used in frontend, set to null
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
      payoutDelay: data.fraudDetection?.conversionDelay || commission.payoutDelay,
      oneConversionPerUser: data.fraudDetection?.duplicateEmailPhoneBlock !== undefined 
        ? data.fraudDetection.duplicateEmailPhoneBlock 
        : commission.oneConversionPerUser,
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
}

export const commissionService = new CommissionService();