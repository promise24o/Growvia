import mongoose, { Types } from 'mongoose';
import { App, IApp } from '../models/Application';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { insertAppSchema } from '../../shared/schema';
import { fileService } from './file.service';
import { z } from 'zod';

interface CreateAppInput {
  organizationId: Types.ObjectId;
  name: string;
  type: string;
  url: string;
  shortDescription: string;
  detailedDescription?: string;
  category: string;
  appStoreLink?: string;
  googlePlayLink?: string;
  landingPages?: string[];
  icon?: string;
  promoMaterials?: string[];
  status?: string;
}

interface UpdateAppInput extends Partial<CreateAppInput> {}

interface AppStats {
  totalApps: number;
  activeApps: number;
  totalAffiliates: number;
  conversionEventsTracked: number;
  activeCampaigns: number;
}

export class AppService {
  async createApp(data: CreateAppInput, file?: Express.Multer.File, userId?: string): Promise<IApp> {
    const organizationId = Array.isArray(data.organizationId) 
      ? data.organizationId[0] 
      : data.organizationId;

    let landingPages: string[] = [];
    if (typeof data.landingPages === 'string') {
      try {
        landingPages = JSON.parse(data.landingPages);
      } catch {
        landingPages = data.landingPages
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url);
      }
    } else if (Array.isArray(data.landingPages)) {
      landingPages = data.landingPages
        .map((url: any) => typeof url === 'string' ? url.trim() : '')
        .filter((url: string) => url);
    }

    const processedData = {
      ...data,
      organizationId,
      appStoreLink: data.appStoreLink || null,
      googlePlayLink: data.googlePlayLink || null,
      landingPages,
      promoMaterials: Array.isArray(data.promoMaterials)
        ? data.promoMaterials.filter((url: string) => url && url.trim() !== '')
        : [],
      icon: data.icon || null,
    };

    const validation = insertAppSchema.safeParse(processedData);
    if (!validation.success) {
      throw new BadRequestError(JSON.stringify(validation.error.errors));
    }

    const existing = await App.findOne({
      organizationId: new Types.ObjectId(organizationId),
      name: processedData.name,
    });
    if (existing) {
      throw new BadRequestError('An app with this name already exists in your organization');
    }

    const app = new App(processedData);
    await app.save();

    if (file && userId) {
      const iconUrl = await fileService.uploadFile(file, {
        userId,
        bucketFolder: 'app-icons',
        fileNamePrefix: 'icon',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        activityDescription: 'You uploaded an app icon',
        updateEntity: {
          entityId: app._id.toString(),
          field: 'icon',
          updateFn: async (id: string, updateData: UpdateAppInput) => {
            const appToUpdate = await App.findById(id);
            if (!appToUpdate) {
              throw new NotFoundError('App not found');
            }
            Object.assign(appToUpdate, updateData);
            await appToUpdate.save();
            return appToUpdate;
          },
        },
      });
      app.icon = iconUrl;
      await app.save();
    }

    return app;
  }

  async getAppById(id: string): Promise<IApp> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
    }
    return app;
  }

  async getAppsByOrganization(organizationId: string): Promise<IApp[]> {
    return App.find({ organizationId: new Types.ObjectId(organizationId) });
  }

  async updateApp(id: string, data: UpdateAppInput, file?: Express.Multer.File, userId?: string): Promise<IApp> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
    }

    let landingPages: string[] | undefined;
    if (typeof data.landingPages === 'string') {
      try {
        landingPages = JSON.parse(data.landingPages);
      } catch {
        landingPages = data.landingPages
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url);
      }
    } else if (Array.isArray(data.landingPages)) {
      landingPages = data.landingPages
        .map((url: any) => typeof url === 'string' ? url.trim() : '')
        .filter((url: string) => url);
    }

    const processedData = {
      ...data,
      landingPages: landingPages ?? app.landingPages,
      appStoreLink: data.appStoreLink !== undefined ? data.appStoreLink : app.appStoreLink,
      googlePlayLink: data.googlePlayLink !== undefined ? data.googlePlayLink : app.googlePlayLink,
      promoMaterials: Array.isArray(data.promoMaterials)
        ? data.promoMaterials.filter((url: string) => url && url.trim() !== '')
        : app.promoMaterials,
    };

    const validation = insertAppSchema.safeParse(processedData);
    if (!validation.success) {
      throw new BadRequestError(JSON.stringify(validation.error.errors));
    }

    if (file && userId) {
      const iconUrl = await fileService.uploadFile(file, {
        userId,
        bucketFolder: 'app-icons',
        fileNamePrefix: 'icon',
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/png', 'image/jpeg', 'image/jpg'],
        activityDescription: 'You updated an app icon',
        updateEntity: {
          entityId: id,
          field: 'icon',
          updateFn: async (id: string, updateData: UpdateAppInput) => {
            const appToUpdate = await App.findById(id);
            if (!appToUpdate) {
              throw new NotFoundError('App not found');
            }
            Object.assign(appToUpdate, updateData);
            await appToUpdate.save();
            return appToUpdate;
          },
        },
      });
      processedData.icon = iconUrl;
    }

    Object.assign(app, processedData);
    await app.save();
    return app;
  }

  async duplicateApp(id: string, organizationId: Types.ObjectId): Promise<IApp> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
    }

    const existing = await App.findOne({
      organizationId,
      name: `${app.name} (Copy)`,
    });
    if (existing) {
      throw new BadRequestError('A duplicate app already exists in your organization');
    }

    const newApp = new App({
      ...app.toObject(),
      _id: new mongoose.Types.ObjectId(),
      name: `${app.name} (Copy)`,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newApp.save();
    return newApp;
  }

  async deleteApp(id: string): Promise<void> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
    }
    await app.deleteOne();
  }

  async getOrganizationAppStats(organizationId: string): Promise<AppStats> {
    const stats = await App.aggregate([
      { $match: { organizationId: new Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          totalApps: { $sum: 1 },
          activeApps: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalApps: 1,
          activeApps: 1,
          // Placeholder values for future implementation
          totalAffiliates: { $literal: 0 },
          conversionEventsTracked: { $literal: 0 },
          activeCampaigns: { $literal: 0 }
        },
      },
    ]);
    
    // Return default values if no apps found
    return stats.length > 0 ? stats[0] : { 
      totalApps: 0, 
      activeApps: 0, 
      totalAffiliates: 0, 
      conversionEventsTracked: 0,
      activeCampaigns: 0 
    };
  }
}

export const appService = new AppService();