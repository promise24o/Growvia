import {
  Organization,
  InsertOrganization,
  User,
  InsertUser,
  App,
  InsertApp,
  AffiliateLink,
  InsertAffiliateLink,
  Conversion,
  InsertConversion,
  Activity,
  InsertActivity,
  Payout,
  InsertPayout,
  NotificationSetting,
  InsertNotificationSetting,
  UserRole,
  SubscriptionPlan,
  PLAN_LIMITS,
} from "@shared/schema";
import * as crypto from "crypto";

export interface IStorage {
  // Organizations
  getOrganization(id: string | number): Promise<Organization | undefined>;
  getOrganizationByEmail(email: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string | number, org: Partial<Organization>): Promise<Organization | undefined>;
  
  // Users
  getUser(id: string | number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByOrganization(orgId: string | number): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string | number, user: Partial<User>): Promise<User | undefined>;
  verifyPassword(password: string, hash: string): boolean;
  
  // Apps
  getApp(id: string | number): Promise<App | undefined>;
  getAppsByOrganization(orgId: string | number): Promise<App[]>;
  createApp(app: InsertApp): Promise<App>;
  updateApp(id: string | number, app: Partial<App>): Promise<App | undefined>;
  deleteApp(id: string | number): Promise<boolean>;
  
  // Affiliate Links
  getAffiliateLink(id: string | number): Promise<AffiliateLink | undefined>;
  getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined>;
  getAffiliateLinksByUser(userId: string | number): Promise<AffiliateLink[]>;
  createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink>;
  incrementLinkClicks(id: string | number): Promise<boolean>;
  
  // Conversions
  getConversion(id: string | number): Promise<Conversion | undefined>;
  getConversionsByLink(linkId: string | number): Promise<Conversion[]>;
  getConversionsByUser(userId: string | number): Promise<Conversion[]>;
  getConversionsByOrganization(orgId: string | number): Promise<Conversion[]>;
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  updateConversionStatus(id: string | number, status: string): Promise<Conversion | undefined>;
  
