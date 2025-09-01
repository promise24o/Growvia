import { Request, Response } from "express";
import { handleTrialExpiry } from "../services/subscription.service";

export const checkTrialExpiry = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    await handleTrialExpiry(organizationId);
    return res.json({ message: "Trial expiry check completed" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

