import { Types } from 'mongoose';
import axios from 'axios';
import { KYC, KYCTier, KYCStatus, DocumentType, IKYC } from '../models/KYC';
import { User } from '../models/User';
import { PayoutMethod } from '../models/PayoutMethod';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { fileService } from './file.service';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY_TEST;

export class KYCService {
  /**
   * Get or create KYC record for user
   */
  async getOrCreateKYC(userId: string): Promise<IKYC> {
    let kyc = await KYC.findOne({ userId: new Types.ObjectId(userId) });

    if (!kyc) {
      const user = await User.findById(userId);
      const emailVerified = user?.status === 'active';

      kyc = await KYC.create({
        userId: new Types.ObjectId(userId),
        tier: emailVerified ? KYCTier.BLOOM : KYCTier.SPROUT,
        status: emailVerified ? KYCStatus.APPROVED : KYCStatus.PENDING,
        emailVerified,
        dailyPurchaseLimit: emailVerified ? 1000000 : 20000,
        portfolioMaxBalance: emailVerified ? 2000000 : 50000,
        maxWithdrawalAmount: emailVerified ? 500000 : 0,
        dailyWithdrawalLimit: emailVerified ? 2000000 : 0,
        withdrawalsEnabled: emailVerified,
      });
    }

    return kyc;
  }


