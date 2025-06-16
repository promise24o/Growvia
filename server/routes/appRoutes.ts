import {
    PLAN_LIMITS,
    SubscriptionPlan,
    UserRole,
    insertAppSchema,
} from "@shared/schema";
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const apps = await storage.getAppsByOrganization(organizationId);
    return res.json(apps);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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

      const apps = await storage.getAppsByOrganization(organizationId);
      const planLimits = PLAN_LIMITS[organization.plan as SubscriptionPlan];
      if (apps.length >= planLimits.apps) {
        return res.status(403).json({
          message: `Your plan allows a maximum of ${planLimits.apps} apps. Please upgrade your plan.`,
        });
      }

      const validatedData = insertAppSchema.parse({
        ...req.body,
        ...{ organizationId }, 
      });

      const app = await storage.createApp(validatedData);
      await storage.createActivity({
        organizationId,
        userId: (req as any).user.id,
        type: "app_created",
        description: `New app "${app.name}" created`,
      });

      return res.status(201).json(app);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
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
    const topProducts = await storage.getTopProducts(organizationId, limit);

    return res.json(topProducts);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
