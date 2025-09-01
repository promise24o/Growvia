import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const organizationId = (req as any).user.organizationId;
    const role = (req as any).user.role;
    if (!organizationId && role === "admin") {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const activities = await storage.getActivitiesByOrganization(
      organizationId,
      limit
    );

    return res.json(activities);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;