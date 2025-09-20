import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { appService } from "../services/application.service";
import { fileService } from "../services/file.service";

export class AppController {
  getOrganizationAppStats = async (req: Request, res: Response) => {
    try {
      const organizationIdArray = (req as any).user?.organizationId;
      const organizationId = Array.isArray(organizationIdArray) ? organizationIdArray[0] : organizationIdArray;

      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }

      const stats = await appService.getOrganizationAppStats(organizationId);
      return res.status(200).json({
        status: "success",
        data: stats,
        message: "App stats retrieved successfully",
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
        message: error.message || "Failed to retrieve app stats",
      });
    }
  };

  createApp = async (req: Request, res: Response) => {
    try {
      const data = req.body;
      data.organizationId = (req as any).user?.organizationId;

      if (req.file) {
        const iconUrl = await fileService.uploadFile(req.file, {
          bucketFolder: 'app-icons',
          activityDescription: 'You updated your app icon',
          updateEntity: {
            entityId: data.id,
            field: 'icon',
            updateFn: appService.updateApp.bind(appService),
          },
        });
        data.icon = iconUrl;
      }

      const app = await appService.createApp(data);
      return res.status(201).json({
        status: "success",
        message: "App created successfully",
        data: app,
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
        message: error.message || "Failed to create app",
      });
    }
  };

  getApp = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const app = await appService.getAppById(id);
      return res.status(200).json({
        status: "success",
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to fetch app",
      });
    }
  };

  getOrganizationApps = async (req: Request, res: Response) => {
    try {
      let organizationId = (req as any).user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }
      if (Array.isArray(organizationId)) {
        organizationId = organizationId[0];
      }
      if (typeof organizationId !== 'string') {
        organizationId = organizationId.toString();
      }
      const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(organizationId);
      if (!isValidObjectId) {
        return res.status(400).json({
          status: "error",
          message: "Invalid organization ID format",
        });
      }
      const apps = await appService.getAppsByOrganization(organizationId);
      return res.status(200).json({
        status: "success",
        data: apps,
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
        message: error.message || "Failed to fetch organization apps",
      });
    }
  };

  updateApp = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      if (req.file) {
        const iconUrl = await fileService.uploadFile(req.file, 'app-icons');
        data.icon = iconUrl;
      }

      const app = await appService.updateApp(id, data);
      return res.status(200).json({
        status: "success",
        message: "App updated successfully",
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to update app",
      });
    }
  };

  duplicateApp = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({
          status: "error",
          message: "Organization ID not found",
        });
      }
      const app = await appService.duplicateApp(id, organizationId);
      return res.status(201).json({
        status: "success",
        message: "App duplicated successfully",
        data: app,
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
          organizationId: (req as any).user?.organizationId,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to duplicate app",
      });
    }
  };

  deleteApp = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await appService.deleteApp(id);
      return res.status(200).json({
        status: "success",
        message: "App deleted successfully",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        extra: {
          route: req.path,
          method: req.method,
          userId: (req as any).user?.id,
          appId: req.params.id,
        },
      });
      return res.status(500).json({
        status: "error",
        message: error.message || "Failed to delete app",
      });
    }
  };
}

export const appController = new AppController();