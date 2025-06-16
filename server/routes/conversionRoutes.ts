import { UserRole, insertConversionSchema } from "@shared/schema";
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.post("/webhooks", async (req, res) => {
  try {
    const { code, transactionId, amount } = req.body;
    if (!code || !transactionId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const link = await storage.getAffiliateLinkByCode(code);
    if (!link) {
      return res.status(404).json({ message: "Affiliate link not found" });
    }

    const app = await storage.getApp(link.appId);
    if (!app) {
      return res.status(404).json({ message: "App not found" });
    }

    let commission = 0;
    if (app.commissionType === "percentage") {
      commission = (app.commissionValue / 100) * amount;
    } else {
      commission = app.commissionValue;
    }

    const validatedData = insertConversionSchema.parse({
      linkId: link.id,
      transactionId,
      amount,
      commission,
      status: "pending",
      metadata: req.body,
    });

    const conversion = await storage.createConversion(validatedData);
    const user = await storage.getUser(link.userId);
    const organization = user?.organizationId
      ? await storage.getOrganization(user.organizationId)
      : null;

    if (user && organization) {
      await storage.createActivity({
        organizationId: organization.id,
        userId: user.id,
        type: "conversion_created",
        description: `New conversion for "${app.name}" - $${amount.toFixed(2)}`,
      });

      if (organization.webhookUrl) {
        console.log(
          `Would call webhook at ${organization.webhookUrl} with conversion data`
        );
      }
    }

    return res.status(201).json(conversion);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const organizationId = (req as any).user.organizationId;

    let conversions = [];
    if (role === UserRole.ADMIN && organizationId) {
      conversions = await storage.getConversionsByOrganization(organizationId);
    } else {
      conversions = await storage.getConversionsByUser(userId);
    }

    return res.json(conversions);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
