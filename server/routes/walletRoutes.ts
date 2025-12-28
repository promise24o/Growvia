import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { MongoStorage } from '../mongoStorage';
import { IStorage } from '../storage';
import { z } from 'zod';
import { auditLog } from '../utils/auditLog';
import axios from 'axios';
import { nanoid } from 'nanoid';
import emailQueue from '../queue/emailQueue';
import * as Sentry from '@sentry/node';

// Zod Schemas for Validation
const transferSchema = z.object({
    receiver: z.string().min(1, 'Receiver username or email is required'),
    amount: z.number().min(1, 'Minimum transfer is 1 GrowCoin'),
    note: z.string().max(100, 'Note must be 100 characters or less').optional(),
});

const topUpSchema = z.object({
    amount: z.number().min(500, 'Minimum top-up is ₦500'),
    provider: z.string().refine((value) => ['paystack', 'flutterwave'].includes(value), 'Invalid payment provider'),
});

const storage: IStorage = new MongoStorage();
const router = Router();

// Apply Sentry request handler for this router
if (process.env.GLITCHTIP_DSN && (Sentry as any).Handlers?.requestHandler) {
  router.use((Sentry as any).Handlers.requestHandler({
    serverName: false,
    user: ['id', 'username', 'email'],
    transaction: 'methodPath',
    flushTimeout: 2000,
  }));
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.requestHandler not available. Skipping request handler middleware.");
}

// Get Wallet and Transactions
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const wallet = await storage.getWallet(userId);
        const transactions = await storage.getWalletTransactions(userId);

        // Calculate transaction count and last transaction date
        const transactionCount = transactions.length;
        const lastTransaction = transactions.length > 0 
            ? transactions.sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())[0].createdAt
            : null;

        res.json({
            wallet: {
                ...wallet,
                transactionCount,
                lastTransaction,
            },
            transactions,
        });
    } catch (error: any) {
        Sentry.captureException(error, {
            extra: {
                route: req.path,
                method: req.method,
                userId: (req as any).user.id,
            },
        });
        res.status(500).json({ message: error.message || 'Failed to fetch wallet data' });
    }
});

// Transfer GrowCoins
router.post('/transfer', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const validatedData = transferSchema.parse(req.body);

        const senderWallet = await storage.getWallet(userId);
        if (!senderWallet) {
            return res.status(400).json({ message: 'Sender wallet not found' });
        }

        const receiverUser = await storage.getUserByEmailOrUsername(validatedData.receiver);
        if (!receiverUser) {
            return res.status(404).json({ message: 'Receiver not found' });
        }
        if (receiverUser.id === userId) {
            return res.status(400).json({ message: 'Cannot transfer to yourself' });
        }

        const receiverWallet = await storage.getWallet(receiverUser.id);
        if (!receiverWallet) {
            return res.status(404).json({ message: 'Receiver wallet not found' });
        }

        // No daily transfer limits - unlimited transfers

        if (senderWallet.balance < validatedData.amount) {
            return res.status(400).json({ message: 'Insufficient balance for transfer' });
        }

        const transactionId = `GVC${nanoid(8)}`;
        const receiverTransactionId = `GVC${nanoid(8)}`;

        // Update wallets
        await storage.updateWallet(userId, { balance: senderWallet.balance - validatedData.amount });
        await storage.updateWallet(receiverUser.id, { balance: receiverWallet.balance + validatedData.amount });

        // Create transactions
        await storage.createWalletTransaction({
            userId,
            description: `Sent to @${receiverUser.username} ${validatedData.note ? `(${validatedData.note})` : ''}`,
            type: 'user_transfer',
            amount: -validatedData.amount,
            transactionId: transactionId,
            receiverId: receiverUser.id,
            ipAddress: req.ip,
            deviceFingerprint: req.headers['user-agent'],
        });

        await storage.createWalletTransaction({
            userId: receiverUser.id,
            description: `Received from @${(req.user as any)?.username || 'unknown'} ${validatedData.note ? `(${validatedData.note})` : ''}`,
            type: 'user_transfer',
            amount: validatedData.amount,
            transactionId: receiverTransactionId,
            ipAddress: req.ip,
            deviceFingerprint: req.headers['user-agent'],
        });

        await auditLog(userId, 'GROWCOIN_TRANSFER', `Transferred ${validatedData.amount} GrowCoins to @${receiverUser.username}`);
        await auditLog(receiverUser.id, 'GROWCOIN_RECEIVED', `Received ${validatedData.amount} GrowCoins from @${(req.user as any)?.username || 'unknown'}`);

        await emailQueue.add({
            type: 'growcoin_transfer_notification',
            email: (req as any).user?.email || 'unknown',
            name: (req as any).user?.name || 'unknown',
            receiver: receiverUser.username,
            amount: validatedData.amount,
            transactionId: transactionId,
            timestamp: new Date().toISOString(),
        });

        await emailQueue.add({
            type: 'growcoin_received_notification',
            email: receiverUser.email,
            name: receiverUser.username,
            sender: (req.user as any)?.username || 'unknown',
            amount: validatedData.amount,
            transactionId: receiverTransactionId,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            message: `You've sent ${validatedData.amount} GrowCoins to @${receiverUser.username}. Transaction ID: ${transactionId}`,
        });
        return;
    } catch (error: any) {
        Sentry.captureException(error, {
            extra: {
                route: req.path,
                method: req.method,
                userId: (req as any).user.id,
                receiver: req.body.receiver,
                amount: req.body.amount,
            },
        });
        res.status(500).json({ message: error.message || 'Failed to transfer GrowCoins' });
        return;
    }
});

