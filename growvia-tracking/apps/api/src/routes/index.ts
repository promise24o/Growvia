/**
 * API Routes
 */

import { Router } from 'express';
import * as trackingController from '../controllers/tracking.controller';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

// Tracking endpoints
router.post('/track', trackingController.trackEvent);
router.post('/track/batch', trackingController.trackBatchEvents);

// Analytics endpoints
router.get('/affiliate/:affiliateId/performance', analyticsController.getAffiliatePerformance);
router.get('/campaign/:campaignId/insights', analyticsController.getCampaignInsights);
router.get('/event/:eventId', analyticsController.getEventDetails);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
