import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { GrowviaWallet } from '../models/GrowviaWallet';
import { GrowviaWalletTransaction, TransactionType, TransactionStatus } from '../models/GrowviaWalletTransaction';
import { GrowCoinWallet } from '../models/GrowCoinWallet';
import { GrowCoinTransaction } from '../models/GrowCoinTransaction';
import { PayoutRequest } from '../models/PayoutRequest';
import { PayoutMethod } from '../models/PayoutMethod';
import { User } from '../models/User';
import { BadRequestError, NotFoundError } from '../utils/errors';

// Fee configuration
const WITHDRAWAL_FEE_PERCENT = 1.5; // 1.5%
const MINIMUM_FEE = 50; // ₦50
const GROWCOIN_TO_NAIRA_RATE = parseInt(process.env.GROWCOIN_TO_NAIRA || '100'); // 1 GrowCoin = ₦100

export class GrowviaWalletService {
  /**
   * Get or create Growvia Wallet for user
   */
  async getOrCreateWallet(userId: string) {
    let wallet = await GrowviaWallet.findOne({ userId: new Types.ObjectId(userId) });

    if (!wallet) {
      wallet = await GrowviaWallet.create({
        userId: new Types.ObjectId(userId),
        balance: 0,
        pendingBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
      });
    }

    return wallet;
  }

