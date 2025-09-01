import mongoose, { Types } from "mongoose";
import {
  IActivity,
  IAffiliateLink,
  IApp,
  IConversion,
  INotificationSetting,
  IOrganization,
  IPayout,
  IUser,
} from "./models";

// Insert interfaces for MongoDB (equivalent to Insert* schemas)
export interface InsertOrganization {
  name: string;
  email: string;
  logo?: string | null;
  plan?: string;
  trialEndsAt?: Date;
  webhookUrl?: string | null;
  onboardingCompleted?: boolean;
  position?: string | null;
  industry?: string | null;
  companySize?: string | null;
  primaryGoal?: string | null;
  targetAudience?: string | null;
  existingAffiliates?: string | null;
  productsToPromote?: string | null;
}

export interface InsertUser {
  organizationId?: mongoose.Types.ObjectId[] | string[] | null;
  name: string;
  email: string;
  password: string;
  role: string;
  avatar?: string | null;
  status?: string;
}

export interface InsertApp {
  organizationId: mongoose.Types.ObjectId | string;
  name: string;
  description?: string | null;
  baseUrl: string;
  icon?: string | null;
  commissionType?: string;
  commissionValue?: number;
}

export interface InsertAffiliateLink {
  userId: mongoose.Types.ObjectId | string;
  appId: mongoose.Types.ObjectId | string;
  code?: string;
  clicks?: number;
}

export interface InsertConversion {
  linkId: mongoose.Types.ObjectId | string;
  transactionId: string;
  amount: number;
  commission: number;
  status?: string;
  metadata?: Record<string, any> | null;
}

export interface InsertActivity {
  organizationId?: mongoose.Types.ObjectId | string | null;
  userId?: mongoose.Types.ObjectId | string | null;
  type: string;
  description: string;
  metadata?: Record<string, any> | null;
}

export interface InsertPayout {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  status?: string;
  paymentMethod: string;
  paymentReference?: string | null;
}

export interface InsertNotificationSetting {
  userId: mongoose.Types.ObjectId | string;
  emailNotifications?: boolean;
  conversionAlerts?: boolean;
  payoutAlerts?: boolean;
  marketingTips?: boolean;
}

interface WalletData {
  userId: string | Types.ObjectId;
  balance: number;
  pendingBalance?: number;
}

interface TransactionData {
  userId: string | Types.ObjectId;
  description: string;
  type: 'Earned' | 'Spent' | 'Transfer In' | 'Transfer Out';
  amount: number;
  status?: 'Pending' | 'Completed' | 'Failed';
  transactionId: string;
  receiverId?: string | Types.ObjectId;
  ipAddress?: string;
  deviceFingerprint?: string;
  createdAt?: Date;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  name: string;
}

interface ActivityData {
  type: string;
  description: string;
  userId: string;
  metadata?: Record<string, any>;
}


export interface IStorage {
  // Organizations
  getOrganization(id: string | number): Promise<IOrganization | undefined>;
  getOrganizationByEmail(email: string): Promise<IOrganization | undefined>;
  createOrganization(org: InsertOrganization): Promise<IOrganization>;
  updateOrganization(
    id: string | number,
    org: Partial<IOrganization>,
    options?: { session?: any }
  ): Promise<IOrganization | undefined>;

  // Users
  getUser(id: string | number): Promise<IUser | undefined>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  getUserByVerificationToken(token: string): Promise<IUser | undefined>;
  getUsersByOrganization(orgId: string | number): Promise<IUser[]>;
  createUser(user: InsertUser): Promise<IUser>;
  updateUser(
    id: string | number,
    user: Partial<IUser>,
    options?: { session?: any }
  ): Promise<IUser | undefined>;
  verifyPassword(password: string, hash: string): boolean;

  // Apps
  getApp(id: string | number): Promise<IApp | undefined>;
  getAppsByOrganization(orgId: string | number): Promise<IApp[]>;
  createApp(app: InsertApp): Promise<IApp>;
  updateApp(id: string | number, app: Partial<IApp>): Promise<IApp | undefined>;
  deleteApp(id: string | number): Promise<boolean>;

