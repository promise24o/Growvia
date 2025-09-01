import { Request, Response } from "express";
import { getActivitiesByOrganization as getActivitiesService } from "../services";

export const getActivitiesByOrganization = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user.organizationId;
    const role = (req as any).user.role;
    if (!organizationId && role === "admin") {
      return res.status(404).json({ message: "No organization associated with this user" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const activities = await getActivitiesService(organizationId, limit);
    return res.json(activities);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};