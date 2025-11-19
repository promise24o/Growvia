import { Request, Response } from 'express';
import { growviaWalletService } from '../services/growviaWallet.service';
import { TransactionType, TransactionStatus } from '../models/GrowviaWalletTransaction';
import * as Sentry from '@sentry/node';
import { z } from 'zod';

// Validation schemas
const transferGrowCoinsSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'), // Amount in Naira
});

const withdrawToBankSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  payoutMethodId: z.string().min(1, 'Payout method ID is required'),
});

const getTransactionsSchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

class GrowviaWalletController {
  /**
   * Get wallet dashboard
   * GET /api/growvia-wallet/dashboard
   */
  getDashboard = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const dashboard = await growviaWalletService.getWalletDashboard(userId);

      return res.status(200).json({
        status: 'success',
        data: dashboard,
      });
    } catch (error: any) {
      console.error('Get wallet dashboard error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to fetch wallet dashboard',
      });
    }
  };

  /**
   * Transfer GrowCoins to Growvia Wallet
   * POST /api/growvia-wallet/transfer-growcoins
   */
  transferGrowCoins = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const validation = transferGrowCoinsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.error.errors,
        });
      }

      const { amount } = validation.data;

      const result = await growviaWalletService.transferGrowCoinsToWallet(userId, amount);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Transfer GrowCoins error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          amount: req.body.amount,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to transfer GrowCoins',
      });
    }
  };

  /**
   * Withdraw to bank account
   * POST /api/growvia-wallet/withdraw
   */
  withdrawToBank = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const validation = withdrawToBankSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.error.errors,
        });
      }

      const { amount, payoutMethodId } = validation.data;

      const result = await growviaWalletService.withdrawToBank(userId, amount, payoutMethodId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Withdraw to bank error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          amount: req.body.amount,
          payoutMethodId: req.body.payoutMethodId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to process withdrawal',
      });
    }
  };

  /**
   * Get wallet transactions
   * GET /api/growvia-wallet/transactions
   */
  getTransactions = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const validation = getTransactionsSchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.error.errors,
        });
      }

      const { type, status, startDate, endDate, page, limit } = validation.data;

      const filters: {
        type?: TransactionType;
        status?: TransactionStatus;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
      } = {};

      if (type) filters.type = type as TransactionType;
      if (status) filters.status = status as TransactionStatus;
      if (startDate) filters.startDate = new Date(startDate);
      if (endDate) filters.endDate = new Date(endDate);
      if (page) filters.page = parseInt(page);
      if (limit) filters.limit = parseInt(limit);

      const result = await growviaWalletService.getTransactions(userId, filters);

      return res.status(200).json({
        status: 'success',
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Get transactions error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          query: req.query,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to fetch transactions',
      });
    }
  };

  /**
   * Calculate withdrawal fee
   * POST /api/growvia-wallet/calculate-fee
   */
  calculateFee = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Valid amount is required',
        });
      }

      const fee = growviaWalletService.calculateWithdrawalFee(amount);
      const netAmount = amount - fee;

      return res.status(200).json({
        status: 'success',
        data: {
          amount,
          fee,
          netAmount,
          feePercent: 1.5,
        },
      });
    } catch (error: any) {
      console.error('Calculate fee error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          amount: req.body.amount,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to calculate fee',
      });
    }
  };
}

export const growviaWalletController = new GrowviaWalletController();
