import { Express, NextFunction, Request, Response } from "express";
import { createServer, Server } from "http";
import activityRoutes from "./routes/activityRoutes";
import affiliateLinkRoutes from "./routes/affiliateLinkRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import appRoutes from "./routes/appRoutes";
import authRoutes from "./routes/authRoutes";
import conversionRoutes from "./routes/conversionRoutes";
import managementRoutes from "./routes/managementRoutes";
import marketerApplicationRoutes from "./routes/marketerApplicationRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import payoutRoutes from "./routes/payoutRoutes";
import { setupPaymentRoutes } from "./services/payment";

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

  const httpServer = createServer(app);
  return httpServer;
}
