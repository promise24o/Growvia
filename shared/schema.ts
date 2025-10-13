// shared/schema.ts
import { z } from "zod";

export enum UserRole {
  MANAGEMENT = "management",
  ADMIN = "admin",
  MARKETER = "marketer",
}

export enum PaymentGateway {
  FLUTTERWAVE = "flutterwave",
  PAYSTACK = "paystack",
}

export enum SubscriptionPlan {
  FREE_TRIAL = "free_trial",
  STARTER = "starter",
  GROWTH = "growth",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

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

export enum AppType {
  MOBILE_APP = "Mobile App",
  WEBSITE = "Website",
}

export enum AppCategory {
  FINANCE = "Finance",
  ECOMMERCE = "eCommerce",
  EDUCATION = "Education",
  HEALTH = "Health",
  GAMING = "Gaming",
  SOCIAL = "Social",
  PRODUCTIVITY = "Productivity",
  OTHER = "Other",
}

export enum AppStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DRAFT = "draft",
}

export interface IApp {
  _id?: string;
  id?: string;
  organizationId: string;
  name: string;
  type: AppType;
  url: string;
  shortDescription: string;
  detailedDescription?: string | null;
  category: AppCategory;
  appStoreLink?: string | null;
  googlePlayLink?: string | null;
  landingPages?: string[];
  icon?: string | null;
  promoMaterials?: string[];
  status: AppStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrganization {
  _id?: string;
  id?: string;
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
  primaryGoal?: string | null;
  targetAudience?: string | null;
  existingAffiliates?: string | null;
  productsToPromote?: string | null;
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

export interface ICommission {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  type: string;
  conversionEvent?: string;
  payout: {
    amount: number;
    isPercentage: boolean;
    currency?: string;
    baseField?: string;
    conversionValueEstimate?: number;
  };
  maxPerMarketer?: number | null;
  maxTotalPayout?: number | null;
  validationMethod: string;
  webhookUrl?: string;
  secretToken?: string;
  payoutDelay: number;
  oneConversionPerUser: boolean;
  minSessionDuration?: number | null;
  organizationId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  fraudDetection: {
    conversionDelay?: number | null;
    ipRestriction?: string | null;
    deviceFingerprintChecks?: boolean;
    duplicateEmailPhoneBlock?: boolean;
    geoTargeting?: string[] | null;
    minimumOrderValue?: number | null;
    conversionSpikeAlert?: boolean;
    cookieTamperDetection?: boolean;
    affiliateBlacklist?: boolean;
    kycVerifiedOnly?: boolean;
  };
}

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
    .optional()
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

// Helper function to preprocess array fields that might come as strings
const preprocessArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If not JSON, try to split by comma
      return val.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

type AppInput = {
  type: 'Mobile App' | 'Website';
  appStoreLink?: string | null | undefined;
  googlePlayLink?: string | null | undefined;
  landingPages?: string[] | undefined;
  [key: string]: any; // Allow other properties
};

// Schema for creating a new app
export const insertAppSchema = z.object({
  name: z.string().min(1, 'Application name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['Mobile App', 'Website'], { message: 'Invalid application type' }),
  url: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('Please enter a valid URL').min(1, 'Application URL is required')
  ),
  shortDescription: z.string().max(200, 'Short description must be less than 200 characters').min(1, 'Short description is required'),
  detailedDescription: z.string().max(1000, 'Detailed description must be less than 1000 characters').optional().nullable(),
  category: z.enum(['Finance', 'eCommerce', 'Education', 'Health', 'Gaming', 'Social', 'Productivity', 'Other'], { message: 'Invalid category' }),
  appStoreLink: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url('Please enter a valid App Store URL').optional().nullable()
  ),
  googlePlayLink: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url('Please enter a valid Google Play URL').optional().nullable()
  ),
  landingPages: z.union([
    z.string().transform((val, ctx) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return val.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }),
    z.array(z.string())
  ]).transform(val => Array.isArray(val) ? val : [val])
  .refine(
    (val) => val.every((url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }),
    { message: 'One or more landing page URLs are invalid' }
  )
  .default([]),
  promoMaterials: z.preprocess(
    preprocessArray,
    z.array(z.string()).optional().default([])
  ),
  status: z.enum(['active', 'inactive', 'draft']).optional().default('draft'),
  organizationId: z.string().optional(),
  icon: z.string().optional().nullable(),
}).superRefine((data: AppInput, ctx) => {
  if (data.type === 'Mobile App') {
    if (!data.appStoreLink) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: 'App Store Link is required for Mobile App', 
        path: ['appStoreLink'] 
      });
    }
    if (!data.googlePlayLink) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        message: 'Google Play Link is required for Mobile App', 
        path: ['googlePlayLink'] 
      });
    }
  }
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

