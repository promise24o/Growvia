import { Request, Response } from "express";
import {
  inviteMarketer as inviteMarketerService,
  removeMarketerOrApplication as removeMarketerOrApplicationService,
  getMarketerApplications as getMarketerApplicationsService,
  getSingleApplication as getSingleApplicationService,
  verifyApplicationToken as verifyApplicationTokenService,
  submitApplication as submitApplicationService,
  reviewApplication as reviewApplicationService,
  approveApplication as approveApplicationService,
  rejectApplication as rejectApplicationService,
  getAllApplications as getAllApplicationsService,
  getApplicationByToken as getApplicationByTokenService,
  resendInvite as resendInviteService,
  getTopMarketers as getTopMarketersService,
  getMarketerUserProfile as getUserProfileService,
} from "../services";

export const inviteMarketer = async (req: Request, res: Response) => {
  try {
    const result = await inviteMarketerService(req.body, (req as any).user);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Error inviting marketer:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const removeMarketerOrApplication = async (req: Request, res: Response) => {
  try {
    const result = await removeMarketerOrApplicationService(req.params.id, req.body, (req as any).user);
    return res.status(result.status).json(result);
  } catch (error: any) {
    console.error("Error removing marketer or application:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMarketerApplications = async (req: Request, res: Response) => {
  try {
    const result = await getMarketerApplicationsService((req as any).user, req.query);
    return res.json(result);
  } catch (error: any) {
    console.error("Error fetching marketer applications:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getSingleApplication = async (req: Request, res: Response) => {
  try {
    const result = await getSingleApplicationService(req.params.id, (req as any).user);
    return res.json(result);
  } catch (error: any) {
    console.error("Error fetching marketer application:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyApplicationToken = async (req: Request, res: Response) => {
  try {
    const result = await verifyApplicationTokenService(req.params.token);
    return res.json(result);
  } catch (error: any) {
    console.error("Error verifying application token:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const result = await submitApplicationService(req.params.token, req.body, files);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error submitting marketer application:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const reviewApplication = async (req: Request, res: Response) => {
  try {
    const result = await reviewApplicationService(req.params.id, req.body, (req as any).user);
    return res.json(result);
  } catch (error: any) {
    console.error("Error reviewing application:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const approveApplication = async (req: Request, res: Response) => {
  try {
    const result = await approveApplicationService(req.params.id, req.body, (req as any).user);
    return res.json(result);
  } catch (error: any) {
    console.error("Error approving application:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectApplication = async (req: Request, res: Response) => {
  try {
    const result = await rejectApplicationService(req.params.id, req.body, (req as any).user);
    return res.json(result);
  } catch (error: any) {
    console.error("Error rejecting application:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const result = await getAllApplicationsService((req as any).user, req.query);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching marketer applications:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getApplicationByToken = async (req: Request, res: Response) => {
  try {
    const result = await getApplicationByTokenService(req.params.token);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching marketer application:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const resendInvite = async (req: Request, res: Response) => {
  try {
    const result = await resendInviteService(req.body, (req as any).user, req);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error resending marketer invite:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const getTopMarketers = async (req: Request, res: Response) => {
  try {
    const result = await getTopMarketersService((req as any).user, req.query);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error',
        message: 'User ID is required' 
      });
    }

    const result = await getUserProfileService(userId);
    
    return res.status(200).json({
      status: 'success',
      message: 'User profile retrieved successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      status: 'error',
      message: error.message || 'Failed to fetch user profile' 
    });
  }
};