// Top-Up GrowCoins
router.post('/top-up', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const validatedData = topUpSchema.extend({
            provider: z.string().refine((value) => ['paystack', 'flutterwave'].includes(value), {
                message: 'Invalid payment provider',
            }),
        }).parse(req.body);

        const growCoins = validatedData.amount / Number(process.env.GROWCOIN_TO_NAIRA || 100);

        const secretKey =
            validatedData.provider === 'paystack'
                ? process.env.NODE_ENV === 'production'
                    ? process.env.PAYSTACK_SECRET_KEY_LIVE
                    : process.env.PAYSTACK_SECRET_KEY_TEST
                : process.env.NODE_ENV === 'production'
                    ? process.env.FLUTTERWAVE_SECRET_KEY_LIVE
                    : process.env.FLUTTERWAVE_SECRET_KEY_TEST;

        if (!secretKey) {
            throw new Error('Payment provider configuration missing');
        }

        let paymentUrl: string;
        let referenceId: string;
        const transactionId = `TOPUP${nanoid(8)}`;

        try {
            if (validatedData.provider === 'paystack') {
                const response = await axios.post(
                    'https://api.paystack.co/transaction/initialize',
                    {
                        email: (req as any).user?.email || 'unknown',
                        amount: validatedData.amount * 100, // Paystack expects amount in kobo
                        callback_url: `${req.get('origin') || 'https://www.growviapro.com'}/auth/wallet/callback`,
                        reference: transactionId, // Use transactionId as Paystack reference
                    },
                    {
                        headers: { Authorization: `Bearer ${secretKey}` },
                    }
                );
                paymentUrl = response.data.data.authorization_url;
                referenceId = transactionId; // Set referenceId to transactionId
            } else {
                const response = await axios.post(
                    'https://api.flutterwave.com/v3/payments',
                    {
                        tx_ref: transactionId,
                        amount: validatedData.amount,
                        currency: 'NGN',
                        redirect_url: `${req.get('origin') || 'https://www.growviapro.com'}/auth/wallet/callback`,
                        customer: { email: (req as any).user?.email || 'unknown', name: (req as any).user?.name || 'unknown' },
                        meta: { transactionId },
                    },
                    {
                        headers: { Authorization: `Bearer ${secretKey}` },
                    }
                );
                paymentUrl = response.data.data.link;
                referenceId = transactionId; // Flutterwave uses tx_ref
            }
        } catch (axiosError: any) {
            Sentry.captureException(axiosError, {
                extra: {
                    route: req.path,
                    method: req.method,
                    userId,
                    amount: validatedData.amount,
                    provider: validatedData.provider,
                    axiosError: axiosError.response?.data,
                },
            });
            throw new Error(axiosError.response?.data?.message || 'Payment gateway error');
        }

        await storage.createWalletTransaction({
            userId,
            description: `Top-up of ${growCoins} GrowCoins`,
            type: 'Earned',
            amount: growCoins,
            status: 'Pending',
            transactionId,
            ipAddress: req.ip,
            deviceFingerprint: req.headers['user-agent'],
        });

        await auditLog(userId, 'GROWCOIN_TOPUP_INITIATED', `Initiated top-up of ${growCoins} GrowCoins`);

        await storage.createActivity({
            type: 'transaction',
            description: `Initiated top-up of ${growCoins} GrowCoins`,
            userId,
            metadata: { amount: validatedData.amount, provider: validatedData.provider, transactionId },
        });

        res.status(200).json({ paymentUrl, provider: validatedData.provider, transactionId, referenceId });
    } catch (error: any) {
        Sentry.captureException(error, {
            extra: {
                route: req.path,
                method: req.method,
                userId: (req as any).user.id,
                amount: req.body.amount,
                provider: req.body.provider,
            },
        });
        res.status(400).json({ message: error.message || 'Failed to initiate top-up' });
    }
});

