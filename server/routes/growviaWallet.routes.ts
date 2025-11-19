import { Router } from 'express';
import { growviaWalletController } from '../controllers/growviaWallet.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/growvia-wallet/dashboard
 * @desc    Get Growvia Wallet dashboard
 * @access  Authenticated users
 */
router.get('/dashboard', growviaWalletController.getDashboard);

/**
 * @route   POST /api/growvia-wallet/transfer-growcoins
 * @desc    Transfer GrowCoins to Growvia Wallet
 * @access  Authenticated users
 */
router.post('/transfer-growcoins', growviaWalletController.transferGrowCoins);

/**
 * @route   POST /api/growvia-wallet/withdraw
 * @desc    Withdraw from Growvia Wallet to bank account
 * @access  Authenticated users
 */
router.post('/withdraw', growviaWalletController.withdrawToBank);

/**
 * @route   GET /api/growvia-wallet/transactions
 * @desc    Get Growvia Wallet transactions
 * @access  Authenticated users
 */
router.get('/transactions', growviaWalletController.getTransactions);

/**
 * @route   POST /api/growvia-wallet/calculate-fee
 * @desc    Calculate withdrawal fee for given amount
 * @access  Authenticated users
 */
router.post('/calculate-fee', growviaWalletController.calculateFee);

export default router;
