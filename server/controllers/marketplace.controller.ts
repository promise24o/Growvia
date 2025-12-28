import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { marketplaceService, MarketplaceFilters } from "../services/marketplace.service";
import { z } from "zod";

const marketplaceFiltersSchema = z.object({
  categories: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return undefined;
  }),
  conversionTypes: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return undefined;
  }),
  validationMethods: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return undefined;
  }),
  payoutTypes: z.union([z.string(), z.array(z.string())]).optional().transform(val => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split(',').filter(Boolean);
    return undefined;
  }),
  sortBy: z.string().optional(),
  payoutRange: z.union([z.string(), z.array(z.number())]).optional().transform(val => {
    if (!val) return undefined;
    if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
    if (typeof val === 'string') {
      return val.split(',').map(Number).filter(n => !isNaN(n));
    }
    return undefined;
  }),
  minPayout: z.coerce.number().optional(),
  maxPayout: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
}).passthrough();

const applyToCampaignSchema = z.object({
  message: z.string().optional(),
  experience: z.string().optional(),
  trafficSources: z.array(z.string()).optional(),
  estimatedConversions: z.number().optional(),
});

export class MarketplaceController {
  getMarketplaceCampaigns = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      
      console.log('Raw query params:', req.query);
      
      const filtersResult = marketplaceFiltersSchema.safeParse(req.query);
      if (!filtersResult.success) {
        console.error('Filter validation failed:', filtersResult.error.issues);
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: filtersResult.error.issues,
        });
      }

      const filters: MarketplaceFilters = filtersResult.data || {};
      
      console.log('Parsed filters:', JSON.stringify(filters, null, 2));
      
      const result = await marketplaceService.getMarketplaceCampaigns(userId, filters);
      
      return res.status(200).json({
        status: "success",
        message: "Marketplace campaigns retrieved successfully",
        data: result.campaigns,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting marketplace campaigns:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to retrieve marketplace campaigns",
      });
    }
  };

  getRecommendations = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const recommendations = await marketplaceService.getRecommendations(userId, limit);
      
      return res.status(200).json({
        status: "success",
        message: "Recommendations retrieved successfully",
        data: recommendations,
      });
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to retrieve recommendations",
      });
    }
  };

  applyToCampaign = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      const applicationDataResult = applyToCampaignSchema.safeParse(req.body);
      if (!applicationDataResult.success) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: applicationDataResult.error.issues,
        });
      }

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "Campaign ID is required",
        });
      }

      const application = await marketplaceService.applyToCampaign(
        userId, 
        id, 
        applicationDataResult.data
      );
      
      return res.status(201).json({
        status: "success",
        message: "Application submitted successfully!",
        data: application,
      });
    } catch (error: any) {
      console.error('Error applying to campaign:', error);
      Sentry.captureException(error);
      return res.status(400).json({
        status: "error",
        message: error.message || "Failed to apply to campaign",
      });
    }
  };

  saveCampaign = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "Campaign ID is required",
        });
      }

      const result = await marketplaceService.toggleSavedCampaign(userId, id);
      
      return res.status(200).json({
        status: "success",
        message: result.isSaved ? "Campaign saved successfully!" : "Campaign removed from saved",
        data: { isSaved: result.isSaved },
      });
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to save campaign",
      });
    }
  };

  unsaveCampaign = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "Campaign ID is required",
        });
      }

      const result = await marketplaceService.toggleSavedCampaign(userId, id);
      
      return res.status(200).json({
        status: "success",
        message: "Campaign removed from saved",
        data: { isSaved: result.isSaved },
      });
    } catch (error: any) {
      console.error('Error unsaving campaign:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to remove campaign from saved",
      });
    }
  };

  getSavedCampaigns = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await marketplaceService.getSavedCampaigns(userId, page, limit);
      
      return res.status(200).json({
        status: "success",
        message: "Saved campaigns retrieved successfully",
        data: result.campaigns,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting saved campaigns:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to retrieve saved campaigns",
      });
    }
  };

  getUserApplications = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await marketplaceService.getUserApplications(userId, page, limit);
      
      return res.status(200).json({
        status: "success",
        message: "Applications retrieved successfully",
        data: result.applications,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error: any) {
      console.error('Error getting user applications:', error);
      Sentry.captureException(error);
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to retrieve applications",
      });
    }
  };

  getCampaignById = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          status: "error",
          message: "Authentication required",
        });
      }

      if (!id) {
        return res.status(400).json({
          status: "error",
          message: "Campaign ID is required",
        });
      }

      const campaign = await marketplaceService.getCampaignById(userId, id);

      return res.status(200).json({
        status: "success",
        message: "Campaign retrieved successfully",
        data: campaign,
      });
    } catch (error: any) {
      console.error('Error getting campaign:', error);
      Sentry.captureException(error);
      return res.status(error.message === 'Campaign not found' ? 404 : 500).json({
        status: "error",
        message: error.message || "Failed to retrieve campaign",
      });
    }
  };
}

export const marketplaceController = new MarketplaceController();
