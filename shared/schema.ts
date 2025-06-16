import { z } from "zod";

// User roles
export enum UserRole {
  MANAGEMENT = "management",
  ADMIN = "admin",
  MARKETER = "marketer",
}

// Payment gateways
export enum PaymentGateway {
  FLUTTERWAVE = "flutterwave",
  PAYSTACK = "paystack",
}

// Subscription plans
export enum SubscriptionPlan {
  FREE_TRIAL = "free_trial",
  STARTER = "starter",
  GROWTH = "growth",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

// Plan limitations
export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE_TRIAL]: { apps: 1, marketers: 10, durationDays: 7 },
  [SubscriptionPlan.STARTER]: { apps: 1, marketers: 50, price: 29 },
  [SubscriptionPlan.GROWTH]: { apps: 5, marketers: 300, price: 79 },
  [SubscriptionPlan.PRO]: { apps: 999999, marketers: 1000, price: 199 },
  [SubscriptionPlan.ENTERPRISE]: {
    apps: 999999,
    marketers: 999999,
    price: null,
  },
};

// Interfaces for MongoDB documents
export interface IOrganization {
  _id?: string; // MongoDB ObjectId as string
  id?: string; // Optional legacy ID field (string in MongoStorage)
  name: string;
  email: string;
  logo?: string | null;
  plan: SubscriptionPlan;
  trialEndsAt?: Date | null;
  webhookUrl?: string | null;
  onboardingCompleted?: boolean;
  position?: string | null;
  industry?: string | null;
  companySize?: string | null;
  signingFrequency?: string | null;
  creationFrequency?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  _id?: string;
  id?: string;
  organizationId?: string[] | null;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string | null;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApp {
  _id?: string;
  id?: string;
  organizationId: string;
  name: string;
  description?: string | null;
  baseUrl: string;
  icon?: string | null;
  commissionType: string;
  commissionValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAffiliateLink {
  _id?: string;
  id?: string;
  userId: string;
  appId: string;
  code: string;
  clicks: number;
  createdAt?: Date;
}

export interface IConversion {
  _id?: string;
  id?: string;
  linkId: string;
  transactionId: string;
  amount: number;
  commission: number;
  status: string;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IActivity {
  _id?: string;
  id?: string;
  organizationId?: string | null;
  userId?: string | null;
  type: string;
  description: string;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
}

export interface IPayout {
  _id?: string;
  id?: string;
  userId: string;
  amount: number;
  status: string;
  paymentMethod: PaymentGateway;
  paymentReference?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationSetting {
  _id?: string;
  id?: string;
  userId: string;
  emailNotifications: boolean;
  conversionAlerts: boolean;
  payoutAlerts: boolean;
  marketingTips: boolean;
  updatedAt?: Date;
}
// Insert schemas
export const insertOrganizationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  logo: z.string().optional(),
  plan: z.string(),
  trialEndsAt: z.date().optional(),
  webhookUrl: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
  position: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),

  // New onboarding questions relevant to Growvia
  primaryGoal: z
    .string()
    .optional()
    .describe(
      "What is your primary goal with affiliate marketing (e.g., increase brand awareness, drive sales, generate leads)?"
    ),
  targetAudience: z
    .string()
    .optional()
    .describe(
      "Describe your target audience for affiliate marketing (e.g., demographics, interests)."
    ),
  existingAffiliates: z
    .string()
    .optional()
    .describe(
      "Do you have an existing affiliate program? If so, how many affiliates do you currently have?"
    ),
  productsToPromote: z
    .string()
    .optional()
    .describe(
      "Which products or services do you plan to promote via affiliates?"
    ),
});

export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.string(),
  avatar: z.string().optional(),
  status: z.string(),
});


export const onboardingSchema = z.object({
  primaryGoal: z
    .string()
    .min(1, { message: "Please specify your primary goal." })
    .describe(
      "What is your primary goal with affiliate marketing (e.g., increase brand awareness, drive sales, generate leads)?"
    ),
  targetAudience: z
    .string()
    .min(1, { message: "Please describe your target audience." })
    .describe(
      "Describe your target audience for affiliate marketing (e.g., demographics, interests)."
    ),
  existingAffiliates: z
    .string()
    .optional() // Optional if they don't have an existing program
    .describe(
      "Do you have an existing affiliate program? If so, how many affiliates do you currently have?"
    ),
  productsToPromote: z
    .string()
    .min(1, { message: "Please list the products you want to promote." })
    .describe(
      "Which products or services do you plan to promote via affiliates?"
    ),
});

export const insertAppSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  baseUrl: z.string(),
  icon: z.string().optional(),
  commissionType: z.string(),
  commissionValue: z.number(),
});

export const insertAffiliateLinkSchema = z.object({
  userId: z.string(),
  appId: z.string(),
  code: z.string(),
});

export const insertConversionSchema = z.object({
  linkId: z.string(),
  transactionId: z.string(),
  amount: z.number(),
  commission: z.number(),
  status: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const insertActivitySchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  type: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const insertPayoutSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  status: z.string(),
  paymentMethod: z.string(),
  paymentReference: z.string().optional(),
});

export const insertNotificationSettingsSchema = z.object({
  userId: z.string(),
  emailNotifications: z.boolean(),
  conversionAlerts: z.boolean(),
  payoutAlerts: z.boolean(),
  marketingTips: z.boolean(),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(2),
});

// Type aliases for consistency with MongoStorage
export type Organization = IOrganization;
export type User = IUser;
export type App = IApp;
export type AffiliateLink = IAffiliateLink;
export type Conversion = IConversion;
export type Activity = IActivity;
export type Payout = IPayout;
export type NotificationSetting = INotificationSetting;
