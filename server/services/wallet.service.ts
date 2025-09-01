import { z } from "zod";
import axios from "axios";
import { nanoid } from "nanoid";
import emailQueue from "../queue/emailQueue";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";
import { auditLog } from "../utils/auditLog";

const storage: IStorage = new MongoStorage();

// Zod Schemas for Validation
const transferSchema = z.object({
  receiver: z.string().min(1, "Receiver username or email is required"),
  amount: z.number().min(5, "Minimum transfer is 5 GrowCoins"),
  note: z.string().max(100, "Note must be 100 characters or less").optional(),
});

const topUpSchema = z.object({
  amount: z.number().min(500, "Minimum top-up is ₦500"),
  provider: z.string().refine((value) => ["paystack", "flutterwave"].includes(value), "Invalid payment provider"),
});

export const getWalletAndTransactions = async (userId: string) => {
  const wallet = await storage.getWallet(userId);
  const transactions = await storage.getWalletTransactions(userId);

  const transactionCount = transactions.length;
  const lastTransaction =
    transactions.length > 0
      ? transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null;

  return {
    wallet: {
      ...wallet,
      transactionCount,
      lastTransaction,
    },
    transactions,
  };
};

export const transferGrowCoins = async (user: any, data: any, ipAddress: string, deviceFingerprint: string | undefined) => {
  const validatedData = transferSchema.parse(data);
  const userId = user.id;

  const senderWallet = await storage.getWallet(userId);
  if (!senderWallet) {
    throw new Error("Sender wallet not found");
  }

  const receiverUser = await storage.getUserByEmailOrUsername(validatedData.receiver);
  if (!receiverUser) {
    throw new Error("Receiver not found");
  }
  if (receiverUser.id === userId) {
    throw new Error("Cannot transfer to yourself");
  }

  const receiverWallet = await storage.getWallet(receiverUser.id);
  if (!receiverWallet) {
    throw new Error("Receiver wallet not found");
  }

  const today = new Date().setHours(0, 0, 0, 0);
  const dailyTransfers = await storage.countWalletTransactions(userId, "Transfer Out", today);
  if (dailyTransfers >= 500) {
    throw new Error("Daily transfer limit exceeded");
  }

  const transactionFeePercentage = parseFloat(process.env.GROWCOIN_TRANSACTION_PERCENTAGE || "10") / 100;
  const transactionFee = validatedData.amount * transactionFeePercentage;
  const totalDeduction = validatedData.amount + transactionFee;

  if (senderWallet.balance < totalDeduction) {
    throw new Error("Insufficient balance for transfer and fee");
  }

  const transactionId = `GVC${nanoid(8)}`;
  const receiverTransactionId = `GVC${nanoid(8)}`;

  await storage.updateWallet(userId, { balance: senderWallet.balance - totalDeduction });
  await storage.updateWallet(receiverUser.id, { balance: receiverWallet.balance + validatedData.amount });

  await storage.createWalletTransaction({
    userId,
    description: `Sent to @${receiverUser.username} ${validatedData.note ? `(${validatedData.note})` : ""}`,
    type: "Transfer Out",
    amount: -validatedData.amount,
    transactionId: transactionId,
    receiverId: receiverUser.id,
    ipAddress,
    deviceFingerprint,
  });

  await storage.createWalletTransaction({
    userId: receiverUser.id,
    description: `Received from @${user.username} ${validatedData.note ? `(${validatedData.note})` : ""}`,
    type: "Transfer In",
    amount: validatedData.amount,
    transactionId: receiverTransactionId,
    ipAddress,
    deviceFingerprint,
  });

  await storage.createWalletTransaction({
    userId,
    description: "Platform transfer fee",
    type: "Spent",
    amount: -transactionFee,
    transactionId: `FEE${nanoid(8)}`,
    ipAddress,
    deviceFingerprint,
  });

  await auditLog(userId, "GROWCOIN_TRANSFER", `Transferred ${validatedData.amount} GrowCoins to @${receiverUser.username}`);
  await auditLog(receiverUser.id, "GROWCOIN_RECEIVED", `Received ${validatedData.amount} GrowCoins from @${user.username}`);

  await emailQueue.add({
    type: "growcoin_transfer_notification",
    email: user.email,
    name: user.username,
    receiver: receiverUser.username,
    amount: validatedData.amount,
    transactionId: transactionId,
    timestamp: new Date().toISOString(),
  });

  await emailQueue.add({
    type: "growcoin_received_notification",
    email: receiverUser.email,
    name: receiverUser.username,
    sender: user.username,
    amount: validatedData.amount,
    transactionId: receiverTransactionId,
    timestamp: new Date().toISOString(),
  });

  return {
    message: `You’ve sent ${validatedData.amount} GrowCoins to @${receiverUser.username}. Transaction ID: ${transactionId}`,
  };
};

