import { Router } from 'express';
import { campaignAffiliateController } from '../controllers/campaignAffiliate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/campaigns/:campaignId/affiliates
 * @desc    Assign a user to a campaign
 * @access  Admin, Management
 */
router.post(
  '/:campaignId/affiliates',
  campaignAffiliateController.assignUserToCampaign
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates
 * @desc    Get all affiliates for a campaign
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates',
  campaignAffiliateController.getCampaignAffiliates
);

/**
 * @route   GET /api/campaigns/:campaignId/application
 * @desc    Get campaign application details for affiliate
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/application',
  campaignAffiliateController.getCampaignApplication
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates/performance-distribution
 * @desc    Get affiliate performance distribution for a specific campaign
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates/performance-distribution',
  campaignAffiliateController.getAffiliatePerformanceDistribution
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates/stats
 * @desc    Get campaign affiliate statistics
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates/stats',
  campaignAffiliateController.getCampaignAffiliateStats
);

/**
 * @route   POST /api/campaigns/:campaignId/affiliates/:userId/resend-invitation
 * @desc    Resend campaign invitation
 * @access  Admin, Management
 */
router.post(
  '/:campaignId/affiliates/:userId/resend-invitation',
  campaignAffiliateController.resendCampaignInvitation
);

/**
 * @route   POST /api/campaigns/:campaignId/invitations/accept
 * @desc    Accept campaign invitation
 * @access  Authenticated users
 */
router.post(
  '/:campaignId/invitations/accept',
  campaignAffiliateController.acceptCampaignInvitation
);

/**
 * @route   POST /api/campaigns/:campaignId/invitations/decline
 * @desc    Decline campaign invitation
 * @access  Authenticated users
 */
router.post(
  '/:campaignId/invitations/decline',
  campaignAffiliateController.declineCampaignInvitation
);

/**
 * @route   DELETE /api/campaigns/:campaignId/affiliates/:userId
 * @desc    Remove a user from a campaign
 * @access  Admin, Management
 */
router.delete(
  '/:campaignId/affiliates/:userId',
  campaignAffiliateController.removeUserFromCampaign
);

/**
 * @route   PATCH /api/campaigns/:campaignId/affiliates/:userId/status
 * @desc    Update affiliate status (suspend/reactivate)
 * @access  Admin, Management
 */
router.patch(
  '/:campaignId/affiliates/:userId/status',
  campaignAffiliateController.updateAffiliateStatus
);

/**
 * @route   GET /api/users/:userId/campaigns
 * @desc    Get all campaigns for a user
 * @access  Authenticated users
 */
router.get(
  '/users/:userId/campaigns',
  campaignAffiliateController.getUserCampaigns
);

export default router;
