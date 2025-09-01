import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import {
  getWalletAndTransactions as getWalletAndTransactionsService,
  transferGrowCoins as transferGrowCoinsService,
  topUpGrowCoins as topUpGrowCoinsService,
  handlePaymentCallback as handlePaymentCallbackService,
} from "../services";

export const getWalletAndTransactions = async (req: Request, res: Response) => {
  try {
    const result = await getWalletAndTransactionsService((req as any).user.id);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: error.message || "Failed to fetch wallet data" });
  }
};

export const transferGrowCoins = async (req: Request, res: Response) => {
  try {
    const result = await transferGrowCoinsService((req as any).user, req.body, req.ip, req.headers["user-agent"]);
    return res.status(200).json(result);
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
    return res.status(500).json({ message: error.message || "Failed to transfer GrowCoins" });
  }
};

export const topUpGrowCoins = async (req: Request, res: Response) => {
  try {
    const result = await topUpGrowCoinsService((req as any).user, req.body, req.get("origin"), req.ip, req.headers["user-agent"]);
    return res.status(200).json(result);
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
    return res.status(400).json({ message: error.message || "Failed to initiate top-up" });
  }
};

export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const result = await handlePaymentCallbackService((req as any).user, req.query, req.ip, req.headers["user-agent"]);
    return res.status(200).json(result);
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
    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to process payment",
    });
  }
};