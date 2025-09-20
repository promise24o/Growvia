import mongoose, { Types } from 'mongoose';
import { App, IApp } from '../models/Application';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { insertAppSchema } from '../../shared/schema';

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
}

export class AppService {
  async createApp(data: CreateAppInput): Promise<IApp> {
    const validation = insertAppSchema.safeParse(data);
    if (!validation.success) {
      throw new BadRequestError(validation.error.message);
    }

    const app = new App(data);
    await app.save();
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

  async updateApp(id: string, data: UpdateAppInput): Promise<IApp> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
    }

    const validation = insertAppSchema.partial().safeParse(data);
    if (!validation.success) {
      throw new BadRequestError(validation.error.message);
    }

    Object.assign(app, data);
    await app.save();
    return app;
  }

  async duplicateApp(id: string, organizationId: Types.ObjectId): Promise<IApp> {
    const app = await App.findById(id);
    if (!app) {
      throw new NotFoundError('App not found');
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
        },
      },
    ]);

    return stats.length > 0 ? stats[0] : { totalApps: 0, activeApps: 0 };
  }
}

export const appService = new AppService();