import { Request, Response } from "express";
import { getReferrals as getReferralsService } from "../services";

export const getReferrals = async (req: Request, res: Response) => {
  try {
    const result = await getReferralsService((req as any).user.id);
    return res.json(result);
  } catch (error: any) {
    console.error("Fetch referrals error:", error);
    return res.status(500).json({ message: "Failed to fetch referrals" });
  }
};