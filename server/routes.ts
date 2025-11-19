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
import referralRoutes from "./routes/referral.routes";
import userRoutes from "./routes/user.routes";
import walletRoutes from "./routes/wallet.routes";
import { setupPaymentRoutes } from "./services/payment.service";
import commissionRoutes from "./routes/commission.routes";
import applicationRoutes from "./routes/application.routes";
import campaignRoutes from "./routes/campaign.routes";
import campaignAffiliateRoutes from "./routes/campaignAffiliate.routes";
import payoutRoutes from "./routes/payout.routes";
import growviaWalletRoutes from "./routes/growviaWallet.routes";
import kycRoutes from "./routes/kyc.routes";

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
  router.use("/affiliate-links", affiliateLinkRoutes);
  router.use("/conversions", conversionRoutes);
  router.use("/analytics", analyticsRoutes);
  router.use("/activities", activityRoutes);
  router.use("/affiliates", affiliateRoutes);
  router.use("/users", userRoutes);
  router.use("/wallet", walletRoutes);
  router.use("/referrals", referralRoutes);
  router.use('/commissions', commissionRoutes);
  router.use('/applications', applicationRoutes);
  router.use('/campaigns', campaignRoutes);
  router.use('/campaign-affiliates', campaignAffiliateRoutes);
  router.use('/payouts', payoutRoutes);
  router.use('/growvia-wallet', growviaWalletRoutes);
  router.use('/kyc', kycRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
