import { Router } from "express";
import { SubscriptionPlan, UserRole } from "../../shared/schema";
import { authenticate, requireManagement } from "../middleware/auth";
import { AffiliateLink, App, Conversion, Organization, User } from "../models";

const router = Router();

router.get("/users", authenticate, requireManagement, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json(
      users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        createdAt: user.createdAt,
      }))
    );
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.get(
  "/organizations",
  authenticate,
  requireManagement,
  async (req, res) => {
    try {
      const organizations = await Organization.find().sort({ createdAt: -1 });
      return res.json(
        organizations.map((org) => ({
          id: org._id,
          name: org.name,
          email: org.email,
          plan: org.plan,
          createdAt: org.createdAt,
          trialEndsAt: org.trialEndsAt,
          onboardingCompleted: org.onboardingCompleted,
        }))
      );
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
);

router.get("/analytics", authenticate, requireManagement, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const appCount = await App.countDocuments();
    const linkCount = await AffiliateLink.countDocuments();
    const conversionCount = await Conversion.countDocuments();

    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    const marketerCount = await User.countDocuments({
      role: UserRole.MARKETER,
    });

    const freeTrial = await Organization.countDocuments({
      plan: SubscriptionPlan.FREE_TRIAL,
    });
    const starter = await Organization.countDocuments({
      plan: SubscriptionPlan.STARTER,
    });
    const growth = await Organization.countDocuments({
      plan: SubscriptionPlan.GROWTH,
    });
    const pro = await Organization.countDocuments({
      plan: SubscriptionPlan.PRO,
    });
    const enterprise = await Organization.countDocuments({
      plan: SubscriptionPlan.ENTERPRISE,
    });

    return res.json({
      userCount,
      organizationCount,
      appCount,
      linkCount,
      conversionCount,
      usersByRole: {
        admin: adminCount,
        marketer: marketerCount,
      },
      organizationsByPlan: {
        freeTrial,
        starter,
        growth,
        pro,
        enterprise,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/users/:userId",
  authenticate,
  requireManagement,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, role } = req.body;

      const updates: any = {};
      if (status) updates.status = status;
      if (role) updates.role = role;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
);

export default router;