export const topUpGrowCoins = async (user: any, data: any, origin: string | undefined, ipAddress: string, deviceFingerprint: string | undefined) => {
  const validatedData = topUpSchema.parse(data);
  const userId = user.id;

  const growCoins = validatedData.amount / Number(process.env.GROWCOIN_TO_NAIRA || 100);

  const secretKey =
    validatedData.provider === "paystack"
      ? process.env.NODE_ENV === "production"
        ? process.env.PAYSTACK_SECRET_KEY_LIVE
        : process.env.PAYSTACK_SECRET_KEY_TEST
      : process.env.NODE_ENV === "production"
      ? process.env.FLUTTERWAVE_SECRET_KEY_LIVE
      : process.env.FLUTTERWAVE_SECRET_KEY_TEST;

  if (!secretKey) {
    throw new Error("Payment provider configuration missing");
  }

  let paymentUrl: string;
  let referenceId: string;
  const transactionId = `TOPUP${nanoid(8)}`;

  if (validatedData.provider === "paystack") {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email,
        amount: validatedData.amount * 100,
        callback_url: `${origin || "https://www.growviapro.com"}/auth/wallet/callback`,
        reference: transactionId,
      },
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    paymentUrl = response.data.data.authorization_url;
    referenceId = transactionId;
  } else {
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: transactionId,
        amount: validatedData.amount,
        currency: "NGN",
        redirect_url: `${origin || "https://www.growviapro.com"}/auth/wallet/callback`,
        customer: { email: user.email, name: user.name },
        meta: { transactionId },
      },
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    paymentUrl = response.data.data.link;
    referenceId = transactionId;
  }

  await storage.createWalletTransaction({
    userId,
    description: `Top-up of ${growCoins} GrowCoins`,
    type: "Earned",
    amount: growCoins,
    status: "Pending",
    transactionId,
    referenceId,
    ipAddress,
    deviceFingerprint,
  });

  await auditLog(userId, "GROWCOIN_TOPUP_INITIATED", `Initiated top-up of ${growCoins} GrowCoins`);

  await storage.createActivity({
    type: "transaction",
    description: `Initiated top-up of ${growCoins} GrowCoins`,
    userId,
    metadata: { amount: validatedData.amount, provider: validatedData.provider, transactionId, referenceId },
  });

  return { paymentUrl, provider: validatedData.provider, transactionId, referenceId };
};

export const handlePaymentCallback = async (user: any, query: any, ipAddress: string, deviceFingerprint: string | undefined) => {
  const userId = user.id;
  const { reference, tx_ref, transaction_id, trxref } = query as {
    reference?: string;
    tx_ref?: string;
    transaction_id?: string;
    trxref?: string;
  };

  let transaction = null;
  let provider: string;
  let paymentDetails: any;

  if (reference || trxref) {
    provider = "paystack";
    const secretKey =
      process.env.NODE_ENV === "production"
        ? process.env.PAYSTACK_SECRET_KEY_LIVE
        : process.env.PAYSTACK_SECRET_KEY_TEST;
    const ref = reference || trxref;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (response.data.data.status !== "success") {
      throw new Error("Payment failed");
    }
    paymentDetails = response.data.data;
    transaction = await storage.getWalletTransactionById(ref);
  } else if (tx_ref || transaction_id) {
    provider = "flutterwave";
    const secretKey =
      process.env.NODE_ENV === "production"
        ? process.env.FLUTTERWAVE_SECRET_KEY_LIVE
        : process.env.FLUTTERWAVE_SECRET_KEY_TEST;
    const ref = transaction_id || tx_ref;
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${ref}/verify`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (response.data.data.status !== "successful") {
      throw new Error("Payment failed");
    }
    paymentDetails = response.data.data;
    transaction = await storage.getWalletTransactionById(ref);
  } else {
    throw new Error("Invalid payment reference");
  }

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const wallet = await storage.getWallet(userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  await storage.updateWallet(userId, { balance: wallet.balance + transaction.amount });
  await storage.updateWalletTransaction(transaction.transactionId, { status: "Completed" });

  await auditLog(userId, "GROWCOIN_TOPUP_COMPLETED", `Completed top-up of ${transaction.amount} GrowCoins`);

  await storage.createActivity({
    type: "transaction",
    description: `Completed top-up of ${transaction.amount} GrowCoins`,
    userId,
    metadata: {
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      provider,
      paymentDetails,
    },
  });

  await emailQueue.add({
    type: "growcoin_topup_notification",
    email: user.email,
    name: user.name,
    amount: transaction.amount,
    transactionId: transaction.transactionId,
    timestamp: new Date().toISOString(),
  });

  return {
    status: "success",
    message: "Top-up completed successfully",
    transactionId: transaction.transactionId,
    amount: transaction.amount,
    provider,
  };
};