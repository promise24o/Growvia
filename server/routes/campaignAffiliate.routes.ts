import { Router } from 'express';
import { campaignAffiliateController } from '../controllers/campaignAffiliate.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../../shared/schema';

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
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.assignUserToCampaign
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates
 * @desc    Get all affiliates for a campaign
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.getCampaignAffiliates
);

/**
 * @route   GET /api/campaign-affiliates
 * @desc    Get all affiliates for the organization
 * @access  Admin, Management
 */
router.get(
  '/',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.getOrganizationAffiliates
);

/**
 * @route   GET /api/campaigns/:campaignId/application
 * @desc    Get campaign application details for affiliate
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/application',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.getCampaignApplication
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates/performance-distribution
 * @desc    Get affiliate performance distribution for a specific campaign
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates/performance-distribution',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.getAffiliatePerformanceDistribution
);

/**
 * @route   GET /api/campaigns/:campaignId/affiliates/stats
 * @desc    Get campaign affiliate statistics
 * @access  Admin, Management
 */
router.get(
  '/:campaignId/affiliates/stats',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.getCampaignAffiliateStats
);

/**
 * @route   POST /api/campaigns/:campaignId/affiliates/:userId/resend-invitation
 * @desc    Resend campaign invitation
 * @access  Admin, Management
 */
router.post(
  '/:campaignId/affiliates/:userId/resend-invitation',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.resendCampaignInvitation
);

/**
 * @route   POST /api/campaign-affiliates/:campaignId/affiliates/:userId/approve
 * @desc    Approve marketplace campaign application
 * @access  Admin, Management
 */
router.post(
  '/:campaignId/affiliates/:userId/approve',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.approveMarketplaceApplication
);

/**
 * @route   POST /api/campaign-affiliates/:campaignId/affiliates/:userId/reject
 * @desc    Reject marketplace campaign application
 * @access  Admin, Management
 */
router.post(
  '/:campaignId/affiliates/:userId/reject',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.rejectMarketplaceApplication
);

/**
 * @route   POST /api/campaigns-affiliates/accept-invitation/:campaignId
 * @desc    Accept campaign invitation
 * @access  Authenticated users
 */
router.post(
  '/accept-invitation/:campaignId',
  authenticate,
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.acceptCampaignInvitation
);

/**
 * @route   POST /api/campaigns-affiliates/decline-invitation/:campaignId
 * @desc    Decline campaign invitation
 * @access  Authenticated users
 */
router.post(
  '/decline-invitation/:campaignId',
  authenticate,
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.declineCampaignInvitation
);

/**
 * @route   DELETE /api/campaigns/:campaignId/affiliates/:userId
 * @desc    Remove a user from a campaign
 * @access  Admin, Management
 */
router.delete(
  '/:campaignId/affiliates/:userId',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
  campaignAffiliateController.removeUserFromCampaign
);

/**
 * @route   PATCH /api/campaigns/:campaignId/affiliates/:userId/status
 * @desc    Update affiliate status (suspend/reactivate)
 * @access  Admin, Management
 */
router.patch(
  '/:campaignId/affiliates/:userId/status',
  authorize([UserRole.ADMIN, UserRole.MANAGEMENT]),
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

/**
 * @route   GET /api/campaign-affiliates/my-invitations
 * @desc    Get my campaign invitations (marketer)
 * @access  Authenticated marketers
 */
router.get(
  '/my-invitations',
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.getMyInvitations
);

/**
 * @route   GET /api/campaign-affiliates/my-campaigns
 * @desc    Get my active campaigns (marketer)
 * @access  Authenticated marketers
 */
router.get(
  '/my-campaigns',
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.getMyCampaigns
);

/**
 * @route   GET /api/campaign-affiliates/my-campaigns/:campaignId
 * @desc    Get my campaign details (marketer)
 * @access  Authenticated marketers
 */
router.get(
  '/my-campaigns/:campaignId',
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.getMyCampaignDetails
);

/**
 * @route   GET /api/campaign-affiliates/my-campaigns/:campaignId/performance
 * @desc    Get my campaign performance metrics (marketer)
 * @access  Authenticated marketers
 */
router.get(
  '/my-campaigns/:campaignId/performance',
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.getMyCampaignPerformance
);

/**
 * @route   GET /api/campaign-affiliates/my-campaigns/:campaignId/earnings
 * @desc    Get my campaign earnings breakdown (marketer)
 * @access  Authenticated marketers
 */
router.get(
  '/my-campaigns/:campaignId/earnings',
  authorize([UserRole.MARKETER]),
  campaignAffiliateController.getMyCampaignEarnings
);

export default router;
