import "reflect-metadata";
import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { Get, Post } from "../decorators/route";
import { getWalletAndTransactions, transferGrowCoins, topUpGrowCoins, handlePaymentCallback } from "../controllers/wallet.controller";
import * as Sentry from "@sentry/node";

export class WalletController {
  @Get("/", [authenticate])
  async getWalletAndTransactions(req: Request, res: Response) {
    return getWalletAndTransactions(req, res);
  }

  @Post("/transfer", [authenticate])
  async transferGrowCoins(req: Request, res: Response) {
    return transferGrowCoins(req, res);
  }

  @Post("/top-up", [authenticate])
  async topUpGrowCoins(req: Request, res: Response) {
    return topUpGrowCoins(req, res);
  }

  @Get("/callback", [authenticate])
  async handlePaymentCallback(req: Request, res: Response) {
    return handlePaymentCallback(req, res);
  }
}

const router = Router();

// Apply Sentry request handler for this router
if (process.env.GLITCHTIP_DSN && Sentry.Handlers?.requestHandler) {
  router.use(
    Sentry.Handlers.requestHandler({
      serverName: false,
      user: ["id", "username", "email"],
      transaction: "methodPath",
      flushTimeout: 2000,
    })
  );
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.requestHandler not available. Skipping request handler middleware.");
}

const walletController = new WalletController();

// Register routes dynamically using metadata
const methods = Object.getOwnPropertyNames(WalletController.prototype).filter(
  (prop) => prop !== "constructor"
);
methods.forEach((method) => {
  const routeMetadata = Reflect.getMetadata("route", walletController[method as keyof WalletController]);
  if (routeMetadata) {
    const { method: httpMethod, path, middleware } = routeMetadata;
    switch (httpMethod.toUpperCase()) {
      case "GET":
        router.get(path, ...middleware, walletController[method as keyof WalletController].bind(walletController));
        break;
      case "POST":
        router.post(path, ...middleware, walletController[method as keyof WalletController].bind(walletController));
        break;
      default:
        console.warn(`Unsupported HTTP method: ${httpMethod}`);
    }
  }
});

// Sentry error handler must be after all routes
if (process.env.GLITCHTIP_DSN && Sentry.Handlers?.errorHandler) {
  router.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError(error: any) {
        return error.status === 404 || error.status >= 500;
      },
    })
  );
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.errorHandler not available. Skipping error handler middleware.");
}

export default router;