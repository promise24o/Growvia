import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MongoStorage } from "../mongoStorage";
import { IStorage } from "../storage";

const storage: IStorage = new MongoStorage();
const router = Router();

router.post("/request", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { amount, paymentMethod } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payout = await storage.createPayout({
      userId,
      amount,
      status: "pending",
      paymentMethod,
    });

    return res.status(201).json(payout);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const payouts = await storage.getPayoutsByUser(userId);
    return res.json(payouts);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