// Base commission schema without refinements
const baseCommissionSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  description: z.string().optional(),
  type: z.enum(['click', 'visit', 'signup', 'purchase', 'custom'], {
    errorMap: () => ({ message: 'Invalid commission type' }),
  }),
  conversionEvent: z.string().optional(),
  payout: z.object({
    amount: z.number().min(0, 'Amount must be positive'),
    isPercentage: z.boolean(),
    currency: z.string().optional(),
    baseField: z.string().optional(),
    conversionValueEstimate: z.number().min(1, 'Must be at least ₦1').optional(),
  }).refine(
    (data) => !data.isPercentage ? !!data.currency : true,
    { message: 'Currency is required for fixed amount payouts', path: ['currency'] }
  ).refine(
    (data) => data.isPercentage ? !!data.baseField : true,
    { message: 'Base field is required for percentage payouts', path: ['baseField'] }
  ).refine(
    (data) => data.isPercentage ? data.amount >= 0 && data.amount <= 100 : data.amount >= 0,
    { message: 'Percentage must be between 0 and 100%', path: ['amount'] }
  ).refine(
    (data) => data.isPercentage ? !!data.conversionValueEstimate : true,
    { message: 'Conversion value estimate is required for percentage payouts', path: ['conversionValueEstimate'] }
  ),
  maxPerMarketer: z.number().min(0, 'Must be positive').nullable().optional(),
  maxTotalPayout: z.number().min(0, 'Must be positive').nullable().optional(),
  validationMethod: z.enum(['auto', 'manual', 'webhook'], {
    errorMap: () => ({ message: 'Invalid validation method' }),
  }),
  webhookUrl: z.string().optional(),
  secretToken: z.string().optional(),
  oneConversionPerUser: z.boolean(),
  minSessionDuration: z.number().min(0, 'Must be positive').nullable().optional(),
  organizationId: z.string().optional(),
  fraudDetection: z.object({
    conversionDelay: z.number().min(1).max(30).nullable().optional(),
    ipRestriction: z.enum(['one_per_12h']).nullable().optional(),
    deviceFingerprintChecks: z.boolean().optional(),
    duplicateEmailPhoneBlock: z.boolean().optional(),
    geoTargeting: z.array(z.string()).nullable().optional(),
    minimumOrderValue: z.number().min(10000).nullable().optional(),
    conversionSpikeAlert: z.boolean().optional(),
    cookieTamperDetection: z.boolean().optional(),
    affiliateBlacklist: z.boolean().optional(),
    kycVerifiedOnly: z.boolean().optional(),
  }),
  saveAndCreate: z.boolean().optional(),
  duplicate: z.boolean().optional(),
});

// Full commission schema with refinements for creation
export const commissionSchema = baseCommissionSchema.refine(
  (data) => data.type === 'custom' ? !!data.conversionEvent : true,
  { message: 'Conversion event is required for custom type', path: ['conversionEvent'] }
).refine(
  (data) => data.validationMethod === 'webhook' ? !!data.webhookUrl && !!data.secretToken : true,
  { message: 'Webhook URL and secret token are required for webhook validation', path: ['webhookUrl', 'secretToken'] }
);

// Partial commission schema for updates
export const updateCommissionSchema = baseCommissionSchema.partial();

