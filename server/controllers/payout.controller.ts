import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { payoutService } from '../services/payout.service';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Validation schemas
const withdrawalSchema = z.object({
  amount: z.number().min(5000, 'Minimum withdrawal is ₦5,000'),
  payoutMethodId: z.string().min(1, 'Payout method ID is required'),
});

const addPayoutMethodSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits'),
  bankName: z.string().min(1, 'Bank name is required'),
  bankCode: z.string().optional(),
});

export class PayoutController {
  /**
   * Get bank list
   * GET /api/payouts/banks
   */
  getBankList = async (req: Request, res: Response) => {
    try {
      const banks = await payoutService.getBankList();

      return res.status(200).json({
        status: 'success',
        data: banks,
      });
    } catch (error: any) {
      console.error('Get bank list error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to fetch bank list',
      });
    }
  };

  /**
   * Resolve account number
   * POST /api/payouts/resolve-account
   */
  resolveAccountNumber = async (req: Request, res: Response) => {
    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
        return res.status(400).json({
          status: 'error',
          message: 'Account number and bank code are required',
        });
      }

      const accountDetails = await payoutService.resolveAccountNumber(accountNumber, bankCode);

      return res.status(200).json({
        status: 'success',
        data: accountDetails,
      });
    } catch (error: any) {
      console.error('Resolve account number error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          body: req.body,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to resolve account number',
      });
    }
  };

  /**
   * Get payout dashboard
   * GET /api/payouts/dashboard
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

      const dashboard = await payoutService.getPayoutDashboard(userId);

      return res.status(200).json({
        status: 'success',
        data: dashboard,
      });
    } catch (error: any) {
      console.error('Get payout dashboard error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch payout dashboard',
      });
    }
  };

  /**
   * Request withdrawal
   * POST /api/payouts/withdraw
   */
  requestWithdrawal = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const validationResult = withdrawalSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const { amount, payoutMethodId } = validationResult.data;

      const payoutRequest = await payoutService.requestWithdrawal(userId, amount, payoutMethodId);

      return res.status(201).json({
        status: 'success',
        message: 'Withdrawal request submitted successfully',
        data: payoutRequest,
      });
    } catch (error: any) {
      console.error('Request withdrawal error:', error);
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
        message: error.message || 'Failed to process withdrawal request',
      });
    }
  };

  /**
   * Get payout transactions
   * GET /api/payouts/transactions
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

      const filters = {
        status: req.query.status as string,
        type: req.query.type as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 100,
      };

      const result = await payoutService.getPayoutTransactions(userId, filters);

      return res.status(200).json({
        status: 'success',
        data: result.transactions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Get payout transactions error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch payout transactions',
      });
    }
  };

  /**
   * Get earnings breakdown
   * GET /api/payouts/earnings
   */
  getEarningsBreakdown = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const filters = {
        campaignId: req.query.campaignId as string,
        status: req.query.status as string,
        approvalStatus: req.query.approvalStatus as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      };

      const result = await payoutService.getEarningsBreakdown(userId, filters);

      return res.status(200).json({
        status: 'success',
        data: result.earnings,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error('Get earnings breakdown error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch earnings breakdown',
      });
    }
  };

  /**
   * Add payout method
   * POST /api/payouts/methods
   */
  addPayoutMethod = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const validationResult = addPayoutMethodSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const payoutMethod = await payoutService.addPayoutMethod(userId, validationResult.data);

      return res.status(201).json({
        status: 'success',
        message: 'Payout method added successfully',
        data: payoutMethod,
      });
    } catch (error: any) {
      console.error('Add payout method error:', error);
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
        message: error.message || 'Failed to add payout method',
      });
    }
  };

  /**
   * Get payout methods
   * GET /api/payouts/methods
   */
  getPayoutMethods = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const methods = await payoutService.getPayoutMethods(userId);

      return res.status(200).json({
        status: 'success',
        data: methods,
      });
    } catch (error: any) {
      console.error('Get payout methods error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch payout methods',
      });
    }
  };

  /**
   * Set default payout method
   * PATCH /api/payouts/methods/:methodId/default
   */
  setDefaultPayoutMethod = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { methodId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!methodId) {
        return res.status(400).json({
          status: 'error',
          message: 'Method ID is required',
        });
      }

      const method = await payoutService.setDefaultPayoutMethod(userId, methodId);

      return res.status(200).json({
        status: 'success',
        message: 'Default payout method updated successfully',
        data: method,
      });
    } catch (error: any) {
      console.error('Set default payout method error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          methodId: req.params.methodId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to set default payout method',
      });
    }
  };

  /**
   * Delete payout method
   * DELETE /api/payouts/methods/:methodId
   */
  deletePayoutMethod = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { methodId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!methodId) {
        return res.status(400).json({
          status: 'error',
          message: 'Method ID is required',
        });
      }

      const result = await payoutService.deletePayoutMethod(userId, methodId);

      return res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error: any) {
      console.error('Delete payout method error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          methodId: req.params.methodId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to delete payout method',
      });
    }
  };

  /**
   * Send OTP for payout method verification
   * POST /api/payouts/methods/:methodId/send-otp
   */
  sendPayoutMethodOTP = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { methodId } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!methodId) {
        return res.status(400).json({
          status: 'error',
          message: 'Method ID is required',
        });
      }

      const result = await payoutService.sendPayoutMethodOTP(userId, methodId);

      return res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error: any) {
      console.error('Send payout method OTP error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          methodId: req.params.methodId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to send OTP',
      });
    }
  };

  /**
   * Verify payout method with OTP
   * POST /api/payouts/methods/:methodId/verify-otp
   */
  verifyPayoutMethodOTP = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { methodId } = req.params;
      const { otp } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!methodId) {
        return res.status(400).json({
          status: 'error',
          message: 'Method ID is required',
        });
      }

      if (!otp) {
        return res.status(400).json({
          status: 'error',
          message: 'OTP is required',
        });
      }

      const result = await payoutService.verifyPayoutMethodOTP(userId, methodId, otp);

      return res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.payoutMethod,
      });
    } catch (error: any) {
      console.error('Verify payout method OTP error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          methodId: req.params.methodId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to verify OTP',
      });
    }
  };
}

export const payoutController = new PayoutController();
