import { SubscriptionPlan } from '@shared/schema';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  Activity,
  AffiliateLink,
  App,
  Conversion,
  IActivity,
  IAffiliateLink,
  IApp,
  IConversion,
  INotificationSetting,
  IOrganization,
  IPayout,
  IUser,
  NotificationSetting,
  Organization,
  Payout,
  User
} from './models';
import { IStorage } from './storage';

// Helper function to convert MongoDB document to plain object
const toPlainObject = <T>(doc: mongoose.Document | null): T | undefined => {
  if (!doc) return undefined;
  return doc.toObject() as T;
};

export class MongoStorage implements IStorage {
  // Constructor to initialize the storage with admin user
  constructor() {
    // Seed the admin user when storage is initialized
    this.seedAdminUser().catch(err => console.error('Error seeding admin user:', err));
  }

  // Seed admin user with management role
  private async seedAdminUser() {
    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email: 'admin@admin.com' });
      
      if (!existingAdmin) {
        console.log('Creating admin user...');
        // Create a hashed password for the admin user
        const hashedPassword = crypto.createHash('sha256').update('password123').digest('hex');
        
        // Create the admin user with management role
        const adminUser = new User({
          name: 'System Administrator',
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'management',
          status: 'active',
          avatar: null,
          organizationId: null, // Not associated with any organization
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await adminUser.save();
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Failed to seed admin user:', error);
    }
  }

  // Helper to convert MongoDB ObjectId to string or null
  private convertId(id: mongoose.Types.ObjectId | null): string | null {
    if (!id) return null;
    return id.toString();
  }

  // Helper to convert string ID to MongoDB ObjectId
  private toObjectId(
    id: string | number | null
  ): mongoose.Types.ObjectId | null {
    if (!id) return null;
    try {
      return new mongoose.Types.ObjectId(id.toString());
    } catch (error) {
      console.error("Error converting to ObjectId:", error);
      return null;
    }
  }

  // Organizations
  async getOrganization(id: string | number): Promise<any | undefined> {
    try {
      // Try to find by _id first if we can convert to ObjectId
      const objectId = this.toObjectId(id);
      if (objectId) {
        const org = await Organization.findById(objectId);
        if (org) {
          const result = toPlainObject<IOrganization>(org);
          if (result) {
            return {
              ...result,
              id: this.convertId(result._id),
            };
          }
        }
      }

      // Fallback to legacy id field
      const org = await Organization.findOne({ id });
      if (org) {
        const result = toPlainObject<IOrganization>(org);
        if (result) {
          return {
            ...result,
            id: this.convertId(result._id),
          };
        }
      }

      return undefined;
    } catch (error) {
      console.error("Error getting organization:", error);
      return undefined;
    }
  }

  async getOrganizationByEmail(email: string): Promise<any | undefined> {
    try {
      const org = await Organization.findOne({ email });
      return toPlainObject(org);
    } catch (error) {
      console.error("Error getting organization by email:", error);
      return undefined;
    }
  }

  async createOrganization(org: any): Promise<any> {
    try {
      const newOrg = new Organization({
        name: org.name,
        email: org.email,
        plan: org.plan || SubscriptionPlan.FREE_TRIAL,
        logo: org.logo || null,
        webhookUrl: org.webhookUrl || null,
        trialEndsAt: org.trialEndsAt || null,
      });

      const saved = await newOrg.save();
      const result = toPlainObject<IOrganization>(saved);

      if (!result) {
        throw new Error("Failed to create organization");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  }

  async updateOrganization(
    id: number,
    orgData: Partial<any>
  ): Promise<any | undefined> {
    try {
      const org = await Organization.findOneAndUpdate(
        { id },
        { $set: orgData },
        { new: true }
      );

      if (!org) return undefined;

      const result = toPlainObject<IOrganization>(org);
      if (!result) return undefined;

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error updating organization:", error);
      return undefined;
    }
  }

  // Users
  async getUser(id: number): Promise<any | undefined> {
    try {
      const objectId = this.toObjectId(id);
      const user = await User.findOne({ _id: objectId });
      return toPlainObject(user);
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const user = await User.findOne({ email });
      return toPlainObject(user);
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async getUsersByOrganization(orgId: number): Promise<any[]> {
    try {
      const users = await User.find({ organizationId: orgId });
      return users
        .map((user) => {
          const plainUser = toPlainObject<IUser>(user);
          if (!plainUser) return null;

          return {
            ...plainUser,
            id: this.convertId(plainUser._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting users by organization:", error);
      return [];
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      // If organizationId is provided, convert it to ObjectId
      let organizationId = null;
      if (userData.organizationId) {
        organizationId = this.toObjectId(userData.organizationId);
      }

      const newUser = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        organizationId: organizationId,
        avatar: userData.avatar || null,
        status: userData.status || "active",
      });

      const saved = await newUser.save();
      const result = toPlainObject<IUser>(saved);

      if (!result) {
        throw new Error("Failed to create user");
      }

      return {
        ...result,
        id: this.convertId(result._id),
        organizationId: result.organizationId
          ? this.convertId(result.organizationId)
          : null,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(
    id: number,
    userData: Partial<any>
  ): Promise<any | undefined> {
    try {
      const user = await User.findOneAndUpdate(
        { id },
        { $set: userData },
        { new: true }
      );

      if (!user) return undefined;

      const result = toPlainObject<IUser>(user);
      if (!result) return undefined;

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  verifyPassword(password: string, hash: string): boolean {
    const calculatedHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    return calculatedHash === hash;
  }

  // Apps
  async getApp(id: number): Promise<any | undefined> {
    try {
      const app = await App.findOne({ id });
      return toPlainObject(app);
    } catch (error) {
      console.error("Error getting app:", error);
      return undefined;
    }
  }

  async getAppsByOrganization(orgId: number): Promise<any[]> {
    try {
      const apps = await App.find({ organizationId: orgId });
      return apps
        .map((app) => {
          const plainApp = toPlainObject<IApp>(app);
          if (!plainApp) return null;

          return {
            ...plainApp,
            id: this.convertId(plainApp._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting apps by organization:", error);
      return [];
    }
  }

  async createApp(appData: any): Promise<any> {
    try {
      const newApp = new App({
        name: appData.name,
        organizationId: appData.organizationId,
        description: appData.description || null,
        icon: appData.icon || null,
        baseUrl: appData.baseUrl,
        commissionType: appData.commissionType || "percentage",
        commissionValue: appData.commissionValue || 10,
      });

      const saved = await newApp.save();
      const result = toPlainObject<IApp>(saved);

      if (!result) {
        throw new Error("Failed to create app");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating app:", error);
      throw error;
    }
  }

  async updateApp(id: number, appData: Partial<any>): Promise<any | undefined> {
    try {
      const app = await App.findOneAndUpdate(
        { id },
        { $set: appData },
        { new: true }
      );

      if (!app) return undefined;

      const result = toPlainObject<IApp>(app);
      if (!result) return undefined;

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error updating app:", error);
      return undefined;
    }
  }

  async deleteApp(id: number): Promise<boolean> {
    try {
      const result = await App.deleteOne({ id });
      return result.deletedCount === 1;
    } catch (error) {
      console.error("Error deleting app:", error);
      return false;
    }
  }

  // Affiliate Links
  async getAffiliateLink(id: number): Promise<any | undefined> {
    try {
      const link = await AffiliateLink.findOne({ id });
      return toPlainObject(link);
    } catch (error) {
      console.error("Error getting affiliate link:", error);
      return undefined;
    }
  }

  async getAffiliateLinkByCode(code: string): Promise<any | undefined> {
    try {
      const link = await AffiliateLink.findOne({ code });
      return toPlainObject(link);
    } catch (error) {
      console.error("Error getting affiliate link by code:", error);
      return undefined;
    }
  }

  async getAffiliateLinksByUser(userId: number): Promise<any[]> {
    try {
      const links = await AffiliateLink.find({ userId });
      return links
        .map((link) => {
          const plainLink = toPlainObject<IAffiliateLink>(link);
          if (!plainLink) return null;

          return {
            ...plainLink,
            id: this.convertId(plainLink._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting affiliate links by user:", error);
      return [];
    }
  }

  async createAffiliateLink(linkData: any): Promise<any> {
    try {
      const newLink = new AffiliateLink({
        userId: linkData.userId,
        appId: linkData.appId,
        code: linkData.code || undefined, // Will be auto-generated if not provided
        clicks: linkData.clicks || 0,
        customParameters: linkData.customParameters || {},
      });

      const saved = await newLink.save();
      const result = toPlainObject<IAffiliateLink>(saved);

      if (!result) {
        throw new Error("Failed to create affiliate link");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating affiliate link:", error);
      throw error;
    }
  }

  async incrementLinkClicks(id: number): Promise<boolean> {
    try {
      const result = await AffiliateLink.updateOne(
        { id },
        { $inc: { clicks: 1 } }
      );
      return result.modifiedCount === 1;
    } catch (error) {
      console.error("Error incrementing link clicks:", error);
      return false;
    }
  }

  // Conversions
  async getConversion(id: number): Promise<any | undefined> {
    try {
      const conversion = await Conversion.findOne({ id });
      return toPlainObject(conversion);
    } catch (error) {
      console.error("Error getting conversion:", error);
      return undefined;
    }
  }

  async getConversionsByLink(linkId: number): Promise<any[]> {
    try {
      const conversions = await Conversion.find({ linkId });
      return conversions
        .map((conversion) => {
          const plainConversion = toPlainObject<IConversion>(conversion);
          if (!plainConversion) return null;

          return {
            ...plainConversion,
            id: this.convertId(plainConversion._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting conversions by link:", error);
      return [];
    }
  }

  async getConversionsByUser(userId: number): Promise<any[]> {
    try {
      // We need to join with the AffiliateLink collection
      const userLinks = await AffiliateLink.find({ userId }).select("_id");
      const linkIds = userLinks.map((link) => link._id);

      const conversions = await Conversion.find({ linkId: { $in: linkIds } });
      return conversions
        .map((conversion) => {
          const plainConversion = toPlainObject<IConversion>(conversion);
          if (!plainConversion) return null;

          return {
            ...plainConversion,
            id: this.convertId(plainConversion._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting conversions by user:", error);
      return [];
    }
  }

  async getConversionsByOrganization(orgId: number): Promise<any[]> {
    try {
      // This requires multiple joins: Organization > Users > AffiliateLinks > Conversions
      const users = await User.find({ organizationId: orgId }).select("_id");
      const userIds = users.map((user) => user._id);

      const links = await AffiliateLink.find({
        userId: { $in: userIds },
      }).select("_id");
      const linkIds = links.map((link) => link._id);

      const conversions = await Conversion.find({ linkId: { $in: linkIds } });
      return conversions
        .map((conversion) => {
          const plainConversion = toPlainObject<IConversion>(conversion);
          if (!plainConversion) return null;

          return {
            ...plainConversion,
            id: this.convertId(plainConversion._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting conversions by organization:", error);
      return [];
    }
  }

  async createConversion(conversionData: any): Promise<any> {
    try {
      const newConversion = new Conversion({
        linkId: conversionData.linkId,
        transactionId: conversionData.transactionId,
        amount: conversionData.amount,
        commission: conversionData.commission,
        status: conversionData.status || "pending",
        metadata: conversionData.metadata || {},
      });

      const saved = await newConversion.save();
      const result = toPlainObject<IConversion>(saved);

      if (!result) {
        throw new Error("Failed to create conversion");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating conversion:", error);
      throw error;
    }
  }

  async updateConversionStatus(
    id: number,
    status: string
  ): Promise<any | undefined> {
    try {
      const conversion = await Conversion.findOneAndUpdate(
        { id },
        { $set: { status } },
        { new: true }
      );

      if (!conversion) return undefined;

      const result = toPlainObject<IConversion>(conversion);
      if (!result) return undefined;

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error updating conversion status:", error);
      return undefined;
    }
  }

  // Activities
  async getActivitiesByOrganization(orgId: number, limit = 10): Promise<any[]> {
    try {
      const activities = await Activity.find({
        $or: [
          { organizationId: orgId },
          // Also include activities for users in this organization
          {
            userId: {
              $in: await User.find({ organizationId: orgId }).select("_id"),
            },
          },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return activities
        .map((activity) => {
          const plainActivity = toPlainObject<IActivity>(activity);
          if (!plainActivity) return null;

          return {
            ...plainActivity,
            id: this.convertId(plainActivity._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting activities by organization:", error);
      return [];
    }
  }

  async createActivity(activityData: any): Promise<any> {
    try {
      // Convert IDs to ObjectId if they exist
      let organizationId = null;
      let userId = null;

      if (activityData.organizationId) {
        organizationId = this.toObjectId(activityData.organizationId);
      }

      if (activityData.userId) {
        userId = this.toObjectId(activityData.userId);
      }

      const newActivity = new Activity({
        type: activityData.type,
        description: activityData.description,
        organizationId: organizationId,
        userId: userId,
        metadata: activityData.metadata || {},
      });

      const saved = await newActivity.save();
      const result = toPlainObject<IActivity>(saved);

      if (!result) {
        throw new Error("Failed to create activity");
      }

      return {
        ...result,
        id: this.convertId(result._id),
        organizationId: result.organizationId
          ? this.convertId(result.organizationId)
          : null,
        userId: result.userId ? this.convertId(result.userId) : null,
      };
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  // Payouts
  async getPayout(id: number): Promise<any | undefined> {
    try {
      const payout = await Payout.findOne({ id });
      return toPlainObject(payout);
    } catch (error) {
      console.error("Error getting payout:", error);
      return undefined;
    }
  }

  async getPayoutsByUser(userId: number): Promise<any[]> {
    try {
      const payouts = await Payout.find({ userId });
      return payouts
        .map((payout) => {
          const plainPayout = toPlainObject<IPayout>(payout);
          if (!plainPayout) return null;

          return {
            ...plainPayout,
            id: this.convertId(plainPayout._id),
          };
        })
        .filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting payouts by user:", error);
      return [];
    }
  }

  async createPayout(payoutData: any): Promise<any> {
    try {
      const newPayout = new Payout({
        userId: payoutData.userId,
        amount: payoutData.amount,
        status: payoutData.status || "pending",
        paymentMethod: payoutData.paymentMethod,
        paymentReference: payoutData.paymentReference || null,
      });

      const saved = await newPayout.save();
      const result = toPlainObject<IPayout>(saved);

      if (!result) {
        throw new Error("Failed to create payout");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating payout:", error);
      throw error;
    }
  }

  async updatePayoutStatus(
    id: number,
    status: string,
    reference?: string
  ): Promise<any | undefined> {
    try {
      const updateData: any = { status };
      if (reference) {
        updateData.paymentReference = reference;
      }

      const payout = await Payout.findOneAndUpdate(
        { id },
        { $set: updateData },
        { new: true }
      );

      if (!payout) return undefined;

      const result = toPlainObject<IPayout>(payout);
      if (!result) return undefined;

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error updating payout status:", error);
      return undefined;
    }
  }

  // Notification Settings
  async getNotificationSettings(userId: number): Promise<any | undefined> {
    try {
      const settings = await NotificationSetting.findOne({ userId });
      return toPlainObject(settings);
    } catch (error) {
      console.error("Error getting notification settings:", error);
      return undefined;
    }
  }

  async createOrUpdateNotificationSettings(settingsData: any): Promise<any> {
    try {
      const settings = await NotificationSetting.findOneAndUpdate(
        { userId: settingsData.userId },
        {
          $set: {
            emailNotifications: settingsData.emailNotifications ?? true,
            conversionAlerts: settingsData.conversionAlerts ?? true,
            payoutAlerts: settingsData.payoutAlerts ?? true,
            marketingTips: settingsData.marketingTips ?? true,
          },
        },
        { new: true, upsert: true }
      );

      const result = toPlainObject<INotificationSetting>(settings);
      if (!result) {
        throw new Error("Failed to create/update notification settings");
      }

      return {
        ...result,
        id: this.convertId(result._id),
      };
    } catch (error) {
      console.error("Error creating/updating notification settings:", error);
      throw error;
    }
  }

  // Analytics
  async getOrganizationStats(orgId: number): Promise<{
    activeMarketers: number;
    totalClicks: number;
    conversions: number;
    commissionEarned: number;
  }> {
    try {
      // Get all users in the organization
      const users = await User.find({
        organizationId: orgId,
        role: "marketer",
        status: "active",
      });
      const userIds = users.map((user) => user._id);

      // Get all affiliate links for these users
      const links = await AffiliateLink.find({ userId: { $in: userIds } });
      const linkIds = links.map((link) => link._id);

      // Calculate total clicks
      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

      // Get all conversions for these links
      const conversions = await Conversion.find({
        linkId: { $in: linkIds },
        status: { $in: ["pending", "approved"] },
      });

      // Calculate total commission earned
      const commissionEarned = conversions.reduce(
        (sum, conv) => sum + conv.commission,
        0
      );

      return {
        activeMarketers: users.length,
        totalClicks,
        conversions: conversions.length,
        commissionEarned,
      };
    } catch (error) {
      console.error("Error getting organization stats:", error);
      return {
        activeMarketers: 0,
        totalClicks: 0,
        conversions: 0,
        commissionEarned: 0,
      };
    }
  }

  async getUserStats(userId: number): Promise<{
    totalClicks: number;
    conversions: number;
    pendingCommission: number;
    totalCommission: number;
  }> {
    try {
      // Get all affiliate links for this user
      const links = await AffiliateLink.find({ userId });
      const linkIds = links.map((link) => link._id);

      // Calculate total clicks
      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

      // Get all conversions for these links
      const allConversions = await Conversion.find({
        linkId: { $in: linkIds },
      });
      const pendingConversions = allConversions.filter(
        (conv) => conv.status === "pending"
      );

      // Calculate commission values
      const pendingCommission = pendingConversions.reduce(
        (sum, conv) => sum + conv.commission,
        0
      );
      const totalCommission = allConversions
        .filter((conv) => conv.status === "approved")
        .reduce((sum, conv) => sum + conv.commission, 0);

      return {
        totalClicks,
        conversions: allConversions.length,
        pendingCommission,
        totalCommission,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      return {
        totalClicks: 0,
        conversions: 0,
        pendingCommission: 0,
        totalCommission: 0,
      };
    }
  }

  async getTopMarketers(orgId: number, limit = 5): Promise<any[]> {
    try {
      // Get all marketers in the organization
      const marketers = await User.find({
        organizationId: orgId,
        role: "marketer",
      });

      const result = [];

      for (const marketer of marketers) {
        // Get all affiliate links for this marketer
        const links = await AffiliateLink.find({ userId: marketer._id });
        const linkIds = links.map((link) => link._id);

        // Get all conversions for these links
        const conversions = await Conversion.find({
          linkId: { $in: linkIds },
          status: "approved",
        });

        // Calculate total commission earned
        const commission = conversions.reduce(
          (sum, conv) => sum + conv.commission,
          0
        );

        result.push({
          id: this.convertId(marketer._id),
          name: marketer.name,
          avatar: marketer.avatar,
          conversions: conversions.length,
          commission,
        });
      }

      // Sort by commission earned (descending) and limit
      return result.sort((a, b) => b.commission - a.commission).slice(0, limit);
    } catch (error) {
      console.error("Error getting top marketers:", error);
      return [];
    }
  }

  async getTopProducts(orgId: number, limit = 5): Promise<any[]> {
    try {
      // Get all apps for this organization
      const apps = await App.find({ organizationId: orgId });

      const result = [];

      for (const app of apps) {
        // Get all affiliate links for this app
        const links = await AffiliateLink.find({ appId: app._id });
        const linkIds = links.map((link) => link._id);

        // Get all conversions for these links
        const conversions = await Conversion.find({
          linkId: { $in: linkIds },
          status: "approved",
        });

        // Calculate metrics
        const revenue = conversions.reduce((sum, conv) => sum + conv.amount, 0);
        const commission = conversions.reduce(
          (sum, conv) => sum + conv.commission,
          0
        );

        result.push({
          id: this.convertId(app._id),
          name: app.name,
          icon: app.icon,
          conversions: conversions.length,
          revenue,
          commission,
        });
      }

      // Sort by revenue (descending) and limit
      return result.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    } catch (error) {
      console.error("Error getting top products:", error);
      return [];
    }
  }
}