// Payment Callback
router.get('/callback', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { reference, tx_ref, transaction_id, trxref } = req.query as {
            reference?: string;
            tx_ref?: string;
            transaction_id?: string;
            trxref?: string;
        };

        let transaction = null;
        let provider: string;
        let paymentDetails: any;

        if (reference || trxref) {
            // Paystack
            provider = 'paystack';
            const secretKey =
                process.env.NODE_ENV === 'production'
                    ? process.env.PAYSTACK_SECRET_KEY_LIVE
                    : process.env.PAYSTACK_SECRET_KEY_TEST;
            const ref = reference || trxref || '';
            const response = await axios.get(`https://api.paystack.co/transaction/verify/${ref}`, {
                headers: { Authorization: `Bearer ${secretKey}` },
            });
            if (response.data.data.status !== 'success') {
                throw new Error('Payment failed');
            }
            paymentDetails = response.data.data;
            transaction = await storage.getWalletTransactionById(ref);
        } else if (tx_ref || transaction_id) {
            // Flutterwave
            provider = 'flutterwave';
            const secretKey =
                process.env.NODE_ENV === 'production'
                    ? process.env.FLUTTERWAVE_SECRET_KEY_LIVE
                    : process.env.FLUTTERWAVE_SECRET_KEY_TEST;
            const ref = transaction_id || tx_ref || '';
            const response = await axios.get(
                `https://api.flutterwave.com/v3/transactions/${ref}/verify`,
                {
                    headers: { Authorization: `Bearer ${secretKey}` },
                }
            );
            if (response.data.data.status !== 'successful') {
                throw new Error('Payment failed');
            }
            paymentDetails = response.data.data;
            transaction = await storage.getWalletTransactionById(ref);
        } else {
            throw new Error('Invalid payment reference');
        }

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        const wallet = await storage.getWallet(userId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        await storage.updateWallet(userId, { balance: wallet.balance + transaction.amount });
        await storage.updateWalletTransaction(transaction.transactionId, { status: 'Completed' });

        await auditLog(userId, 'GROWCOIN_TOPUP_COMPLETED', `Completed top-up of ${transaction.amount} GrowCoins`);

        await storage.createActivity({
            type: 'transaction',
            description: `Completed top-up of ${transaction.amount} GrowCoins`,
            userId,
            metadata: { 
                transactionId: transaction.transactionId, 
                amount: transaction.amount,
                provider,
                paymentDetails 
            },
        });

        await emailQueue.add({
            type: 'growcoin_topup_notification',
            email: (req as any).user?.email || 'unknown',
            name: (req as any).user?.name || 'unknown',
            amount: transaction.amount,
            transactionId: transaction.transactionId,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({
            status: 'success',
            message: 'Top-up completed successfully',
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            provider,
        });
    } catch (error: any) {
        Sentry.captureException(error, {
            extra: {
                route: req.path,    
                method: req.method,
                userId: (req as any).user.id,
                reference: req.query.reference,
                tx_ref: req.query.tx_ref,
                transaction_id: req.query.transaction_id,
                trxref: req.query.trxref,
            },
        });
        await storage.createActivity({
            type: 'error',
            description: 'Failed to process wallet top-up',
            userId: (req as any).user.id,
            metadata: { error: error.message },
        });
        res.status(400).json({
            status: 'error',
            message: error.message || 'Failed to process payment',
        });
    }
});

// Sentry error handler must be after all routes
if (process.env.GLITCHTIP_DSN && (Sentry as any).Handlers?.errorHandler) {
  router.use((Sentry as any).Handlers.errorHandler({
    shouldHandleError(error: any) {
      return error.status === 404 || error.status >= 500;
    },
  }));
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.errorHandler not available. Skipping error handler middleware.");
}

export default router;