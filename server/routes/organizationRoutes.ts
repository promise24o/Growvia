import { Router } from "express";
import { UserRole, onboardingSchema } from "../../shared/schema";
import { authenticate, authorize } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/current", authenticate, async (req, res) => {
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

    return res.json(organization);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/current",
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

      const organization = await storage.updateOrganization(
        organizationId,
        req.body
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      return res.json(organization);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  "/onboarding",
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

      const validatedData = onboardingSchema.parse(req.body);
      const organization = await storage.updateOrganization(organizationId, {
        primaryGoal: validatedData.primaryGoal,
        targetAudience: validatedData.targetAudience,
        existingAffiliates: validatedData.existingAffiliates,
        productsToPromote: validatedData.productsToPromote,
        onboardingCompleted: true,
      });

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      await storage.createActivity({
        organizationId,
        userId: (req as any).user.id,
        type: "onboarding_completed",
        description: "Organization completed the onboarding process",
      });

      return res.json({
        success: true,
        message: "Onboarding completed successfully",
        organization,
      });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      return res.status(error.status || 500).json({
        message: error.message || "An error occurred during onboarding",
      });
    }
  }
);

export default router;


