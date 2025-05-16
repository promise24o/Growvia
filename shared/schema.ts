import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

// Organizations
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  logo: text("logo"),
  plan: text("plan").notNull().default(SubscriptionPlan.FREE_TRIAL),
  trialEndsAt: timestamp("trial_ends_at"),
  webhookUrl: text("webhook_url"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  position: text("position"),
  industry: text("industry"),
  companySize: text("company_size"),
  signingFrequency: text("signing_frequency"),
  creationFrequency: text("creation_frequency"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.MARKETER),
  avatar: text("avatar"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Apps (products that can be promoted)
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  baseUrl: text("base_url").notNull(),
  icon: text("icon"),
  commissionType: text("commission_type").notNull().default("percentage"), // percentage or fixed
  commissionValue: real("commission_value").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Affiliate links
export const affiliateLinks = pgTable(
  "affiliate_links",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    appId: integer("app_id")
      .notNull()
      .references(() => apps.id),
    code: text("code").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    clicks: integer("clicks").notNull().default(0),
  },
  (table) => {
    return {
      codeIdx: uniqueIndex("affiliate_link_code_idx").on(table.code),
    };
  },
);

// Conversions
export const conversions = pgTable("conversions", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id")
    .notNull()
    .references(() => affiliateLinks.id),
  transactionId: text("transaction_id").notNull().unique(),
  amount: real("amount").notNull(),
  commission: real("commission").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, paid
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Activities (for logging important events)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // user_joined, conversion, commission_paid, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Commissions payouts
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  paymentMethod: text("payment_method").notNull(), // flutterwave, paystack
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notification settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  conversionAlerts: boolean("conversion_alerts").notNull().default(true),
  payoutAlerts: boolean("payout_alerts").notNull().default(true),
  marketingTips: boolean("marketing_tips").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAffiliateLinkSchema = createInsertSchema(
  affiliateLinks,
).omit({
  id: true,
  createdAt: true,
  clicks: true,
});

export const insertConversionSchema = createInsertSchema(conversions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(
  notificationSettings,
).omit({
  id: true,
  updatedAt: true,
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

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type App = typeof apps.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;

export type Conversion = typeof conversions.$inferSelect;
export type InsertConversion = z.infer<typeof insertConversionSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<
  typeof insertNotificationSettingsSchema
>;

export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