  /**
   * Verify BVN via Paystack
   */
  async verifyBVN(userId: string, bvn: string, dateOfBirth: string): Promise<void> {
    if (!bvn || !dateOfBirth) {
      throw new BadRequestError('BVN and date of birth are required');
    }

    const kyc = await this.getOrCreateKYC(userId);

    // Check if email is verified (user status is active)
    const user = await User.findById(userId);
    if (!user || user.status !== 'active') {
      throw new BadRequestError('Please verify your email first.');
    }

    // Check if user has bank details in payout methods
    const payoutMethod = await PayoutMethod.findOne({
      userId: new Types.ObjectId(userId),
      type: 'bank_account'
    });

    if (!payoutMethod) {
      throw new BadRequestError('Please add your bank account details first before verifying BVN.');
    }

    const { accountNumber, bankCode, accountName } = payoutMethod.bankDetails;

    if (!accountNumber || !bankCode) {
      throw new BadRequestError('Bank account number and bank code are required for BVN verification.');
    }

    // Validate that account name matches user's registered name
    const normalizeString = (str: string) => {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    const userNameNormalized = normalizeString(user.name);
    const accountNameNormalized = normalizeString(accountName);

    // Split names into parts and check if they match (order-independent)
    const userNameParts = userNameNormalized.split(' ').filter(Boolean);
    const accountNameParts = accountNameNormalized.split(' ').filter(Boolean);

    const nameMatches = userNameParts.every(userPart =>
      accountNameParts.some(accountPart =>
        accountPart.includes(userPart) || userPart.includes(accountPart)
      )
    );

    if (!nameMatches) {
      throw new BadRequestError(
        `Account name mismatch: Your bank account name "${accountName}" does not match your registered name "${user.name}". Please update your bank account details.`
      );
    }

    try {
      // Match BVN with bank account using Paystack
      const response = await axios.post(
        'https://api.paystack.co/bvn/match',
        {
          bvn,
          account_number: accountNumber,
          bank_code: bankCode,
          first_name: user.name.split(' ')[0],
          last_name: user.name.split(' ').slice(1).join(' ') || user.name.split(' ')[0],
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(response.data)

      if (response.data.status && response.data.data) {
        const bvnData = response.data.data;

        // Paystack BVN match returns boolean values for first_name and last_name
        // true means they match, false means they don't
        if (bvnData.first_name !== true || bvnData.last_name !== true) {
          throw new BadRequestError(
            `Name mismatch: Your registered name "${user.name}" does not match the BVN records.` 
          );
        }

        // Split user name for storage
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        kyc.bvnData = {
          bvn,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth,
          phoneNumber: user.phone || '',
          verifiedAt: new Date(),
        };
        kyc.bvnVerifiedAt = new Date();
        kyc.tier = KYCTier.BLOOM;
        kyc.status = KYCStatus.APPROVED;

        // Update financial limits for Bloom tier
        kyc.dailyPurchaseLimit = 1000000;
        kyc.portfolioMaxBalance = 2000000;
        kyc.maxWithdrawalAmount = 500000;
        kyc.dailyWithdrawalLimit = 2000000;
        kyc.withdrawalsEnabled = true;

        await kyc.save();
      } else {
        throw new BadRequestError('BVN verification failed. Please check your details.');
      }
    } catch (error: any) {
      console.error('BVN verification error:', error.response?.data || error.message);

      if (error instanceof BadRequestError) {
        throw error;
      }

      throw new BadRequestError('BVN verification failed. Please try again.');
    }
  }

  /**
   * Upload document for Tier 2 verification
   */
  async uploadDocument(
    userId: string,
    documentType: DocumentType,
    file: Express.Multer.File
  ): Promise<string> {
    const kyc = await this.getOrCreateKYC(userId);

    // Check if Tier 1 is complete
    if (kyc.tier !== KYCTier.BLOOM || !kyc.bvnVerifiedAt) {
      throw new BadRequestError('Please complete Tier 1 verification (BVN) first.');
    }

    // Upload file to Backblaze and get public URL
    const documentUrl = await fileService.uploadFile(file, {
      userId,
      bucketFolder: 'kyc/documents',
      fileNamePrefix: `${documentType}`,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
      activityDescription: `Uploaded ${documentType} for KYC verification`,
    });

    // Add document
    kyc.documents.push({
      type: documentType,
      url: documentUrl,
      uploadedAt: new Date(),
      status: KYCStatus.PENDING,
    });

    kyc.status = KYCStatus.UNDER_REVIEW;
    kyc.submittedAt = new Date();

    await kyc.save();

    return documentUrl;
  }

  /**
   * Upload selfie for Tier 2 verification
   */
  async uploadSelfie(userId: string, file: Express.Multer.File): Promise<string> {
    const kyc = await this.getOrCreateKYC(userId);

    if (kyc.tier !== KYCTier.BLOOM) {
      throw new BadRequestError('Please complete Tier 1 verification first.');
    }

    // Upload file to Backblaze and get public URL
    const selfieUrl = await fileService.uploadFile(file, {
      userId,
      bucketFolder: 'kyc/selfies',
      fileNamePrefix: 'selfie',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
      activityDescription: 'Uploaded selfie for KYC verification',
    });

    kyc.selfieUrl = selfieUrl;
    kyc.status = KYCStatus.UNDER_REVIEW;

    await kyc.save();

    return selfieUrl;
  }

  /**
   * Approve Tier 2 verification (Admin only)
   */
  async approveTier2(userId: string, reviewerId: string): Promise<void> {
    const kyc = await this.getOrCreateKYC(userId);

    if (kyc.tier !== KYCTier.BLOOM) {
      throw new BadRequestError('User must be at Tier 1 (Bloom) to upgrade to Tier 2.');
    }

    if (!kyc.selfieUrl || kyc.documents.length === 0) {
      throw new BadRequestError('User must upload documents and selfie for Tier 2 verification.');
    }

    // Approve all documents
    kyc.documents.forEach(doc => {
      doc.status = KYCStatus.APPROVED;
    });

    kyc.tier = KYCTier.THRIVE;
    kyc.status = KYCStatus.APPROVED;
    kyc.selfieVerifiedAt = new Date();
    kyc.reviewedBy = new Types.ObjectId(reviewerId);
    kyc.reviewedAt = new Date();

    // Update financial limits for Thrive tier
    kyc.dailyPurchaseLimit = 5000000;
    kyc.portfolioMaxBalance = 10000000;
    kyc.maxWithdrawalAmount = 3000000;
    kyc.dailyWithdrawalLimit = 10000000;
    kyc.withdrawalsEnabled = true;

    await kyc.save();
  }

  /**
   * Reject Tier 2 verification (Admin only)
   */
  async rejectTier2(userId: string, reviewerId: string, reason: string): Promise<void> {
    const kyc = await this.getOrCreateKYC(userId);

    kyc.status = KYCStatus.REJECTED;
    kyc.rejectionReason = reason;
    kyc.reviewedBy = new Types.ObjectId(reviewerId);
    kyc.reviewedAt = new Date();

    await kyc.save();
  }

  /**
   * Get KYC status and limits
   */
  async getKYCStatus(userId: string) {
    const user = await User.findById(userId);
    const kyc = await this.getOrCreateKYC(userId);

    // Update email verification status from user model
    const emailVerified = user?.status === 'active';
    if (emailVerified && !kyc.emailVerified) {
      kyc.emailVerified = true;
      kyc.tier = KYCTier.BLOOM;
      kyc.status = KYCStatus.APPROVED;
      kyc.dailyPurchaseLimit = 1000000;
      kyc.portfolioMaxBalance = 2000000;
      kyc.maxWithdrawalAmount = 500000;
      kyc.dailyWithdrawalLimit = 2000000;
      kyc.withdrawalsEnabled = true;
      await kyc.save();
    }

    return {
      tier: kyc.tier,
      status: kyc.status,
      emailVerified,
      bvnVerified: !!kyc.bvnVerifiedAt,
      documentsSubmitted: kyc.documents.length > 0,
      selfieSubmitted: !!kyc.selfieUrl,
      limits: {
        dailyPurchaseLimit: kyc.dailyPurchaseLimit,
        portfolioMaxBalance: kyc.portfolioMaxBalance,
        maxWithdrawalAmount: kyc.maxWithdrawalAmount,
        dailyWithdrawalLimit: kyc.dailyWithdrawalLimit,
        withdrawalsEnabled: kyc.withdrawalsEnabled,
      },
      nextTierRequirements: this.getNextTierRequirements(kyc, emailVerified),
      rejectionReason: kyc.rejectionReason,
    };
  }

  /**
   * Get requirements for next tier
   */
  private getNextTierRequirements(kyc: IKYC, emailVerified: boolean): string[] {
    const requirements: string[] = [];

    if (kyc.tier === KYCTier.SPROUT) {
      if (!emailVerified) {
        requirements.push('Verify your email address to upgrade to Bloom Level');
      } else {
        requirements.push('Email verified! You are now at Bloom Level');
      }
    } else if (kyc.tier === KYCTier.BLOOM) {
      requirements.push('Upload NIN Slip, Voter\'s Card, or Driver\'s License');
      requirements.push('Upload a selfie for face-match verification');
      requirements.push('Optional: Upload utility bill');
    } else if (kyc.tier === KYCTier.THRIVE) {
      requirements.push('You are at the highest tier!');
    }

    return requirements;
  }

  /**
   * Check if user can perform withdrawal
   */
  async canWithdraw(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    const kyc = await this.getOrCreateKYC(userId);

    if (!kyc.withdrawalsEnabled) {
      return { allowed: false, reason: 'Withdrawals not enabled for your KYC tier. Please upgrade to Bloom Level.' };
    }

    if (amount > kyc.maxWithdrawalAmount) {
      return {
        allowed: false,
        reason: `Amount exceeds maximum withdrawal limit of ₦${kyc.maxWithdrawalAmount.toLocaleString()}`
      };
    }

    // Check daily withdrawal limit (would need to track daily withdrawals)
    // This is a simplified check - you'd need to implement daily tracking

    return { allowed: true };
  }
}

export const kycService = new KYCService();