// Campaign interfaces and schemas
export interface ICampaign {
  id?: string;
  name: string;
  category: string;
  applicationId: string;
  description: string;
  affiliateRequirements?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  visibility: 'public' | 'invite-only';
  commissionModels: string[];
  safetyBufferPercent: number;
  maxAffiliates: number;
  expectedConversionsPerAffiliate?: number | null;
  organizationId?: string | null;
  status?: 'active' | 'paused' | 'completed' | 'archived';
  createdAt?: Date;
  updatedAt?: Date;
  currentAffiliates?: number;
  totalConversions?: number;
  totalRevenue?: number;
}

// Base campaign schema without refinements
const baseCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters').max(100, 'Name cannot exceed 100 characters'),
  category: z.string().transform((str) => str.toLowerCase()).pipe(z.enum([
    'e-commerce',
    'saas', 
    'finance',
    'health',
    'education',
    'gaming',
    'travel',
    'fashion',
    'food',
    'technology',
    'other'
  ], {
    errorMap: () => ({ message: 'Invalid category' }),
  })),
  applicationId: z.string().min(1, 'Application selection is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  affiliateRequirements: z.string().optional(),
  startDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }).nullable().optional(),
  endDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }).nullable().optional(),
  visibility: z.enum(['public', 'invite-only'], {
    errorMap: () => ({ message: 'Invalid visibility option' }),
  }),
  commissionModels: z.array(z.string()).min(1, 'At least one commission model is required'),
  safetyBufferPercent: z.number().min(10, 'Safety buffer must be at least 10%').max(100, 'Safety buffer cannot exceed 100%'),
  maxAffiliates: z.number().min(1, 'Must allow at least 1 affiliate').max(10000, 'Cannot exceed 10,000 affiliates'),
  expectedConversionsPerAffiliate: z.number().min(0, 'Must be positive').nullable().optional(),
  organizationId: z.string().optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
});

// Full campaign schema with refinements for creation
export const campaignSchema = baseCampaignSchema.refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.endDate > data.startDate;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

// Partial campaign schema for updates
export const updateCampaignSchema = baseCampaignSchema.partial();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional().or(z.literal('')),
  role: z.enum(['admin', 'marketer'], { message: 'Role must be either "admin" or "marketer"' }),
  referrer: z.string().optional(),
}).refine((data) => data.role === 'admin' ? !!data.organizationName && data.organizationName !== '' : true, {
  message: 'Organization name is required for admin role',
  path: ['organizationName'],
});

export const profilePhotoSchema = z.object({
  avatar: z.any().refine((file) => file !== undefined, {
    message: "Avatar file is required",
  }),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).optional(),
  about: z.string().max(500, { message: "About section cannot exceed 500 characters" }).optional(),
  phone: z.string().regex(/^\+?[\d\s-]{7,}$/, { message: "Invalid phone number format" }).optional(),
  country: z.string().min(2, { message: "Country must be at least 2 characters" }).optional(),
  state: z.string().min(2, { message: "State must be at least 2 characters" }).optional(),
  languages: z.array(z.string()).optional(),
  industryFocus: z.string().optional(),
  socialMedia: z
    .object({
      twitter: z.string().url({ message: "Invalid Twitter URL format" }).optional().or(z.literal('')),
      linkedin: z.string().url({ message: "Invalid LinkedIn URL format" }).optional().or(z.literal('')),
      instagram: z.string().url({ message: "Invalid Instagram URL format" }).optional().or(z.literal('')),
      facebook: z.string().url({ message: "Invalid Facebook URL format" }).optional().or(z.literal('')),
    })
    .optional(),
  skills: z.array(z.string()).optional(),
});

export type Organization = IOrganization;
export type User = IUser;
export type App = IApp;
export type AffiliateLink = IAffiliateLink;
export type Conversion = IConversion;
export type Activity = IActivity;
export type Payout = IPayout;
export type NotificationSetting = INotificationSetting;
export type Commission = ICommission;