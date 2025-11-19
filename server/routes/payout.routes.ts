import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../shared/schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/payouts/banks
 * @desc    Get list of banks from Paystack
 * @access  Authenticated marketers
 */
router.get(
  '/banks',
  authorize([UserRole.MARKETER]),
  payoutController.getBankList
);

/**
 * @route   POST /api/payouts/resolve-account
 * @desc    Resolve account number to get account name
 * @access  Authenticated marketers
 */
router.post(
  '/resolve-account',
  authorize([UserRole.MARKETER]),
  payoutController.resolveAccountNumber
);

/**
 * @route   GET /api/payouts/dashboard
 * @desc    Get payout dashboard summary
 * @access  Authenticated marketers
 */
router.get(
  '/dashboard',
  authorize([UserRole.MARKETER]),
  payoutController.getDashboard
);

/**
 * @route   POST /api/payouts/withdraw
 * @desc    Request withdrawal
 * @access  Authenticated marketers
 */
router.post(
  '/withdraw',
  authorize([UserRole.MARKETER]),
  payoutController.requestWithdrawal
);

/**
 * @route   GET /api/payouts/transactions
 * @desc    Get payout transactions history
 * @access  Authenticated marketers
 */
router.get(
  '/transactions',
  authorize([UserRole.MARKETER]),
  payoutController.getTransactions
);

/**
 * @route   GET /api/payouts/earnings
 * @desc    Get earnings breakdown (commission ledger)
 * @access  Authenticated marketers
 */
router.get(
  '/earnings',
  authorize([UserRole.MARKETER]),
  payoutController.getEarningsBreakdown
);

/**
 * @route   POST /api/payouts/methods
 * @desc    Add payout method
 * @access  Authenticated marketers
 */
router.post(
  '/methods',
  authorize([UserRole.MARKETER]),
  payoutController.addPayoutMethod
);

/**
 * @route   GET /api/payouts/methods
 * @desc    Get payout methods
 * @access  Authenticated marketers
 */
router.get(
  '/methods',
  authorize([UserRole.MARKETER]),
  payoutController.getPayoutMethods
);

/**
 * @route   PATCH /api/payouts/methods/:methodId/default
 * @desc    Set default payout method
 * @access  Authenticated marketers
 */
router.patch(
  '/methods/:methodId/default',
  authorize([UserRole.MARKETER]),
  payoutController.setDefaultPayoutMethod
);

/**
 * @route   DELETE /api/payouts/methods/:methodId
 * @desc    Delete payout method
 * @access  Authenticated marketers
 */
router.delete(
  '/methods/:methodId',
  authorize([UserRole.MARKETER]),
  payoutController.deletePayoutMethod
);

/**
 * @route   POST /api/payouts/methods/:methodId/send-otp
 * @desc    Send OTP for payout method verification
 * @access  Authenticated marketers
 */
router.post(
  '/methods/:methodId/send-otp',
  authorize([UserRole.MARKETER]),
  payoutController.sendPayoutMethodOTP
);

/**
 * @route   POST /api/payouts/methods/:methodId/verify-otp
 * @desc    Verify payout method with OTP
 * @access  Authenticated marketers
 */
router.post(
  '/methods/:methodId/verify-otp',
  authorize([UserRole.MARKETER]),
  payoutController.verifyPayoutMethodOTP
);

export default router;
