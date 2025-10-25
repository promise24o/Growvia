import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { campaignAffiliateService } from '../services/campaignAffiliate.service';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Validation schemas
const assignUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  participationNotes: z.string().optional(),
});

const removeUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  removalReason: z.string().optional(),
});

const updateStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['active', 'inactive', 'suspended'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
  reason: z.string().optional(),
});

export class CampaignAffiliateController {
  /**
   * Assign a user to a campaign
   * POST /api/campaigns/:campaignId/affiliates
   */
  assignUserToCampaign = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = assignUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const { campaignId } = req.params;
      const { userId, participationNotes } = validationResult.data;
      const assignedBy = (req as any).user?.id;
      const organizationIdArray = (req as any).user?.organizationId;
      const organizationId = Array.isArray(organizationIdArray)
        ? organizationIdArray[0]
        : organizationIdArray;

      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      if (!assignedBy) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!organizationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Organization ID not found',
        });
      }

      const assignment = await campaignAffiliateService.assignUserToCampaign({
        campaignId,
        userId,
        assignedBy,
        organizationId,
        participationNotes,
      });

      return res.status(201).json({
        status: 'success',
        message: 'User assigned to campaign successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Assign user to campaign error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to assign user to campaign',
      });
    }
  };

  /**
   * Remove a user from a campaign
   * DELETE /api/campaigns/:campaignId/affiliates/:userId
   */
  removeUserFromCampaign = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = removeUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const { campaignId, userId } = req.params;
      const { removalReason } = validationResult.data;
      const removedBy = (req as any).user?.id;

      if (!campaignId || !userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID and User ID are required',
        });
      }

      if (!removedBy) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const assignment = await campaignAffiliateService.removeUserFromCampaign({
        campaignId,
        userId,
        removedBy,
        removalReason,
      });

      return res.status(200).json({
        status: 'success',
        message: 'User removed from campaign successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Remove user from campaign error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to remove user from campaign',
      });
    }
  };

  /**
   * Get all affiliates for a campaign
   * GET /api/campaigns/:campaignId/affiliates
   */
  getCampaignAffiliates = async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      
      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await campaignAffiliateService.getCampaignAffiliates(
        campaignId,
        filters
      );

      return res.status(200).json({
        status: 'success',
        data: result.affiliates,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      console.error('Get campaign affiliates error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch campaign affiliates',
      });
    }
  };

  /**
   * Get all campaigns for a user
   * GET /api/users/:userId/campaigns
   */
  getUserCampaigns = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
      }

      const filters = {
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await campaignAffiliateService.getUserCampaigns(userId, filters);

      return res.status(200).json({
        status: 'success',
        data: result.campaigns,
        pagination: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error: any) {
      console.error('Get user campaigns error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          targetUserId: req.params.userId,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch user campaigns',
      });
    }
  };

  /**
   * Update affiliate status
   * PATCH /api/campaigns/:campaignId/affiliates/:userId/status
   */
  updateAffiliateStatus = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = updateStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const { campaignId, userId } = req.params;
      const { status, reason } = validationResult.data;
      const updatedBy = (req as any).user?.id;

      if (!campaignId || !userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID and User ID are required',
        });
      }

      if (!updatedBy) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const assignment = await campaignAffiliateService.updateAffiliateStatus(
        campaignId,
        userId,
        status,
        updatedBy,
        reason
      );

      return res.status(200).json({
        status: 'success',
        message: 'Affiliate status updated successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Update affiliate status error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to update affiliate status',
      });
    }
  };

  /**
   * Resend campaign invitation
   * POST /api/campaigns/:campaignId/affiliates/:userId/resend-invitation
   */
  resendCampaignInvitation = async (req: Request, res: Response) => {
    try {
      const { campaignId, userId } = req.params;
      const resentBy = (req as any).user?.id;

      if (!campaignId || !userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID and User ID are required',
        });
      }

      if (!resentBy) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const assignment = await campaignAffiliateService.resendCampaignInvitation(
        campaignId,
        userId,
        resentBy
      );

      return res.status(200).json({
        status: 'success',
        message: 'Campaign invitation resent successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Resend campaign invitation error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
          targetUserId: req.params.userId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to resend campaign invitation',
      });
    }
  };

  /**
   * Accept campaign invitation
   * POST /api/campaigns/:campaignId/invitations/accept
   */
  acceptCampaignInvitation = async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const userId = (req as any).user?.id;

      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const assignment = await campaignAffiliateService.acceptCampaignInvitation(
        campaignId,
        userId
      );

      return res.status(200).json({
        status: 'success',
        message: 'Campaign invitation accepted successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Accept campaign invitation error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to accept campaign invitation',
      });
    }
  };

  /**
   * Decline campaign invitation
   * POST /api/campaigns/:campaignId/invitations/decline
   */
  declineCampaignInvitation = async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const assignment = await campaignAffiliateService.declineCampaignInvitation(
        campaignId,
        userId,
        reason
      );

      return res.status(200).json({
        status: 'success',
        message: 'Campaign invitation declined successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('Decline campaign invitation error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to decline campaign invitation',
      });
    }
  };

  /**
   * Get campaign application details
   * GET /api/campaigns/:campaignId/application
   */
  getCampaignApplication = async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const userId = (req as any).user?.id;

      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const applicationData = await campaignAffiliateService.getCampaignApplication(
        campaignId,
        userId
      );

      return res.status(200).json({
        status: 'success',
        data: applicationData,
      });
    } catch (error: any) {
      console.error('Get campaign application error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to get campaign application',
      });
    }
  };

  /**
   * Get affiliate performance distribution
   * GET /api/campaigns/affiliates/performance-distribution
   * GET /api/campaigns/:campaignId/affiliates/performance-distribution
   */
  getAffiliatePerformanceDistribution = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { campaignId } = req.params;

      if (!user || !user.organizationId) {
        return res.status(401).json({
          status: 'error',
          message: 'User or organization not found',
        });
      }

      // Handle organizationId array (take first one) or single value
      const organizationId = Array.isArray(user.organizationId) 
        ? user.organizationId[0]?.toString() 
        : user.organizationId?.toString();

      if (!organizationId) {
        return res.status(401).json({
          status: 'error',
          message: 'Valid organization ID not found',
        });
      }

      const distribution = await campaignAffiliateService.getAffiliatePerformanceDistribution(
        organizationId,
        campaignId
      );

      return res.status(200).json({
        status: 'success',
        data: distribution,
      });
    } catch (error: any) {
      console.error('Get affiliate performance distribution error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          organizationId: (req as any).user?.organizationId,
          campaignId: req.params.campaignId,
        },
      });

      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        status: 'error',
        message: error.message || 'Failed to get affiliate performance distribution',
      });
    }
  };

  /**
   * Get campaign affiliate statistics
   * GET /api/campaigns/:campaignId/affiliates/stats
   */
  getCampaignAffiliateStats = async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      
      if (!campaignId) {
        return res.status(400).json({
          status: 'error',
          message: 'Campaign ID is required',
        });
      }

      const stats = await campaignAffiliateService.getCampaignAffiliateStats(campaignId);

      return res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      console.error('Get campaign affiliate stats error:', error);
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          campaignId: req.params.campaignId,
        },
      });

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch campaign affiliate statistics',
      });
    }
  };
}

export const campaignAffiliateController = new CampaignAffiliateController();
