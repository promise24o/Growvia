import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { PayoutMethod } from '../models/PayoutMethod';
import { PayoutRequest } from '../models/PayoutRequest';
import { CommissionLedger } from '../models/CommissionLedger';
import { PayoutOTP } from '../models/PayoutOTP';
import { User } from '../models/User';
import { GrowviaWalletTransaction } from '../models/GrowviaWalletTransaction';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { sendPayoutMethodOTPEmail } from '../utils/email';

const MINIMUM_WITHDRAWAL = 5000; // ₦5,000 minimum
const WITHDRAWAL_FEE_PERCENT = 2; // 2% fee
const WITHDRAWAL_FEE_CAP = 1000; // ₦1,000 max fee

export class PayoutService {
  /**
   * Get payout dashboard summary
   */
  async getPayoutDashboard(userId: string) {
    const [
      totalEarnings,
      availableBalance,
      pendingApproval,
      paidOut,
      thisMonthEarnings,
      nextPayoutDate,
    ] = await Promise.all([
      this.getTotalEarnings(userId),
      this.getAvailableBalance(userId),
      this.getPendingApproval(userId),
      this.getPaidOut(userId),
      this.getThisMonthEarnings(userId),
      this.getNextPayoutDate(userId),
    ]);

    return {
      totalEarnings,
      availableBalance,
      pendingApproval,
      paidOut,
      thisMonthEarnings,
      nextPayoutDate,
      minimumWithdrawal: MINIMUM_WITHDRAWAL,
      currency: 'NGN',
    };
  }

