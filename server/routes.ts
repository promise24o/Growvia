import { Express, NextFunction, Request, Response } from "express";
import { createServer, Server } from "http";
import activityRoutes from "./routes/activity.routes";
import affiliateLinkRoutes from "./routes/affiliateLinkRoutes";
import affiliateRoutes from "./routes/affiliateRoutes";
import analyticsRoutes from "./routes/analytics.routes";
import appRoutes from "./routes/appRoutes";
import authRoutes from "./routes/auth.routes";
import conversionRoutes from "./routes/conversionRoutes";
import managementRoutes from "./routes/managementRoutes";
import marketerApplicationRoutes from "./routes/marketerApplication.routes";
import organizationRoutes from "./routes/organizationRoutes";
import payoutRoutes from "./routes/payoutRoutes";
import referralRoutes from "./routes/referral.routes";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.routes";
import { setupPaymentRoutes } from "./services/payment.service";
import commissionRoutes from "./routes/commission.routes";

export async function registerRoutes(
  app: Express,
  apiRouter?: any
): Promise<Server> {
  const router = apiRouter || app;

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Content-Type", "application/json");
    next();
  });

  setupPaymentRoutes(app);

  router.use("/auth", authRoutes);
  router.use("/management", managementRoutes);
  router.use("/organizations", organizationRoutes);
  router.use("/marketers", marketerApplicationRoutes);
  router.use("/apps", appRoutes);
  router.use("/affiliate-links", affiliateLinkRoutes);
  router.use("/conversions", conversionRoutes);
  router.use("/analytics", analyticsRoutes);
  router.use("/activities", activityRoutes);
  router.use("/payouts", payoutRoutes);
  router.use("/affiliates", affiliateRoutes);
  router.use("/users", userRoutes);
  router.use("/wallet", walletRoutes);
  router.use("/referrals", referralRoutes);
  router.use('/commissions', commissionRoutes);


  const httpServer = createServer(app);
  return httpServer;
}
