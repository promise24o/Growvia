import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/organization", authenticate, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const stats = await storage.getOrganizationStats(organizationId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/user", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const stats = await storage.getUserStats(userId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