  private async getTotalEarnings(userId: string): Promise<number> {
    const result = await CommissionLedger.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: { $in: ['approved', 'paid'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getAvailableBalance(userId: string): Promise<number> {
    const result = await CommissionLedger.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getPendingApproval(userId: string): Promise<number> {
    const result = await CommissionLedger.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getPaidOut(userId: string): Promise<number> {
    const result = await CommissionLedger.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getThisMonthEarnings(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await CommissionLedger.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: { $in: ['approved', 'paid'] },
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getNextPayoutDate(userId: string): Promise<Date | null> {
    const nextPayout = await PayoutRequest.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['pending', 'processing'] },
    }).sort({ requestedAt: 1 });

    return nextPayout ? nextPayout.requestedAt : null;
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(userId: string, amount: number, payoutMethodId: string) {
    // Validate amount
    if (amount < MINIMUM_WITHDRAWAL) {
      throw new BadRequestError(`Minimum withdrawal is ₦${MINIMUM_WITHDRAWAL.toLocaleString()}`);
    }

    // Check available balance
    const availableBalance = await this.getAvailableBalance(userId);
    if (amount > availableBalance) {
      throw new BadRequestError(`Insufficient balance. Available: ₦${availableBalance.toLocaleString()}`);
    }

    // Validate payout method
    const payoutMethod = await PayoutMethod.findOne({
      _id: new Types.ObjectId(payoutMethodId),
      userId: new Types.ObjectId(userId),
    });

    if (!payoutMethod) {
      throw new NotFoundError('Payout method not found');
    }

    if (!payoutMethod.isVerified) {
      throw new BadRequestError('Payout method must be verified before withdrawal');
    }

    // Calculate fees
    const fees = Math.min((amount * WITHDRAWAL_FEE_PERCENT) / 100, WITHDRAWAL_FEE_CAP);
    const netAmount = amount - fees;

    // Create payout request
    const transactionId = `PAYOUT${nanoid(10)}`;
    const payoutRequest = await PayoutRequest.create({
      userId: new Types.ObjectId(userId),
      amount,
      currency: 'NGN',
      status: 'pending',
      type: 'withdrawal',
      payoutMethodId: new Types.ObjectId(payoutMethodId),
      transactionId,
      fees,
      netAmount,
      requestedAt: new Date(),
    });

    return payoutRequest;
  }

  /**
   * Get payout transactions
   */
  async getPayoutTransactions(
    userId: string,
    filters: {
      status?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const walletQuery: any = { userId: new Types.ObjectId(userId) };
    const payoutQuery: any = { userId: new Types.ObjectId(userId) };

    if (filters.status) {
      walletQuery.status = filters.status;
      payoutQuery.status = filters.status;
    }
    
    if (filters.type) {
      walletQuery.type = filters.type;
      payoutQuery.type = filters.type;
    }
    
    if (filters.startDate || filters.endDate) {
      walletQuery.createdAt = {};
      payoutQuery.createdAt = {};
      if (filters.startDate) {
        walletQuery.createdAt.$gte = filters.startDate;
        payoutQuery.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        walletQuery.createdAt.$lte = filters.endDate;
        payoutQuery.createdAt.$lte = filters.endDate;
      }
    }

    const recentTransactions = await GrowviaWalletTransaction.find(walletQuery)
      .sort({ createdAt: -1 })
      .lean();

    const transactions = await PayoutRequest.find(payoutQuery)
      .populate('payoutMethodId')
      .sort({ createdAt: -1 })
      .lean();

    const payoutRequestIds = new Set(
      recentTransactions
        .filter(t => t.metadata?.payoutRequestId)
        .map(t => t.metadata!.payoutRequestId!.toString())
    );

    const filteredPayoutRequests = transactions.filter(
      pr => !payoutRequestIds.has(pr._id.toString())
    );

    return {
      transactions: [...recentTransactions, ...filteredPayoutRequests],
      total: recentTransactions.length + filteredPayoutRequests.length,
      page: 1,
      limit: recentTransactions.length + filteredPayoutRequests.length,
      totalPages: 1,
    };
  }

  /**
   * Get earnings breakdown (commission ledger)
   */
  async getEarningsBreakdown(
    userId: string,
    filters: {
      campaignId?: string;
      status?: string;
      approvalStatus?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { campaignId, status, approvalStatus, startDate, endDate, page = 1, limit = 20 } = filters;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (campaignId) query.campaignId = new Types.ObjectId(campaignId);
    if (status) query.status = status;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      CommissionLedger.find(query)
        .populate('campaignId', 'name')
        .populate('commissionModelId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommissionLedger.countDocuments(query),
    ]);

    return {
      earnings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get list of banks from Paystack
   */
  async getBankList() {
    const secretKey = process.env.NODE_ENV === 'production'
      ? process.env.PAYSTACK_SECRET_KEY_LIVE
      : process.env.PAYSTACK_SECRET_KEY_TEST;

    if (!secretKey) {
      throw new BadRequestError('Paystack configuration missing');
    }

    try {
      const response = await axios.get('https://api.paystack.co/bank', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        params: {
          country: 'nigeria',
          currency: 'NGN',
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Paystack get banks error:', error.response?.data || error.message);
      throw new BadRequestError('Failed to fetch bank list');
    }
  }

  /**
   * Resolve account number to get account name
   */
  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    const secretKey = process.env.NODE_ENV === 'production'
      ? process.env.PAYSTACK_SECRET_KEY_LIVE
      : process.env.PAYSTACK_SECRET_KEY_TEST;

    if (!secretKey) {
      throw new BadRequestError('Paystack configuration missing');
    }

    try {
      const response = await axios.get('https://api.paystack.co/bank/resolve', {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Paystack resolve account error:', error.response?.data || error.message);
      throw new BadRequestError('Failed to resolve account number. Please verify account details.');
    }
  }

  /**
   * Add payout method
   */
  async addPayoutMethod(userId: string, data: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    bankCode?: string;
  }) {
    // Check if user already has a default method
    const existingDefault = await PayoutMethod.findOne({
      userId: new Types.ObjectId(userId),
      isDefault: true,
    });

    const payoutMethod = await PayoutMethod.create({
      userId: new Types.ObjectId(userId),
      type: 'bank_account',
      bankDetails: data,
      isDefault: !existingDefault, // Set as default if no other default exists
      isVerified: false,
      verificationStatus: 'pending',
    });

    return payoutMethod;
  }

  /**
   * Get payout methods
   */
  async getPayoutMethods(userId: string) {
    const methods = await PayoutMethod.find({
      userId: new Types.ObjectId(userId),
    }).sort({ isDefault: -1, createdAt: -1 });

    return methods;
  }

  /**
   * Set default payout method
   */
  async setDefaultPayoutMethod(userId: string, methodId: string) {
    // Remove default from all methods
    await PayoutMethod.updateMany(
      { userId: new Types.ObjectId(userId) },
      { $set: { isDefault: false } }
    );

    // Set new default
    const method = await PayoutMethod.findOneAndUpdate(
      {
        _id: new Types.ObjectId(methodId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isDefault: true } },
      { new: true }
    );

    if (!method) {
      throw new NotFoundError('Payout method not found');
    }

    return method;
  }

  /**
   * Verify payout method (admin function)
   */
  async verifyPayoutMethod(methodId: string, verified: boolean) {
    const method = await PayoutMethod.findByIdAndUpdate(
      methodId,
      {
        $set: {
          isVerified: verified,
          verificationStatus: verified ? 'verified' : 'failed',
          verificationDate: new Date(),
        },
      },
      { new: true }
    );

    if (!method) {
      throw new NotFoundError('Payout method not found');
    }

    return method;
  }

  /**
   * Delete payout method
   */
  async deletePayoutMethod(userId: string, methodId: string) {
    const method = await PayoutMethod.findOneAndDelete({
      _id: new Types.ObjectId(methodId),
      userId: new Types.ObjectId(userId),
    });

    if (!method) {
      throw new NotFoundError('Payout method not found');
    }

    // If deleted method was default, set another as default
    if (method.isDefault) {
      const newDefault = await PayoutMethod.findOne({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save();
      }
    }

    return { message: 'Payout method deleted successfully' };
  }

  /**
   * Send OTP for payout method verification
   */
  async sendPayoutMethodOTP(userId: string, methodId: string) {
    // Validate payout method
    const payoutMethod = await PayoutMethod.findOne({
      _id: new Types.ObjectId(methodId),
      userId: new Types.ObjectId(userId),
    });

    if (!payoutMethod) {
      throw new NotFoundError('Payout method not found');
    }

    if (payoutMethod.isVerified) {
      throw new BadRequestError('Payout method is already verified');
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTP for this method
    await PayoutOTP.deleteMany({
      userId: new Types.ObjectId(userId),
      payoutMethodId: new Types.ObjectId(methodId),
    });

    // Create new OTP
    await PayoutOTP.create({
      userId: new Types.ObjectId(userId),
      payoutMethodId: new Types.ObjectId(methodId),
      otp,
      expiresAt,
      verified: false,
    });

    // Send OTP via email
    await sendPayoutMethodOTPEmail(user, otp);

    return { message: 'OTP sent to your email successfully' };
  }

  /**
   * Verify payout method with OTP
   */
  async verifyPayoutMethodOTP(userId: string, methodId: string, otp: string) {
    // Find OTP record
    const otpRecord = await PayoutOTP.findOne({
      userId: new Types.ObjectId(userId),
      payoutMethodId: new Types.ObjectId(methodId),
      otp,
      verified: false,
    });

    if (!otpRecord) {
      throw new BadRequestError('Invalid OTP code');
    }

    // Check if OTP has expired
    if (otpRecord.expiresAt < new Date()) {
      await PayoutOTP.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Update payout method as verified
    const payoutMethod = await PayoutMethod.findByIdAndUpdate(
      methodId,
      {
        $set: {
          isVerified: true,
          verificationStatus: 'verified',
          verificationDate: new Date(),
        },
      },
      { new: true }
    );

    if (!payoutMethod) {
      throw new NotFoundError('Payout method not found');
    }

    // Delete the OTP record
    await PayoutOTP.deleteOne({ _id: otpRecord._id });

    return {
      message: 'Payout method verified successfully',
      payoutMethod,
    };
  }
}

export const payoutService = new PayoutService();
