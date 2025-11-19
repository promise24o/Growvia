import { Request, Response } from 'express';
import { kycService } from '../services/kyc.service';
import * as Sentry from '@sentry/node';
import { DocumentType } from '../models/KYC';

class KYCController {
  /**
   * Get KYC status
   * GET /api/kyc/status
   */
  getStatus = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const status = await kycService.getKYCStatus(userId);

      return res.status(200).json({
        status: 'success',
        data: status,
      });
    } catch (error: any) {
      console.error('Get KYC status error:', error);
      Sentry.captureException(error);

      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to get KYC status',
      });
    }
  };


  /**
   * Verify BVN
   * POST /api/kyc/bvn/verify
   */
  verifyBVN = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { bvn, dateOfBirth } = req.body;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!bvn || !dateOfBirth) {
        return res.status(400).json({
          status: 'error',
          message: 'BVN and date of birth are required',
        });
      }

      await kycService.verifyBVN(userId, bvn, dateOfBirth);

      return res.status(200).json({
        status: 'success',
        message: 'BVN verified successfully. You are now at Bloom Level!',
      });
    } catch (error: any) {
      console.error('Verify BVN error:', error);
      Sentry.captureException(error);

      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Failed to verify BVN',
      });
    }
  };

  /**
   * Upload document
   * POST /api/kyc/documents/upload
   */
  uploadDocument = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { documentType } = req.body;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!documentType || !file) {
        return res.status(400).json({
          status: 'error',
          message: 'Document type and file are required',
        });
      }

      if (!Object.values(DocumentType).includes(documentType)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid document type',
        });
      }

      const documentUrl = await kycService.uploadDocument(userId, documentType, file);

      return res.status(200).json({
        status: 'success',
        message: 'Document uploaded successfully. Your submission is under review.',
        documentUrl,
      });
    } catch (error: any) {
      console.error('Upload document error:', error);
      Sentry.captureException(error);

      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Failed to upload document',
      });
    }
  };

  /**
   * Upload selfie
   * POST /api/kyc/selfie/upload
   */
  uploadSelfie = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const file = req.file;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!file) {
        return res.status(400).json({
          status: 'error',
          message: 'Selfie file is required',
        });
      }

      const selfieUrl = await kycService.uploadSelfie(userId, file);

      return res.status(200).json({
        status: 'success',
        message: 'Selfie uploaded successfully',
        selfieUrl,
      });
    } catch (error: any) {
      console.error('Upload selfie error:', error);
      Sentry.captureException(error);

      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Failed to upload selfie',
      });
    }
  };

  /**
   * Approve Tier 2 (Admin only)
   * POST /api/kyc/tier2/approve
   */
  approveTier2 = async (req: Request, res: Response) => {
    try {
      const reviewerId = (req as any).user?.id;
      const { userId } = req.body;

      if (!reviewerId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!userId) {
        return res.status(400).json({
          status: 'error',
          message: 'User ID is required',
        });
      }

      await kycService.approveTier2(userId, reviewerId);

      return res.status(200).json({
        status: 'success',
        message: 'Tier 2 verification approved successfully',
      });
    } catch (error: any) {
      console.error('Approve Tier 2 error:', error);
      Sentry.captureException(error);

      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Failed to approve Tier 2',
      });
    }
  };

  /**
   * Reject Tier 2 (Admin only)
   * POST /api/kyc/tier2/reject
   */
  rejectTier2 = async (req: Request, res: Response) => {
    try {
      const reviewerId = (req as any).user?.id;
      const { userId, reason } = req.body;

      if (!reviewerId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      if (!userId || !reason) {
        return res.status(400).json({
          status: 'error',
          message: 'User ID and rejection reason are required',
        });
      }

      await kycService.rejectTier2(userId, reviewerId, reason);

      return res.status(200).json({
        status: 'success',
        message: 'Tier 2 verification rejected',
      });
    } catch (error: any) {
      console.error('Reject Tier 2 error:', error);
      Sentry.captureException(error);

      return res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message || 'Failed to reject Tier 2',
      });
    }
  };
}

export const kycController = new KYCController();
