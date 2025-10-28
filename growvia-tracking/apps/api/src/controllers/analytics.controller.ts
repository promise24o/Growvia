/**
 * Analytics Controller - Handles analytics and reporting endpoints
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TrackingEvent, ClickTracking } from '@growvia/server';

/**
 * Get affiliate performance
 */
export async function getAffiliatePerformance(req: Request, res: Response) {
  try {
    const { affiliateId } = req.params;
    const { startDate, endDate, campaignId } = req.query;

    const query: any = {
      affiliateId: new mongoose.Types.ObjectId(affiliateId as string),
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    };

    if (campaignId) {
      query.campaignId = new mongoose.Types.ObjectId(campaignId as string);
    }

    // Get event counts by type
    const eventsByType = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalPayout: { $sum: '$payout' },
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    // Get total clicks
    const totalClicks = await ClickTracking.countDocuments({
      affiliateId: new mongoose.Types.ObjectId(affiliateId as string),
      timestamp: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    });

    // Calculate metrics
    const metrics: any = {
      clicks: totalClicks,
      visits: 0,
      signups: 0,
      purchases: 0,
      customEvents: 0,
      totalPayout: 0,
      totalRevenue: 0,
    };

    eventsByType.forEach(item => {
      metrics[`${item._id}s`] = item.count;
      metrics.totalPayout += item.totalPayout || 0;
      metrics.totalRevenue += item.totalRevenue || 0;
    });

    metrics.conversionRate = totalClicks > 0 
      ? ((metrics.signups + metrics.purchases) / totalClicks) * 100 
      : 0;

    metrics.averageOrderValue = metrics.purchases > 0 
      ? metrics.totalRevenue / metrics.purchases 
      : 0;

    return res.status(200).json({
      success: true,
      affiliateId,
      period: { start: startDate, end: endDate },
      metrics,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get affiliate performance',
    });
  }
}

/**
 * Get campaign insights
 */
export async function getCampaignInsights(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      campaignId: new mongoose.Types.ObjectId(campaignId as string),
      createdAt: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    };

    // Get overview metrics
    const overview = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          totalPayout: { $sum: '$payout' },
        },
      },
    ]);

    const totalClicks = await ClickTracking.countDocuments({
      campaignId: new mongoose.Types.ObjectId(campaignId as string),
      timestamp: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      },
    });

    // Get breakdown by event type
    const byEventType = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get breakdown by affiliate
    const byAffiliate = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$affiliateId',
          conversions: { $sum: 1 },
          revenue: { $sum: '$amount' },
          payout: { $sum: '$payout' },
        },
      },
      { $sort: { conversions: -1 } },
      { $limit: 10 },
    ]);

    // Get daily breakdown
    const byDay = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          conversions: { $sum: 1 },
          revenue: { $sum: '$amount' },
          payout: { $sum: '$payout' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get fraud detection stats
    const fraudStats = await TrackingEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const overviewData = overview[0] || {
      totalConversions: 0,
      totalRevenue: 0,
      totalPayout: 0,
    };

    const roi = overviewData.totalPayout > 0
      ? ((overviewData.totalRevenue - overviewData.totalPayout) / overviewData.totalPayout) * 100
      : 0;

    return res.status(200).json({
      success: true,
      campaignId,
      period: { start: startDate, end: endDate },
      overview: {
        totalClicks,
        ...overviewData,
        roi,
        activeAffiliates: byAffiliate.length,
      },
      breakdown: {
        byEventType: byEventType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byAffiliate,
        byDay: byDay.map(item => ({
          date: item._id,
          conversions: item.conversions,
          revenue: item.revenue || 0,
          payout: item.payout || 0,
        })),
      },
      fraudDetection: {
        totalFlagged: fraudStats.find(s => s._id === 'fraud')?.count || 0,
        totalValidated: fraudStats.find(s => s._id === 'validated')?.count || 0,
        totalPending: fraudStats.find(s => s._id === 'pending')?.count || 0,
      },
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get campaign insights',
    });
  }
}

/**
 * Get event details
 */
export async function getEventDetails(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await TrackingEvent.findOne({ eventId })
      .populate('organizationId', 'name')
      .populate('campaignId', 'name')
      .populate('affiliateId', 'userId');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to get event details',
    });
  }
}
