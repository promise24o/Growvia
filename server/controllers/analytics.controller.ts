import { Request, Response } from "express";
import { getOrganizationStats as getOrgStatsService, getUserStats as getUserStatsService } from "../services";

export const getOrganizationStats = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      return res.status(404).json({ message: "No organization associated with this user" });
    }

    const stats = await getOrgStatsService(organizationId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await getUserStatsService(userId);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};