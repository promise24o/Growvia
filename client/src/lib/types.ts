export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organizationId: number | null;
  status?: string;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: number;
  name: string;
  email: string;
  logo?: string | null;
  plan: SubscriptionPlan;
  trialEndsAt?: string | null;
  webhookUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface App {
  id: number;
  organizationId: number;
  name: string;
  description?: string | null;
  baseUrl: string;
  icon?: string | null;
  commissionType: "percentage" | "fixed";
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateLink {
  id: number;
  userId: number;
  appId: number;
  code: string;
  clicks: number;
  createdAt: string;
}

export interface Conversion {
  id: number;
  linkId: number;
  transactionId: string;
  amount: number;
  commission: number;
  status: "pending" | "approved" | "rejected" | "paid";
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  organizationId: number | null;
  userId: number | null;
  type: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export interface Payout {
  id: number;
  userId: number;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  paymentMethod: string;
  paymentReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSetting {
  id: number;
  userId: number;
  emailNotifications: boolean;
  conversionAlerts: boolean;
  payoutAlerts: boolean;
  marketingTips: boolean;
  updatedAt: string;
}

export interface Marketer {
  id: number;
  name: string;
  email: string;
  conversions: number;
  revenue: number;
  status: string;
}

export interface Product {
  id: number;
  name: string;
  icon: string | null;
  conversions: number;
  revenue: number;
  growth: number;
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

export const PLAN_NAMES = {
  [SubscriptionPlan.FREE_TRIAL]: "Free Trial",
  [SubscriptionPlan.STARTER]: "Starter",
  [SubscriptionPlan.GROWTH]: "Growth",
  [SubscriptionPlan.PRO]: "Pro",
  [SubscriptionPlan.ENTERPRISE]: "Enterprise",
};

export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE_TRIAL]: {
    apps: 1,
    marketers: 10,
    durationDays: 7,
    price: 0,
  },
  [SubscriptionPlan.STARTER]: { apps: 1, marketers: 50, price: 29 },
  [SubscriptionPlan.GROWTH]: { apps: 5, marketers: 300, price: 79 },
  [SubscriptionPlan.PRO]: { apps: 999999, marketers: 1000, price: 199 },
  [SubscriptionPlan.ENTERPRISE]: {
    apps: 999999,
    marketers: 999999,
    price: null,
  },
};

export interface StatsResponse {
  activeMarketers: number;
  totalClicks: number;
  conversions: number;
  commissionEarned: number;
}

export interface UserStatsResponse {
  totalClicks: number;
  conversions: number;
  pendingCommission: number;
  totalCommission: number;
}
