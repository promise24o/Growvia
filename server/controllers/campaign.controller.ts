import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { campaignService } from "../services/campaign.service";
import { campaignSchema, updateCampaignSchema } from "../../shared/schema";
import { fromZodError } from "zod-validation-error";
import { App } from "../models/Application"; // Ensure App model is registered

// Trigger model registration
App;

export class CampaignController {

  getOrganizationCampaignStats = async (req: Request, res: Response) => {
    try {
      const organizationIdArray = (req as any).user?.organizationId;
      const organizationId = Array.isArray(organizationIdArray) ? organizationIdArray[0] : organizationIdArray;
      
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }

      const stats = await campaignService.getOrganizationCampaignStats(organizationId);
      return res.status(200).json({
        status: "success",
        data: stats,
        message: "Campaign stats retrieved successfully",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to retrieve campaign stats",
      });
    }
  };

  createCampaign = async (req: Request, res: Response) => {
    try {
      // Validate request body against schema
      const validationResult = campaignSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const data = validationResult.data;
      const organizationId = (req as any).user?.organizationId;
      const campaignData = {
        ...data,
        organizationId: organizationId ? (typeof organizationId === 'string' ? organizationId : organizationId.toString()) : undefined
      };
      const campaign = await campaignService.createCampaign(campaignData);
      return res.status(201).json({
        status: "success",
        message: "Campaign created successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to create campaign",
      });
    }
  };

  getCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.getCampaignById(id as string);
      return res.status(200).json({
        status: "success",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch campaign",
      });
    }
  };

  getOrganizationCampaigns = async (req: Request, res: Response) => {
    try {
      let organizationId = (req as any).user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }

      // Convert to string if it's an array or object
      if (Array.isArray(organizationId)) {
        organizationId = organizationId[0];
      }
      if (typeof organizationId !== 'string') {
        organizationId = organizationId.toString();
      }

      // Validate ObjectId
      const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(organizationId);
      if (!isValidObjectId) {
        return res.status(400).json({
          status: "error",
          message: "Invalid organization ID format",
        });
      }

      // Extract query parameters for filtering
      const filters = {
        category: req.query.category as string,
        status: req.query.status as string,
        visibility: req.query.visibility as string,
        applicationId: req.query.applicationId as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await campaignService.getCampaignsByOrganization(organizationId as string, filters);
      return res.status(200).json({
        status: "success",
        data: result.campaigns,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch organization campaigns",
      });
    }
  };

  updateCampaign = async (req: Request, res: Response) => {
    try {
      // Validate request body against schema (partial update)
      const validationResult = updateCampaignSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: validationError.details,
        });
      }

      const { id } = req.params;
      const data = validationResult.data;
      const campaign = await campaignService.updateCampaign(id as string, data);
      return res.status(200).json({
        status: "success",
        message: "Campaign updated successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to update campaign",
      });
    }
  };

  duplicateCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }
      const campaign = await campaignService.duplicateCampaign(id as string, organizationId);
      return res.status(201).json({
        status: "success",
        message: "Campaign duplicated successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to duplicate campaign",
      });
    }
  };

  deleteCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await campaignService.deleteCampaign(id as string);
      return res.status(200).json({
        status: "success",
        message: "Campaign deleted successfully",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to delete campaign",
      });
    }
  };

  pauseCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.pauseCampaign(id as string);
      return res.status(200).json({
        status: "success",
        message: "Campaign paused successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to pause campaign",
      });
    }
  };

  resumeCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.resumeCampaign(id as string);
      return res.status(200).json({
        status: "success",
        message: "Campaign resumed successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to resume campaign",
      });
    }
  };

  completeCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.completeCampaign(id as string);
      return res.status(200).json({
        status: "success",
        message: "Campaign completed successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to complete campaign",
      });
    }
  };

  archiveCampaign = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const campaign = await campaignService.archiveCampaign(id as string);
      return res.status(200).json({
        status: "success",
        message: "Campaign archived successfully",
        data: campaign,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to archive campaign",
      });
    }
  };

  getCampaignsByApplication = async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.params;
      const campaigns = await campaignService.getCampaignsByApplication(applicationId as string);
      return res.status(200).json({
        status: "success",
        data: campaigns,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          applicationId: req.params.applicationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch campaigns by application",
      });
    }
  };

  getPublicCampaigns = async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await campaignService.getPublicCampaigns(filters);
      return res.status(200).json({
        status: "success",
        data: result.campaigns,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch public campaigns",
      });
    }
  };
}

export const campaignController = new CampaignController();