  // Affiliate Links
  getAffiliateLink(id: string | number): Promise<IAffiliateLink | undefined>;
  getAffiliateLinkByCode(code: string): Promise<IAffiliateLink | undefined>;
  getAffiliateLinksByUser(userId: string | number): Promise<IAffiliateLink[]>;
  createAffiliateLink(link: InsertAffiliateLink): Promise<IAffiliateLink>;
  incrementLinkClicks(id: string | number): Promise<boolean>;

  // Conversions
  getConversion(id: string | number): Promise<IConversion | undefined>;
  getConversionsByLink(linkId: string | number): Promise<IConversion[]>;
  getConversionsByUser(userId: string | number): Promise<IConversion[]>;
  getConversionsByOrganization(orgId: string | number): Promise<IConversion[]>;
  createConversion(conversion: InsertConversion): Promise<IConversion>;
  updateConversionStatus(
    id: string | number,
    status: string
  ): Promise<IConversion | undefined>;

  // Activities
  getActivitiesByOrganization(
    orgId: string | number,
    limit?: number
  ): Promise<IActivity[]>;
  createActivity(
    activity: InsertActivity,
    options?: { session?: any }
  ): Promise<IActivity>;

  // Payouts
  getPayout(id: string | number): Promise<IPayout | undefined>;
  getPayoutsByUser(userId: string | number): Promise<IPayout[]>;
  createPayout(payout: InsertPayout): Promise<IPayout>;
  updatePayoutStatus(
    id: string | number,
    status: string,
    reference?: string
  ): Promise<IPayout | undefined>;

  // Notification Settings
  getNotificationSettings(
    userId: string | number
  ): Promise<INotificationSetting | undefined>;
  createOrUpdateNotificationSettings(
    settings: InsertNotificationSetting
  ): Promise<INotificationSetting>;

  // Marketer Applications
  createMarketerApplication(applicationData: any): Promise<any>;
  deleteMarketerApplication(id: string | number): Promise<boolean>;
  getMarketerApplication(id: string | number): Promise<any | undefined>;
  getMarketerApplications(filters?: {
    organizationId?: string | number;
    status?: string;
    email?: string;
  }): Promise<any[]>;
  getMarketerApplicationByToken(token: string): Promise<any | undefined>;
  updateMarketerApplication(
    id: string | number,
    data: Partial<any>
  ): Promise<any | undefined>;
  reviewMarketerApplication(
    id: string | number,
    approved: boolean,
    reviewerId: string | number,
    notes?: string
  ): Promise<any>;

  // Analytics
  getOrganizationStats(orgId: string | number): Promise<{
    activeMarketers: number;
    totalClicks: number;
    conversions: number;
    commissionEarned: number;
  }>;
  getUserStats(userId: string | number): Promise<{
    totalClicks: number;
    conversions: number;
    pendingCommission: number;
    totalCommission: number;
  }>;
  getTopMarketers(orgId: string | number, limit?: number): Promise<any[]>;
  getTopProducts(orgId: string | number, limit?: number): Promise<any[]>;
  invalidateUserSessions(userId: string): Promise<void>;
  getWallet(userId: string | number): Promise<WalletData | null>;
  updateWallet(userId: string | number, data: Partial<WalletData>): Promise<void>;
  getWalletTransactions(userId: string | number): Promise<TransactionData[]>;
  createWalletTransaction(data: TransactionData): Promise<void>;
  updateWalletTransaction(transactionId: string, data: Partial<TransactionData>): Promise<void>;
  getWalletTransactionById(transactionId: string): Promise<TransactionData | null>;
  countWalletTransactions(userId: string | number, type: string, since: number): Promise<number>;
  getUserByEmailOrUsername(identifier: string): Promise<UserData | null>;
  createActivity(data: ActivityData): Promise<void>;
  countWalletTransactions(userId: string, type: string, since: number): Promise<number>;
}
