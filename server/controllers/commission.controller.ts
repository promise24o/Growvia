import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { commissionService } from "../services/commission.service";

export class CommissionController {
  createCommission = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      data.organizationId = (req as any).user?.organizationId;
      const commission = await commissionService.createCommission(data);
      return res.status(201).json({
        status: "success",
        message: "Commission model created successfully",
        data: commission,
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
        message: error.message || "Failed to create commission model",
      });
    }
  };

  getCommission = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const commission = await commissionService.getCommissionById(id);
      return res.status(200).json({
        status: "success",
        data: commission,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          commissionId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch commission model",
      });
    }
  };

  getOrganizationCommissions = async (req: Request, res: Response) => {
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
      const commissions = await commissionService.getCommissionsByOrganization(organizationId);
      return res.status(200).json({
        status: "success",
        data: commissions,
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
        message: error.message || "Failed to fetch organization commissions",
      });
    }
  };

  updateCommission = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const commission = await commissionService.updateCommission(id, data);
      return res.status(200).json({
        status: "success",
        message: "Commission model updated successfully",
        data: commission,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          commissionId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to update commission model",
      });
    }
  };

  duplicateCommission = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }
      const commission = await commissionService.duplicateCommission(id, organizationId);
      return res.status(201).json({
        status: "success",
        message: "Commission model duplicated successfully",
        data: commission,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          commissionId: req.params.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to duplicate commission model",
      });
    }
  };

  deleteCommission = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await commissionService.deleteCommission(id);
      return res.status(200).json({
        status: "success",
        message: "Commission model deleted successfully",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          commissionId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to delete commission model",
      });
    }
  };
}

export const commissionController = new CommissionController();