  // Activities
  getActivitiesByOrganization(orgId: string | number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Payouts
  getPayout(id: string | number): Promise<Payout | undefined>;
  getPayoutsByUser(userId: string | number): Promise<Payout[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayoutStatus(id: string | number, status: string, reference?: string): Promise<Payout | undefined>;
  
  // Notification Settings
  getNotificationSettings(userId: string | number): Promise<NotificationSetting | undefined>;
  createOrUpdateNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting>;
  
  // Analytics
  getOrganizationStats(orgId: number): Promise<{
    activeMarketers: number;
    totalClicks: number;
    conversions: number;
    commissionEarned: number;
  }>;
  getUserStats(userId: number): Promise<{
    totalClicks: number;
    conversions: number;
    pendingCommission: number;
    totalCommission: number;
  }>;
  getTopMarketers(orgId: number, limit?: number): Promise<any[]>;
  getTopProducts(orgId: number, limit?: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private organizations: Map<number, Organization>;
  private users: Map<number, User>;
  private apps: Map<number, App>;
  private affiliateLinks: Map<number, AffiliateLink>;
  private conversions: Map<number, Conversion>;
  private activities: Map<number, Activity>;
  private payouts: Map<number, Payout>;
  private notificationSettings: Map<number, NotificationSetting>;
  
  private currentOrgId: number;
  private currentUserId: number;
  private currentAppId: number;
  private currentLinkId: number;
  private currentConversionId: number;
  private currentActivityId: number;
  private currentPayoutId: number;
  private currentNotificationSettingId: number;

  constructor() {
    this.organizations = new Map();
    this.users = new Map();
    this.apps = new Map();
    this.affiliateLinks = new Map();
    this.conversions = new Map();
    this.activities = new Map();
    this.payouts = new Map();
    this.notificationSettings = new Map();
    
    this.currentOrgId = 1;
    this.currentUserId = 1;
    this.currentAppId = 1;
    this.currentLinkId = 1;
    this.currentConversionId = 1;
    this.currentActivityId = 1;
    this.currentPayoutId = 1;
    this.currentNotificationSettingId = 1;
    
    // Create sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a sample organization
    const org: Organization = {
      id: this.currentOrgId++,
      name: "TechCorp",
      email: "admin@techcorp.com",
      logo: null,
      plan: SubscriptionPlan.STARTER,
      trialEndsAt: null,
      webhookUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.organizations.set(org.id, org);
    
    // Create a sample admin user
    const admin: User = {
      id: this.currentUserId++,
      organizationId: org.id,
      name: "Alex Morgan",
      email: "alex@techcorp.com",
      password: this.hashPassword("password123"),
      role: UserRole.ADMIN,
      avatar: null,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(admin.id, admin);
    
    // Create sample marketers
    const marketers = [
      {
        name: "Emily Cooper",
        email: "emily@example.com",
        status: "active"
      },
      {
        name: "John Doe",
        email: "john@example.com",
        status: "active"
      },
      {
        name: "Sarah Miller",
        email: "sarah@example.com",
        status: "pending"
      },
      {
        name: "Michael Brown",
        email: "michael@example.com",
        status: "active"
      }
    ];
    
    marketers.forEach(marketer => {
      const user: User = {
        id: this.currentUserId++,
        organizationId: org.id,
        name: marketer.name,
        email: marketer.email,
        password: this.hashPassword("password123"),
        role: UserRole.MARKETER,
        avatar: null,
        status: marketer.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
    });
    
    // Create sample apps
    const apps = [
      {
        name: "Premium Subscription",
        description: "Monthly premium subscription for TechCorp services",
        baseUrl: "https://techcorp.com/premium",
        commissionType: "percentage",
        commissionValue: 20,
        icon: "ri-shopping-bag-line"
      },
      {
        name: "E-book Bundle",
        description: "Collection of technical e-books",
        baseUrl: "https://techcorp.com/ebooks",
        commissionType: "percentage",
        commissionValue: 15,
        icon: "ri-book-line"
      },
      {
        name: "Video Course",
        description: "Comprehensive video course on web development",
        baseUrl: "https://techcorp.com/courses",
        commissionType: "fixed",
        commissionValue: 50,
        icon: "ri-video-line"
      },
      {
        name: "Marketing Toolkit",
        description: "Marketing resources and templates",
        baseUrl: "https://techcorp.com/toolkit",
        commissionType: "percentage",
        commissionValue: 10,
        icon: "ri-tools-line"
      }
    ];
    
    apps.forEach(appData => {
      const app: App = {
        id: this.currentAppId++,
        organizationId: org.id,
        name: appData.name,
        description: appData.description,
        baseUrl: appData.baseUrl,
        icon: appData.icon,
        commissionType: appData.commissionType,
        commissionValue: appData.commissionValue,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.apps.set(app.id, app);
    });
    
    // Create sample activities
    const activityData = [
      {
        type: "user_joined",
        description: "Sarah Miller joined as a new marketer",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: "conversion",
        description: "John Doe generated a new sale for Premium Subscription",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        type: "payout",
        description: "Commission payout of $345.28 processed",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: "affiliate_link",
        description: "Emily Cooper created a new affiliate link for E-book Bundle",
        createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000) // 1.1 days ago
      },
      {
        type: "system_update",
        description: "System update completed successfully",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    activityData.forEach(actData => {
      const activity: Activity = {
        id: this.currentActivityId++,
        organizationId: org.id,
        userId: null,
        type: actData.type,
        description: actData.description,
        metadata: null,
        createdAt: actData.createdAt,
      };
      this.activities.set(activity.id, activity);
    });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // Organizations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizationByEmail(email: string): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(
      (org) => org.email === email,
    );
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.currentOrgId++;
    const newOrg: Organization = { 
      ...org, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      logo: null,
      webhookUrl: null
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;
    
    const updatedOrg = { 
      ...org, 
      ...orgData, 
      updatedAt: new Date() 
    };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUsersByOrganization(orgId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.organizationId === orgId,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { 
      ...user, 
      id, 
      password: this.hashPassword(user.password),
      createdAt: new Date(), 
      updatedAt: new Date(),
      avatar: null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // If password is being updated, hash it
    if (userData.password) {
      userData.password = this.hashPassword(userData.password);
    }
    
    const updatedUser = { 
      ...user, 
      ...userData, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Apps
  async getApp(id: number): Promise<App | undefined> {
    return this.apps.get(id);
  }

  async getAppsByOrganization(orgId: number): Promise<App[]> {
    return Array.from(this.apps.values()).filter(
      (app) => app.organizationId === orgId,
    );
  }

  async createApp(app: InsertApp): Promise<App> {
    const id = this.currentAppId++;
    const newApp: App = { 
      ...app, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      icon: null
    };
    this.apps.set(id, newApp);
    return newApp;
  }

  async updateApp(id: number, appData: Partial<App>): Promise<App | undefined> {
    const app = this.apps.get(id);
    if (!app) return undefined;
    
    const updatedApp = { 
      ...app, 
      ...appData, 
      updatedAt: new Date() 
    };
    this.apps.set(id, updatedApp);
    return updatedApp;
  }

  async deleteApp(id: number): Promise<boolean> {
    return this.apps.delete(id);
  }
  
  // Affiliate Links
  async getAffiliateLink(id: number): Promise<AffiliateLink | undefined> {
    return this.affiliateLinks.get(id);
  }

  async getAffiliateLinkByCode(code: string): Promise<AffiliateLink | undefined> {
    return Array.from(this.affiliateLinks.values()).find(
      (link) => link.code === code,
    );
  }

  async getAffiliateLinksByUser(userId: number): Promise<AffiliateLink[]> {
    return Array.from(this.affiliateLinks.values()).filter(
      (link) => link.userId === userId,
    );
  }

  async createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink> {
    const id = this.currentLinkId++;
    const newLink: AffiliateLink = { 
      ...link, 
      id, 
      clicks: 0,
      createdAt: new Date()
    };
    this.affiliateLinks.set(id, newLink);
    return newLink;
  }

  async incrementLinkClicks(id: number): Promise<boolean> {
    const link = this.affiliateLinks.get(id);
    if (!link) return false;
    
    link.clicks += 1;
    this.affiliateLinks.set(id, link);
    return true;
  }
  
  // Conversions
  async getConversion(id: number): Promise<Conversion | undefined> {
    return this.conversions.get(id);
  }

  async getConversionsByLink(linkId: number): Promise<Conversion[]> {
    return Array.from(this.conversions.values()).filter(
      (conversion) => conversion.linkId === linkId,
    );
  }

  async getConversionsByUser(userId: number): Promise<Conversion[]> {
    // Get all links for this user
    const userLinks = await this.getAffiliateLinksByUser(userId);
    const linkIds = userLinks.map(link => link.id);
    
    // Return conversions for these links
    return Array.from(this.conversions.values()).filter(
      conversion => linkIds.includes(conversion.linkId)
    );
  }

  async getConversionsByOrganization(orgId: number): Promise<Conversion[]> {
    // Get all users in this organization
    const orgUsers = await this.getUsersByOrganization(orgId);
    const userIds = orgUsers.map(user => user.id);
    
    // Get all links for these users
    const allLinks: AffiliateLink[] = [];
    for (const userId of userIds) {
      const userLinks = await this.getAffiliateLinksByUser(userId);
      allLinks.push(...userLinks);
    }
    const linkIds = allLinks.map(link => link.id);
    
    // Return conversions for these links
    return Array.from(this.conversions.values()).filter(
      conversion => linkIds.includes(conversion.linkId)
    );
  }

  async createConversion(conversion: InsertConversion): Promise<Conversion> {
    const id = this.currentConversionId++;
    const newConversion: Conversion = { 
      ...conversion, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date()
    };
    this.conversions.set(id, newConversion);
    return newConversion;
  }

  async updateConversionStatus(id: number, status: string): Promise<Conversion | undefined> {
    const conversion = this.conversions.get(id);
    if (!conversion) return undefined;
    
    const updatedConversion = { 
      ...conversion, 
      status, 
      updatedAt: new Date() 
    };
    this.conversions.set(id, updatedConversion);
    return updatedConversion;
  }
  
  // Activities
  async getActivitiesByOrganization(orgId: number, limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.organizationId === orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const newActivity: Activity = { 
      ...activity, 
      id, 
      createdAt: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  // Payouts
  async getPayout(id: number): Promise<Payout | undefined> {
    return this.payouts.get(id);
  }

  async getPayoutsByUser(userId: number): Promise<Payout[]> {
    return Array.from(this.payouts.values()).filter(
      (payout) => payout.userId === userId,
    );
  }

  async createPayout(payout: InsertPayout): Promise<Payout> {
    const id = this.currentPayoutId++;
    const newPayout: Payout = { 
      ...payout, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      paymentReference: null
    };
    this.payouts.set(id, newPayout);
    return newPayout;
  }

  async updatePayoutStatus(id: number, status: string, reference?: string): Promise<Payout | undefined> {
    const payout = this.payouts.get(id);
    if (!payout) return undefined;
    
    const updatedPayout = { 
      ...payout, 
      status,
      paymentReference: reference || payout.paymentReference,
      updatedAt: new Date() 
    };
    this.payouts.set(id, updatedPayout);
    return updatedPayout;
  }
  
  // Notification Settings
  async getNotificationSettings(userId: number): Promise<NotificationSetting | undefined> {
    return Array.from(this.notificationSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }

  async createOrUpdateNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting> {
    // Check if settings already exist for this user
    const existingSettings = await this.getNotificationSettings(settings.userId);
    
    if (existingSettings) {
      // Update existing settings
      const updatedSettings = { 
        ...existingSettings, 
        ...settings, 
        updatedAt: new Date() 
      };
      this.notificationSettings.set(existingSettings.id, updatedSettings);
      return updatedSettings;
    } else {
      // Create new settings
      const id = this.currentNotificationSettingId++;
      const newSettings: NotificationSetting = { 
        ...settings, 
        id, 
        updatedAt: new Date() 
      };
      this.notificationSettings.set(id, newSettings);
      return newSettings;
    }
  }

  // Analytics
  async getOrganizationStats(orgId: number): Promise<{
    activeMarketers: number;
    totalClicks: number;
    conversions: number;
    commissionEarned: number;
  }> {
    // Get active marketers count
    const users = await this.getUsersByOrganization(orgId);
    const activeMarketers = users.filter(u => u.role === UserRole.MARKETER && u.status === 'active').length;
    
    // Get affiliate links and calculate total clicks
    let totalClicks = 0;
    const allLinks: AffiliateLink[] = [];
    
    for (const user of users) {
      const userLinks = await this.getAffiliateLinksByUser(user.id);
      allLinks.push(...userLinks);
      totalClicks += userLinks.reduce((sum, link) => sum + link.clicks, 0);
    }
    
    // Get conversions and calculate commission
    const conversions = await this.getConversionsByOrganization(orgId);
    const totalConversions = conversions.length;
    const totalCommission = conversions.reduce((sum, conv) => sum + conv.commission, 0);
    
    return {
      activeMarketers,
      totalClicks,
      conversions: totalConversions,
      commissionEarned: totalCommission
    };
  }

  async getUserStats(userId: number): Promise<{
    totalClicks: number;
    conversions: number;
    pendingCommission: number;
    totalCommission: number;
  }> {
    // Get affiliate links and calculate total clicks
    const userLinks = await this.getAffiliateLinksByUser(userId);
    const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
    
    // Get conversions and calculate commissions
    const conversions = await this.getConversionsByUser(userId);
    const totalConversions = conversions.length;
    
    const pendingCommission = conversions
      .filter(conv => conv.status === 'pending' || conv.status === 'approved')
      .reduce((sum, conv) => sum + conv.commission, 0);
    
    const totalCommission = conversions
      .filter(conv => conv.status === 'paid')
      .reduce((sum, conv) => sum + conv.commission, 0);
    
    return {
      totalClicks,
      conversions: totalConversions,
      pendingCommission,
      totalCommission
    };
  }

  async getTopMarketers(orgId: number, limit = 5): Promise<any[]> {
    // Get all users for this organization
    const users = await this.getUsersByOrganization(orgId);
    const marketers = users.filter(u => u.role === UserRole.MARKETER);
    
    // For each marketer, calculate their conversions and revenue
    const marketerStats = await Promise.all(
      marketers.map(async marketer => {
        const conversions = await this.getConversionsByUser(marketer.id);
        const revenue = conversions.reduce((sum, conv) => sum + conv.amount, 0);
        
        return {
          marketer,
          conversions: conversions.length,
          revenue
        };
      })
    );
    
    // Sort by revenue and return top N
    return marketerStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(stats => ({
        id: stats.marketer.id,
        name: stats.marketer.name,
        email: stats.marketer.email,
        conversions: stats.conversions,
        revenue: stats.revenue,
        status: stats.marketer.status
      }));
  }

  async getTopProducts(orgId: number, limit = 5): Promise<any[]> {
    // Get all apps for this organization
    const apps = await this.getAppsByOrganization(orgId);
    
    // Get all conversions for this organization
    const orgConversions = await this.getConversionsByOrganization(orgId);
    
    // For each app, get affiliate links and associated conversions
    const appStats = await Promise.all(
      apps.map(async app => {
        // Get all links for this app
        const appLinks = Array.from(this.affiliateLinks.values()).filter(link => link.appId === app.id);
        const linkIds = appLinks.map(link => link.id);
        
        // Get conversions for these links
        const appConversions = orgConversions.filter(conv => linkIds.includes(conv.linkId));
        const revenue = appConversions.reduce((sum, conv) => sum + conv.amount, 0);
        
        // Calculate growth (hardcoded for this sample implementation)
        const randomGrowth = Math.random() * 20 - 5; // Random number between -5% and 15%
        
        return {
          app,
          conversions: appConversions.length,
          revenue,
          growth: randomGrowth
        };
      })
    );
    
    // Sort by revenue and return top N
    return appStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(stats => ({
        id: stats.app.id,
        name: stats.app.name,
        icon: stats.app.icon,
        conversions: stats.conversions,
        revenue: stats.revenue,
        growth: stats.growth
      }));
  }
}

export const storage = new MemStorage();
