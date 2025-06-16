import { insertAffiliateLinkSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const links = await storage.getAffiliateLinksByUser(userId);
    return res.json(links);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res
        .status(404)
        .json({ message: "No organization associated with this user" });
    }

    const app = await storage.getApp(req.body.appId);
    if (!app || app.organizationId !== organizationId) {
      return res.status(404).json({ message: "App not found" });
    }

    const code = randomBytes(6).toString("hex");
    const validatedData = insertAffiliateLinkSchema.parse({
      userId,
      appId: app.id,
      code,
    });

    const link = await storage.createAffiliateLink(validatedData);
    await storage.createActivity({
      organizationId,
      userId,
      type: "affiliate_link_created",
      description: `New affiliate link created for "${app.name}"`,
    });

    return res.status(201).json(link);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/:code/redirect", async (req, res) => {
  try {
    const { code } = req.params;
    const link = await storage.getAffiliateLinkByCode(code);
    if (!link) {
      return res.status(404).json({ message: "Affiliate link not found" });
    }

    const app = await storage.getApp(link.appId);
    if (!app) {
      return res.status(404).json({ message: "App not found" });
    }

    await storage.incrementLinkClicks(link.id);
    return res.redirect(`${app.baseUrl}?ref=${link.code}`);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
