import { randomBytes } from "crypto";
import { Router } from "express";
import { PLAN_LIMITS, SubscriptionPlan, UserRole } from "../../shared/schema";
import { authenticate, authorize } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";
import { sendMarketerInvitationEmail } from "../utils/email";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/", authenticate, authorize([UserRole.ADMIN]), async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const users = await storage.getUsersByOrganization(organizationId);
    const approvedMarketers = users
      .filter((user) => user.role === UserRole.MARKETER)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        source: "user",
      }));

    const marketerApplications = await storage.getMarketerApplications({
      organizationId,
      status: { $in: ["invited", "pending"] },
    });

    const invitedMarketers = marketerApplications.map((app) => ({
      id: app._id.toString(),
      name: app.name,
      email: app.email,
      phone: app.phone,
      status: app.status,
      role: UserRole.MARKETER,
      createdAt: app.applicationDate,
      source: "application",
    }));

    const allMarketers = [...approvedMarketers, ...invitedMarketers].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json(allMarketers);
  } catch (error: any) {
    console.error("Error fetching marketers:", error);
    return res
      .status(500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.post(
  "/",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;
      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const marketers = await storage.getUsersByOrganization(organizationId);
      const marketerCount = marketers.filter(
        (u) => u.role === UserRole.MARKETER
      ).length;

      const planLimits = PLAN_LIMITS[organization.plan as SubscriptionPlan];
      if (marketerCount >= planLimits.marketers) {
        return res.status(403).json({
          message: `Your plan allows a maximum of ${planLimits.marketers} marketers. Please upgrade your plan.`,
        });
      }

      const temporaryPassword = randomBytes(8).toString("hex");
      const marketer = await storage.createUser({
        organizationId,
        name: req.body.name,
        email: req.body.email,
        password: temporaryPassword,
        role: UserRole.MARKETER,
        status: "pending",
      });

      await storage.createActivity({
        organizationId,
        userId: (req as any).user.id,
        type: "marketer_invited",
        description: `${req.body.name} invited as a new marketer`,
      });

      return res.status(201).json({
        marketer: {
          id: marketer.id,
          name: marketer.name,
          email: marketer.email,
          status: marketer.status,
        },
        inviteLink: `${req.protocol}://${req.get(
          "host"
        )}/marketer/accept-invite?email=${
          marketer.email
        }&token=${temporaryPassword}`,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/top", authenticate, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const topMarketers = await storage.getTopMarketers(organizationId, limit);

    return res.json(topMarketers);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.post(
  "/resend-invite",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      console.log("I made it here");
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const userId = (req as any).user.id;
      const organizationId = (req as any).user.organizationId;
      const existingApplications = await storage.getMarketerApplications({
        organizationId,
        email,
      });

      if (existingApplications.length === 0) {
        return res
          .status(404)
          .json({ message: "No existing invitation found for this email" });
      }

      const application = existingApplications[0];
      if (application.status !== "invited") {
        return res.status(400).json({
          message: "Cannot resend invite for non-invited application",
        });
      }

      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const baseUrl = process.env.BASE_URL || `http://${req.hostname}:5000`;
      const invitationUrl = `${baseUrl}/marketer/onboarding/${application.applicationToken}`;

      await sendMarketerInvitationEmail(
        application,
        organization,
        invitationUrl
      );

      return res.status(200).json({
        message: "Invitation resent successfully",
        application,
        inviteLink: invitationUrl,
      });
    } catch (error: any) {
      console.error("Error resending marketer invite:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);


router.post(
  "/invite",
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const userId = (req as any).user.id;
      const organizationId = (req as any).user.organizationId;
      if (!organizationId) {
        return res
          .status(403)
          .json({ message: "Only organization admins can invite marketers" });
      }

      const user = await storage.getUser(userId);
      const organization = await storage.getOrganization(organizationId);
      if (!user || !organization) {
        return res
          .status(404)
          .json({ message: "User or organization not found" });
      }

      const existingApplications = await storage.getMarketerApplications({
        organizationId,
        email,
      });
      if (existingApplications.length > 0) {
        const existingApp = existingApplications[0];
        const baseUrl =
          process.env.NODE_ENV === "production"
            ? "https://growviapro.com"
            : `http://${req.hostname}:5000`;
        const invitationUrl = `${baseUrl}/marketer/onboarding/${existingApp.applicationToken}`;

        return res.status(200).json({
          message: "Marketer already invited",
          application: existingApp,
          inviteLink: invitationUrl,
        });
      }

      const application = await storage.createMarketerApplication({
        name,
        email,
        phone,
        organizationId,
        invitedBy: userId,
        status: "invited",
        applicationToken: randomBytes(32).toString("hex"),
      });

      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://growviapro.com"
          : `http://${req.hostname}:5000`;
      const invitationUrl = `${baseUrl}/marketer/onboarding/${application.applicationToken}`;

      await sendMarketerInvitationEmail(
        application,
        organization,
        invitationUrl
      );

      await storage.createActivity({
        type: "marketer_invited",
        description: `${user.name} invited ${name} as a marketer`,
        organizationId,
        userId,
        metadata: { marketerEmail: email },
      });

      return res.status(201).json({
        message: "Marketer invitation sent successfully",
        application,
        inviteLink: invitationUrl,
      });
    } catch (error: any) {
      console.error("Error inviting marketer:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  }
);


export default router;