  /**
   * Calculate withdrawal fee
   */
  calculateWithdrawalFee(amount: number): number {
    const feeAmount = (amount * WITHDRAWAL_FEE_PERCENT) / 100;
    
    // Apply minimum cap only
    if (feeAmount < MINIMUM_FEE) return MINIMUM_FEE;
    
    return Math.round(feeAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Transfer GrowCoins to Growvia Wallet
   * @param userId - User ID
   * @param nairaAmount - Amount in Naira to transfer (NOT GrowCoins)
   */
  async transferGrowCoinsToWallet(userId: string, nairaAmount: number) {
    if (nairaAmount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    // Calculate GrowCoins needed (Naira / Rate)
    const growCoinAmount = nairaAmount / GROWCOIN_TO_NAIRA_RATE;

    // Get GrowCoin wallet
    const growCoinWallet = await GrowCoinWallet.findOne({ userId: new Types.ObjectId(userId) });
    if (!growCoinWallet) {
      throw new NotFoundError('GrowCoin wallet not found');
    }

    // Check if user has sufficient GrowCoins
    if (growCoinWallet.balance < growCoinAmount) {
      throw new BadRequestError(
        `Insufficient GrowCoin balance. You need ${growCoinAmount.toFixed(2)} GrowCoins (₦${nairaAmount.toLocaleString()}) but only have ${growCoinWallet.balance.toFixed(2)} GrowCoins`
      );
    }

    // Get or create Growvia Wallet
    const growviaWallet = await this.getOrCreateWallet(userId);

    // Calculate fee
    const fee = this.calculateWithdrawalFee(nairaAmount);
    const netAmount = nairaAmount - fee;

    // Start transaction
    const session = await GrowviaWallet.startSession();
    session.startTransaction();

    try {
      // Deduct from GrowCoin wallet
      growCoinWallet.balance -= growCoinAmount;
      await growCoinWallet.save({ session });

      // Create GrowCoin transaction record
      const growCoinTransactionId = `GC-WTR-${nanoid(12)}`;
      await GrowCoinTransaction.create([{
        userId: new Types.ObjectId(userId),
        description: `Transferred ${growCoinAmount.toFixed(2)} GrowCoins to Growvia Wallet (₦${nairaAmount.toLocaleString()})`,
        type: 'Wallet Transfer',
        amount: growCoinAmount,
        status: 'Completed',
        transactionId: growCoinTransactionId,
        metadata: {
          nairaAmount,
          conversionRate: GROWCOIN_TO_NAIRA_RATE,
          conversionInfo: `1 GrowCoin = ₦${GROWCOIN_TO_NAIRA_RATE}`,
          fee,
          netAmount,
          destination: 'Growvia Wallet',
        },
      }], { session });

      // Add to Growvia Wallet
      const balanceBefore = growviaWallet.balance;
      growviaWallet.balance += netAmount;
      growviaWallet.totalDeposited += netAmount;
      await growviaWallet.save({ session });

      // Create deposit transaction
      const depositTransaction = await GrowviaWalletTransaction.create([{
        userId: new Types.ObjectId(userId),
        walletId: growviaWallet._id,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        amount: nairaAmount,
        fee: 0,
        netAmount: nairaAmount,
        balanceBefore,
        balanceAfter: balanceBefore + nairaAmount,
        reference: `DEP-${nanoid(12)}`,
        description: `Transferred ${growCoinAmount.toFixed(2)} GrowCoins (₦${nairaAmount.toLocaleString()}) to Growvia Wallet`,
        metadata: {
          growCoinAmount: parseFloat(growCoinAmount.toFixed(2)),
          conversionRate: GROWCOIN_TO_NAIRA_RATE,
          conversionInfo: `1 GrowCoin = ₦${GROWCOIN_TO_NAIRA_RATE}`,
        },
        processedAt: new Date(),
      }], { session });

      // Create fee transaction
      const feeTransaction = await GrowviaWalletTransaction.create([{
        userId: new Types.ObjectId(userId),
        walletId: growviaWallet._id,
        type: TransactionType.FEE,
        status: TransactionStatus.COMPLETED,
        amount: fee,
        fee: fee,
        netAmount: -fee,
        balanceBefore: balanceBefore + nairaAmount,
        balanceAfter: balanceBefore + nairaAmount - fee,
        reference: `FEE-${nanoid(12)}`,
        description: `Transfer fee (${WITHDRAWAL_FEE_PERCENT}%)`,
        metadata: {
          feePercent: WITHDRAWAL_FEE_PERCENT,
          originalAmount: nairaAmount,
        },
        processedAt: new Date(),
      }], { session });

      await session.commitTransaction();

      return {
        success: true,
        message: 'GrowCoins transferred successfully',
        data: {
          growCoinAmount: parseFloat(growCoinAmount.toFixed(2)),
          nairaAmount,
          fee,
          netAmount,
          conversionRate: GROWCOIN_TO_NAIRA_RATE,
          conversionInfo: `1 GrowCoin = ₦${GROWCOIN_TO_NAIRA_RATE}`,
          newBalance: growviaWallet.balance,
          newGrowCoinBalance: growCoinWallet.balance,
          transactions: [depositTransaction[0], feeTransaction[0]],
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Withdraw from Growvia Wallet to Bank Account
   */
  async withdrawToBank(userId: string, amount: number, payoutMethodId: string) {
    if (amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    // Get Growvia Wallet
    const wallet = await this.getOrCreateWallet(userId);

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      throw new BadRequestError('Insufficient wallet balance');
    }

    // Get payout method
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

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!payoutMethod.bankDetails?.accountNumber) {
      throw new BadRequestError('Invalid payout method: missing bank details');
    }

    const session = await GrowviaWallet.startSession();
    session.startTransaction();

    try {
      // Deduct from wallet
      const balanceBefore = wallet.balance;
      wallet.balance -= amount;
      wallet.totalWithdrawn += amount;
      await wallet.save({ session });

      // Calculate fee and net amount
      const fee = this.calculateWithdrawalFee(amount);
      const netAmount = amount - fee;
      const transactionId = `GW-WD-${nanoid(12)}`;

      // Create payout request
      const payoutRequest = await PayoutRequest.create([{
        userId: new Types.ObjectId(userId),
        amount,
        fees: fee,
        netAmount,
        transactionId,
        payoutMethodId: new Types.ObjectId(payoutMethodId),
        status: 'pending',
        requestedAt: new Date(),
        metadata: {
          source: 'growvia_wallet',
        },
      }], { session });

      // Create withdrawal transaction
      const transaction = await GrowviaWalletTransaction.create([{
        userId: new Types.ObjectId(userId),
        walletId: wallet._id,
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.PROCESSING,
        amount,
        fee,
        netAmount,
        balanceBefore,
        balanceAfter: wallet.balance,
        reference: transactionId,
        description: `Withdrawal to ${payoutMethod.bankDetails.bankName} (${payoutMethod.bankDetails.accountNumber})`,
        metadata: {
          bankDetails: {
            accountNumber: payoutMethod.bankDetails.accountNumber,
            accountName: payoutMethod.bankDetails.accountName,
            bankName: payoutMethod.bankDetails.bankName,
            bankCode: payoutMethod.bankDetails.bankCode,
          },
          payoutRequestId: payoutRequest[0]._id,
        },
      }], { session });

      await session.commitTransaction();

      return {
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          amount,
          payoutRequest: payoutRequest[0],
          transaction: transaction[0],
          newBalance: wallet.balance,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get wallet dashboard
   */
  async getWalletDashboard(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const growCoinWallet = await GrowCoinWallet.findOne({ userId: new Types.ObjectId(userId) });

    // Get recent transactions
    const recentTransactions = await GrowviaWalletTransaction.find({
      userId: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get pending withdrawals
    const pendingWithdrawals = await GrowviaWalletTransaction.find({
      userId: new Types.ObjectId(userId),
      type: TransactionType.WITHDRAWAL,
      status: { $in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
    }).lean();

    const totalPendingWithdrawals = pendingWithdrawals.reduce((sum, txn) => sum + txn.amount, 0);

    return {
      wallet: {
        balance: wallet.balance,
        pendingBalance: wallet.pendingBalance,
        totalDeposited: wallet.totalDeposited,
        totalWithdrawn: wallet.totalWithdrawn,
      },
      growCoinWallet: {
        balance: growCoinWallet?.balance ?? 0,
        conversionRate: GROWCOIN_TO_NAIRA_RATE,
      },
      fees: {
        withdrawalFeePercent: WITHDRAWAL_FEE_PERCENT,
        minimumFee: MINIMUM_FEE,
      },
      recentTransactions,
      pendingWithdrawals: {
        count: pendingWithdrawals.length,
        totalAmount: totalPendingWithdrawals,
      },
    };
  }

  /**
   * Get wallet transactions with filters
   */
  async getTransactions(
    userId: string,
    filters: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      GrowviaWalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GrowviaWalletTransaction.countDocuments(query),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Record affiliate payment to Growvia Wallet
   */
  async recordAffiliatePayment(
    userId: string,
    amount: number,
    metadata: {
      campaignId?: Types.ObjectId;
      affiliateId?: Types.ObjectId;
      description: string;
    }
  ) {
    const wallet = await this.getOrCreateWallet(userId);

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    wallet.totalDeposited += amount;
    await wallet.save();

    const transaction = await GrowviaWalletTransaction.create({
      userId: new Types.ObjectId(userId),
      walletId: wallet._id,
      type: TransactionType.AFFILIATE_PAYMENT,
      status: TransactionStatus.COMPLETED,
      amount,
      fee: 0,
      netAmount: amount,
      balanceBefore,
      balanceAfter: wallet.balance,
      reference: `AFF-${nanoid(12)}`,
      description: metadata.description,
      metadata: {
        campaignId: metadata.campaignId,
        affiliateId: metadata.affiliateId,
      },
      processedAt: new Date(),
    });

    return transaction;
  }
}

export const growviaWalletService = new GrowviaWalletService();
