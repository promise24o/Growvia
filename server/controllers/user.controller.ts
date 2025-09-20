// controllers/user.controller.ts
import { Request, Response } from "express";
import { profileService } from "../services";

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const result = await profileService.uploadProfilePhoto((req as any).user.id, req.file as Express.Multer.File);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const result = await profileService.updateProfile((req as any).user.id, req.body);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};