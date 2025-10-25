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

  async getAppStats(organizationId: string): Promise<AppStats> {
    const totalApps = await App.countDocuments({ organizationId: new Types.ObjectId(organizationId) });
    const activeApps = await App.countDocuments({ 
      organizationId: new Types.ObjectId(organizationId), 
      status: 'active' 
    });

    return {
      totalApps,
      activeApps,
      totalAffiliates: 0, // This would need to be calculated from affiliate assignments
      conversionEventsTracked: 0, // This would need to be calculated from conversion events
      activeCampaigns: 0, // This would need to be calculated from active campaigns
    };
  }

  // ===== ASSET MANAGEMENT METHODS =====

  /**
   * Get all assets for an application
   */
  async getAppAssets(appId: string, userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    // Handle legacy landing pages format (string array) and convert to new format
    let landingPages = app.landingPages || [];
    
    // Check if we have legacy format (array of strings)
    if (landingPages.length > 0 && typeof landingPages[0] === 'string') {
      // Convert legacy format to new structured format
      landingPages = (landingPages as any[]).map((url: string, index: number) => ({
        id: `legacy_${index}_${Date.now()}`,
        title: `Landing Page ${index + 1}`,
        url: url,
        isPrimary: index === 0,
        createdAt: app.createdAt || new Date(),
      }));
      
      // Update the database with the new format
      app.landingPages = landingPages as any;
      await app.save();
    }

    // Handle legacy promotional materials format (string array) and convert to new format
    let promoMaterials = app.promoMaterials || [];
    
    // Check if we have legacy format (array of strings)
    if (promoMaterials.length > 0 && typeof promoMaterials[0] === 'string') {
      // Convert legacy format to new structured format
      promoMaterials = (promoMaterials as any[]).map((url: string, index: number) => ({
        id: Date.now() + index,
        name: `Legacy Material ${index + 1}`,
        type: 'image',
        url: url,
        size: 'Unknown',
        dimensions: 'N/A',
        uploadedAt: app.createdAt || new Date(),
      }));
      
      // Update the database with the new format
      app.promoMaterials = promoMaterials as any;
      await app.save();
    }

    // Return structured asset data
    return {
      promoMaterials: promoMaterials,
      landingPages: landingPages,
      appStoreLinks: {
        appStore: app.appStoreLink || '',
        googlePlay: app.googlePlayLink || '',
      },
    };
  }

  /**
   * Upload promotional material
   */
  async uploadPromoMaterial(
    appId: string,
    file: Express.Multer.File,
    name: string,
    userId: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    // Upload file using file service
    const fileUrl = await fileService.uploadFile(file, {
      bucketFolder: `apps/${appId}/promo-materials`,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'],
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    const newMaterial = {
      id: Date.now(),
      name: name || file.originalname,
      type: file.mimetype.startsWith('image/') ? 'image' : 'file',
      url: fileUrl,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      dimensions: 'N/A', // Would need image processing to get actual dimensions
      uploadedAt: new Date(),
    };

    // Initialize promoMaterials if it doesn't exist
    if (!app.promoMaterials) {
      app.promoMaterials = [];
    }

    // Handle legacy format first if needed
    if (app.promoMaterials.length > 0 && typeof app.promoMaterials[0] === 'string') {
      // Convert legacy format to new structured format
      const newPromoMaterials = (app.promoMaterials as any[]).map((url: string, index: number) => ({
        id: Date.now() + index,
        name: `Legacy Material ${index + 1}`,
        type: 'image',
        url: url,
        size: 'Unknown',
        dimensions: 'N/A',
        uploadedAt: app.createdAt || new Date(),
      }));
      
      app.promoMaterials = newPromoMaterials as any;
    }

    (app.promoMaterials as any[]).push(newMaterial);
    await app.save();
    
    return newMaterial;
  }

  /**
   * Delete promotional material
   */
  async deletePromoMaterial(appId: string, materialId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    if (!app.promoMaterials) {
      throw new NotFoundError('No promotional materials found for this application');
    }

    // Handle legacy format first if needed
    if (app.promoMaterials.length > 0 && typeof app.promoMaterials[0] === 'string') {
      // Convert legacy format to new structured format
      const newPromoMaterials = (app.promoMaterials as any[]).map((url: string, index: number) => ({
        id: Date.now() + index,
        name: `Legacy Material ${index + 1}`,
        type: 'image',
        url: url,
        size: 'Unknown',
        dimensions: 'N/A',
        uploadedAt: app.createdAt || new Date(),
      }));
      
      app.promoMaterials = newPromoMaterials as any;
      await app.save();
    }

    // Try to find by materialId (number)
    let materialIndex = app.promoMaterials.findIndex((material: any) => 
      material.id.toString() === materialId
    );

    // If not found by ID, try to find by MongoDB _id
    if (materialIndex === -1) {
      materialIndex = app.promoMaterials.findIndex((material: any) => 
        (material as any)._id?.toString() === materialId
      );
    }

    if (materialIndex === -1) {
      // Log available IDs for debugging
      const availableIds = app.promoMaterials.map((material: any) => ({
        id: material.id,
        _id: (material as any)._id?.toString(),
        name: material.name
      }));
      console.log('Available promo material IDs:', availableIds);
      console.log('Requested material ID:', materialId);
      throw new NotFoundError(`Promotional material with ID ${materialId} not found. Available materials: ${availableIds.length}`);
    }

    // Remove from array
    app.promoMaterials.splice(materialIndex, 1);
    await app.save();
  }

  /**
   * Add landing page
   */
  async addLandingPage(
    appId: string,
    landingPageData: { title: string; url: string; isPrimary: boolean },
    userId: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    // Initialize landingPages if it doesn't exist
    if (!app.landingPages) {
      app.landingPages = [];
    }

    // If this is set as primary, make all others non-primary
    if (landingPageData.isPrimary) {
      app.landingPages.forEach(page => {
        page.isPrimary = false;
      });
    }

    // Create new landing page
    const newLandingPage = {
      id: new Date().getTime().toString(),
      title: landingPageData.title,
      url: landingPageData.url,
      isPrimary: landingPageData.isPrimary,
      createdAt: new Date(),
    };

    app.landingPages.push(newLandingPage);
    await app.save();

    return newLandingPage;
  }

  /**
   * Delete landing page
   */
  async deleteLandingPage(appId: string, pageId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    if (!app.landingPages) {
      throw new NotFoundError('No landing pages found for this application');
    }

    // Handle legacy format first if needed
    if (app.landingPages.length > 0 && typeof app.landingPages[0] === 'string') {
      // Convert legacy format to new structured format
      const newLandingPages = (app.landingPages as any[]).map((url: string, index: number) => ({
        id: `legacy_${index}_${Date.now()}`,
        title: `Landing Page ${index + 1}`,
        url: url,
        isPrimary: index === 0,
        createdAt: app.createdAt || new Date(),
      }));
      
      app.landingPages = newLandingPages as any;
      await app.save();
    }

    // Try to find by pageId first
    let pageIndex = app.landingPages.findIndex(page => page.id === pageId);
    
    // If not found by ID, try to find by MongoDB _id
    if (pageIndex === -1) {
      pageIndex = app.landingPages.findIndex(page => (page as any)._id?.toString() === pageId);
    }

    // If still not found, try to find by index (fallback for legacy calls)
    if (pageIndex === -1 && /^\d+$/.test(pageId)) {
      const index = parseInt(pageId);
      if (index >= 0 && index < app.landingPages.length) {
        pageIndex = index;
      }
    }

    if (pageIndex === -1) {
      // Log available IDs for debugging
      const availableIds = app.landingPages.map(page => ({
        id: page.id,
        _id: (page as any)._id?.toString(),
        url: page.url
      }));
      console.log('Available landing page IDs:', availableIds);
      console.log('Requested page ID:', pageId);
      throw new NotFoundError(`Landing page with ID ${pageId} not found. Available pages: ${availableIds.length}`);
    }

    app.landingPages.splice(pageIndex, 1);
    await app.save();
  }

  /**
   * Set landing page as primary
   */
  async setPrimaryLandingPage(appId: string, pageId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    if (!app.landingPages) {
      throw new NotFoundError('No landing pages found for this application');
    }

    // Handle legacy format first if needed
    if (app.landingPages.length > 0 && typeof app.landingPages[0] === 'string') {
      // Convert legacy format to new structured format
      const newLandingPages = (app.landingPages as any[]).map((url: string, index: number) => ({
        id: `legacy_${index}_${Date.now()}`,
        title: `Landing Page ${index + 1}`,
        url: url,
        isPrimary: index === 0,
        createdAt: app.createdAt || new Date(),
      }));
      
      app.landingPages = newLandingPages as any;
      await app.save();
    }

    // Try to find by pageId first
    let targetPage = app.landingPages.find(page => page.id === pageId);
    
    // If not found by ID, try to find by MongoDB _id (in case it's using the auto-generated _id)
    if (!targetPage) {
      targetPage = app.landingPages.find(page => (page as any)._id?.toString() === pageId);
    }

    // If still not found, try to find by index (fallback for legacy calls)
    if (!targetPage && /^\d+$/.test(pageId)) {
      const index = parseInt(pageId);
      if (index >= 0 && index < app.landingPages.length) {
        targetPage = app.landingPages[index];
      }
    }

    if (!targetPage) {
      // Log available IDs for debugging
      const availableIds = app.landingPages.map(page => ({
        id: page.id,
        _id: (page as any)._id?.toString(),
        url: page.url
      }));
      console.log('Available landing page IDs:', availableIds);
      console.log('Requested page ID:', pageId);
      throw new NotFoundError(`Landing page with ID ${pageId} not found. Available pages: ${availableIds.length}`);
    }

    // Set all pages to non-primary first
    app.landingPages.forEach(page => {
      page.isPrimary = false;
    });

    // Set the target page as primary
    targetPage.isPrimary = true;
    
    await app.save();
  }

  /**
   * Update app store links
   */
  async updateAppStoreLinks(
    appId: string,
    links: { appStore?: string; googlePlay?: string },
    userId: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(appId)) {
      throw new BadRequestError('Invalid app ID');
    }

    const app = await App.findById(appId);
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    // Update the links
    if (links.appStore !== undefined) {
      app.appStoreLink = links.appStore;
    }
    if (links.googlePlay !== undefined) {
      app.googlePlayLink = links.googlePlay;
    }

    await app.save();

    return {
      appStore: app.appStoreLink || '',
      googlePlay: app.googlePlayLink || '',
    };
  }

  /**
   * Migrate legacy landing pages format to new structured format
   */
  async migrateLegacyLandingPages(): Promise<{ migrated: number; total: number }> {
    const apps = await App.find({});
    let migratedCount = 0;

    for (const app of apps) {
      if (app.landingPages && app.landingPages.length > 0) {
        // Check if this is legacy format (array of strings)
        if (typeof app.landingPages[0] === 'string') {
          // Convert to new format
          const newLandingPages = (app.landingPages as any[]).map((url: string, index: number) => ({
            id: `migrated_${app._id}_${index}_${Date.now()}`,
            title: `Landing Page ${index + 1}`,
            url: url,
            isPrimary: index === 0,
            createdAt: app.createdAt || new Date(),
          }));

          app.landingPages = newLandingPages as any;
          await app.save();
          migratedCount++;
        }
      }
    }

    return {
      migrated: migratedCount,
      total: apps.length,
    };
  }
}

export const appService = new AppService();