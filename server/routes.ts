import {
  insertAffiliateLinkSchema,
  insertAppSchema,
  insertConversionSchema,
  loginSchema,
  PLAN_LIMITS,
  registerSchema,
  SubscriptionPlan,
  UserRole,
} from "@shared/schema";
import { randomBytes } from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import multer from "multer";
import { z } from "zod";
import { AffiliateLink, App, Conversion, Organization, User } from "./models";
import MarketerApplication from "./models/MarketerApplication";
import { MongoStorage } from "./mongoStorage";
import { setupPaymentRoutes } from "./services/payment";
import { handleTrialExpiry, setTrialEndDate } from "./services/subscription";
import { IStorage } from "./storage";
import {
  sendMarketerApprovalEmail,
  sendMarketerInvitationEmail,
  sendMarketerRejectionEmail,
} from "./utils/email";
import { uploadFile } from "./utils/fileUpload";
import {
  generatePasswordResetToken,
  removePasswordResetToken,
  verifyPasswordResetToken,
} from "./utils/token";

// Onboarding schema
const onboardingSchema = z.object({
  position: z.string().min(1, { message: "Position is required" }),
  industry: z.string().min(1, { message: "Industry is required" }),
  companySize: z.string().min(1, { message: "Company size is required" }),
  signingFrequency: z
    .string()
    .min(1, { message: "Signing frequency is required" }),
  creationFrequency: z
    .string()
    .min(1, { message: "Creation frequency is required" }),
});

const JWT_SECRET =
  process.env.JWT_SECRET || "affiliate-hub-secret-key-change-in-production";
const TOKEN_EXPIRY = "7d";

// Initialize the MongoDB storage
const storage: IStorage = new MongoStorage();

interface JwtPayload {
  userId?: string;
  id?: string;
  sub?: string;
  organizationId?: string | null;
  role?: string;
}

// Middleware to authenticate requests
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // For debugging token contents
    console.log("Token decoded:", decoded);

    // Accept any identifier from the token
    const userId = decoded.userId || decoded.id || decoded.sub;

    // Add user info to request object
    (req as any).user = {
      id: userId,
      userId: userId, // Add userId for consistency
      organizationId: decoded.organizationId,
      role: decoded.role,
    };

    // Check if the user belongs to an organization and has admin role
    if (decoded.organizationId && decoded.role === UserRole.ADMIN) {
      // Check if trial has expired and handle it if needed
      await handleTrialExpiry(decoded.organizationId);
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check authorization
const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Middleware specifically for management role (system administrators)
const requireManagement = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (user.role !== UserRole.MANAGEMENT) {
    return res.status(403).json({ message: "Management access required" });
  }

  next();
};

// Generate a JWT token
const generateToken = (user: {
  id: number;
  organizationId: number | null;
  role: string;
}): string => {
  const payload = {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export async function registerRoutes(
  app: Express,
  apiRouter?: any
): Promise<Server> {
  // Determine which router to use for API routes
  const router = apiRouter || app;

  // Ensure all API responses are JSON
  router.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
  });

  // Set up payment routes on main app
  setupPaymentRoutes(app);

  // Management dashboard routes (system admin only)
  router.get(
    "/management/users",
    authenticate,
    requireManagement,
    async (req, res) => {
      try {
        // Get all users in the system
        const users = await User.find().sort({ createdAt: -1 });
        return res.json(
          users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            organizationId: user.organizationId,
            createdAt: user.createdAt,
          }))
        );
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    "/management/organizations",
    authenticate,
    requireManagement,
    async (req, res) => {
      try {
        // Get all organizations in the system
        const organizations = await Organization.find().sort({ createdAt: -1 });
        return res.json(
          organizations.map((org) => ({
            id: org._id,
            name: org.name,
            email: org.email,
            plan: org.plan,
            createdAt: org.createdAt,
            trialEndsAt: org.trialEndsAt,
            onboardingCompleted: org.onboardingCompleted,
          }))
        );
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  router.get(
    "/management/analytics",
    authenticate,
    requireManagement,
    async (req, res) => {
      try {
        // Get platform-wide analytics
        const userCount = await User.countDocuments();
        const organizationCount = await Organization.countDocuments();
        const appCount = await App.countDocuments();
        const linkCount = await AffiliateLink.countDocuments();
        const conversionCount = await Conversion.countDocuments();

        // Active users by role
        const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
        const marketerCount = await User.countDocuments({
          role: UserRole.MARKETER,
        });

        // Plan distribution
        const freeTrial = await Organization.countDocuments({
          plan: SubscriptionPlan.FREE_TRIAL,
        });
        const starter = await Organization.countDocuments({
          plan: SubscriptionPlan.STARTER,
        });
        const growth = await Organization.countDocuments({
          plan: SubscriptionPlan.GROWTH,
        });
        const pro = await Organization.countDocuments({
          plan: SubscriptionPlan.PRO,
        });
        const enterprise = await Organization.countDocuments({
          plan: SubscriptionPlan.ENTERPRISE,
        });

        return res.json({
          userCount,
          organizationCount,
          appCount,
          linkCount,
          conversionCount,
          usersByRole: {
            admin: adminCount,
            marketer: marketerCount,
          },
          organizationsByPlan: {
            freeTrial,
            starter,
            growth,
            pro,
            enterprise,
          },
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // User actions (suspend, activate, change role)
  router.patch(
    "/management/users/:userId",
    authenticate,
    requireManagement,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { status, role } = req.body;

        const updates: any = {};
        if (status) updates.status = status;
        if (role) updates.role = role;

        const user = await User.findByIdAndUpdate(
          userId,
          { $set: updates },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        return res.json({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Authentication routes

  // Forgot password route - initiates the password reset
  router.post("/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      // If no user found, return success anyway for security reasons
      if (!user || !user.id) {
        return res.status(200).json({
          message:
            "If your email exists in our system, you will receive a password reset link shortly",
        });
      }

      // Generate password reset token
      const resetToken = generatePasswordResetToken(user.id);

      // Build reset URL
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const resetUrl = `${baseUrl}/reset-password?id=${user.id}&token=${resetToken}`;

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(
        user,
        resetToken,
        resetUrl
      );

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${user.email}`);
        return res
          .status(500)
          .json({ message: "Failed to send password reset email" });
      }

      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link shortly",
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      return res
        .status(500)
        .json({ message: "An error occurred processing your request" });
    }
  });

  // Reset password route - validates token and resets password
  router.post("/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { userId, token, newPassword } = req.body;

      if (!userId || !token || !newPassword) {
        return res
          .status(400)
          .json({ message: "User ID, token, and new password are required" });
      }

      // Validate token
      const isValidToken = verifyPasswordResetToken(userId, token);

      if (!isValidToken) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Find user
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's password
      await storage.updateUser(userId, {
        password: newPassword, // Note: Storage layer should handle password hashing
      });

      // Remove the used token
      removePasswordResetToken(userId);

      // Send confirmation email
      await sendPasswordResetSuccessEmail(user);

      return res
        .status(200)
        .json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      return res
        .status(500)
        .json({ message: "An error occurred processing your request" });
    }
  });

  // Verify password reset token route - checks if a token is valid
  router.post(
    "/auth/verify-reset-token",
    async (req: Request, res: Response) => {
      try {
        const { userId, token } = req.body;

        if (!userId || !token) {
          return res
            .status(400)
            .json({ message: "User ID and token are required" });
        }

        // Validate token
        const isValidToken = verifyPasswordResetToken(userId, token);

        if (!isValidToken) {
          return res.status(401).json({ message: "Invalid or expired token" });
        }

        return res.status(200).json({ valid: true });
      } catch (error: any) {
        console.error("Verify reset token error:", error);
        return res
          .status(500)
          .json({ message: "An error occurred processing your request" });
      }
    }
  );

  router.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // In a real app, you would use bcrypt.compare here
      // For this implementation, we're using a simple hash check in the storage layer
      const isPasswordValid = await storage.verifyPassword(
        validatedData.password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token - use toString() for MongoDB ObjectIDs
      // Handle different types of user objects (from MongoDB or from MemStorage)
      const tokenPayload = {
        id: user._id
          ? user._id.toString()
          : user.id
          ? user.id.toString()
          : null,
        organizationId: user.organizationId
          ? user.organizationId.toString()
          : null,
        role: user.role,
      };

      console.log("Generating token with payload:", tokenPayload);
      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY,
      });

      // Return user info and token
      return res.json({
        token,
        user: {
          id: user._id ? user._id.toString() : user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          status: user.status,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.post("/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Check if organization with this email already exists
      const existingOrg = await storage.getOrganizationByEmail(
        validatedData.email
      );

      if (existingOrg) {
        return res
          .status(400)
          .json({ message: "Email already in use for an organization" });
      }

      // Create organization with free trial plan
      const organization = await storage.createOrganization({
        name: validatedData.organizationName,
        email: validatedData.email,
        plan: SubscriptionPlan.FREE_TRIAL,
      });

      // Set trial end date (7 days from now)
      await setTrialEndDate(organization.id);

      // Create admin user
      const user = await storage.createUser({
        organizationId: organization.id,
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: UserRole.ADMIN,
        status: "active",
      });

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        organizationId: user.organizationId,
        role: user.role,
      });

      // Create initial activity
      await storage.createActivity({
        organizationId: organization.id,
        userId: user.id,
        type: "organization_created",
        description: `${user.name} created organization ${organization.name}`,
      });

      // Return user info and token
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.get("/auth/me", authenticate, async (req, res) => {
    try {
      // Log the entire decoded token for debugging
      console.log("Auth/me request - Full token data:", (req as any).user);

      // Try to get user ID from various possible properties in the token
      const userId = (req as any).user.id || (req as any).user.sub;

      // Log user identification for debugging
      console.log("Auth/me request - User ID from token:", userId);

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Invalid token - no user identifier found" });
      }

      // Get user details - try both storage and direct MongoDB query
      let user = null;

      try {
        // First try the storage service
        user = await storage.getUser(userId);
      } catch (err) {
        console.log("Error getting user from storage:", err);
      }

      // If not found in storage, try direct MongoDB query
      if (!user) {
        try {
          user = await User.findById(userId);

          if (user) {
            user = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status || "active",
              organizationId: user.organizationId,
              avatar: user.avatar,
            };
          }
        } catch (err) {
          console.log("Error getting user from MongoDB:", err);
        }
      }

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get organization details if applicable
      let organization = null;
      if (user.organizationId) {
        try {
          organization = await storage.getOrganization(user.organizationId);
        } catch (err) {
          console.log("Error getting organization from storage:", err);

          // Try direct MongoDB query if storage fails
          try {
            const orgDoc = await Organization.findById(user.organizationId);
            if (orgDoc) {
              organization = {
                id: orgDoc._id.toString(),
                name: orgDoc.name,
                plan: orgDoc.plan,
                logo: orgDoc.logo,
              };
            }
          } catch (orgErr) {
            console.log("Error getting organization from MongoDB:", orgErr);
          }
        }
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status || "active",
          avatar: user.avatar,
        },
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
              plan: organization.plan,
              logo: organization.logo,
            }
          : null,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Organization routes
  app.get("/api/organizations/current", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const organization = await storage.getOrganization(organizationId);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      return res.json(organization);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.patch(
    "/api/organizations/current",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(404)
            .json({ message: "No organization associated with this user" });
        }

        const organization = await storage.updateOrganization(
          organizationId,
          req.body
        );

        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        return res.json(organization);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Onboarding route for organizations
  app.post(
    "/api/organizations/onboarding",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(404)
            .json({ message: "No organization associated with this user" });
        }

        // Validate onboarding data
        const validatedData = onboardingSchema.parse(req.body);

        // Update organization with onboarding data
        const organization = await storage.updateOrganization(organizationId, {
          position: validatedData.position,
          industry: validatedData.industry,
          companySize: validatedData.companySize,
          signingFrequency: validatedData.signingFrequency,
          creationFrequency: validatedData.creationFrequency,
          onboardingCompleted: true,
        });

        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Create activity for completed onboarding
        await storage.createActivity({
          organizationId,
          userId: (req as any).user.id,
          type: "onboarding_completed",
          description: "Organization completed the onboarding process",
        });

        return res.json({
          success: true,
          message: "Onboarding completed successfully",
          organization,
        });
      } catch (error: any) {
        console.error("Onboarding error:", error);
        return res.status(error.status || 500).json({
          message: error.message || "An error occurred during onboarding",
        });
      }
    }
  );

  // User/Marketer routes
  router.get(
    "/marketers",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(404)
            .json({ message: "No organization associated with this user" });
        }

        // Fetch users with MARKETER role from User table
        const users = await storage.getUsersByOrganization(organizationId);
        const approvedMarketers = users
          .filter((user) => user.role === UserRole.MARKETER)
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            role: user.role,
            createdAt: user.createdAt,
            source: "user",
          }));

        // Fetch invited and pending marketers from MarketerApplication table
        const marketerApplications = await storage.getMarketerApplications({
          organizationId,
          status: { $in: ["invited", "pending"] },
        });

        const invitedMarketers = marketerApplications.map((app) => ({
          id: app._id.toString(),
          name: app.name,
          email: app.email,
          phone: app.phone,
          status: app.status,
          role: UserRole.MARKETER,
          createdAt: app.applicationDate,
          source: "application",
        }));

        // Combine and sort marketers by createdAt (newest first)
        const allMarketers = [...approvedMarketers, ...invitedMarketers].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return res.json(allMarketers);
      } catch (error: any) {
        console.error("Error fetching marketers:", error);
        return res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  app.post(
    "/api/marketers",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(404)
            .json({ message: "No organization associated with this user" });
        }

        // Check plan limits
        const organization = await storage.getOrganization(organizationId);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const marketers = await storage.getUsersByOrganization(organizationId);
        const marketerCount = marketers.filter(
          (u) => u.role === UserRole.MARKETER
        ).length;

        const planLimits = PLAN_LIMITS[organization.plan as SubscriptionPlan];
        if (marketerCount >= planLimits.marketers) {
          return res.status(403).json({
            message: `Your plan allows a maximum of ${planLimits.marketers} marketers. Please upgrade your plan.`,
          });
        }

        // Generate a random password for the marketer
        const temporaryPassword = randomBytes(8).toString("hex");

        // Create marketer
        const marketer = await storage.createUser({
          organizationId,
          name: req.body.name,
          email: req.body.email,
          password: temporaryPassword,
          role: UserRole.MARKETER,
          status: "pending",
        });

        // Create activity
        await storage.createActivity({
          organizationId,
          userId: (req as any).user.id,
          type: "marketer_invited",
          description: `${req.body.name} invited as a new marketer`,
        });

        // In a real app, you would send an email with the invitation link here

        return res.status(201).json({
          marketer: {
            id: marketer.id,
            name: marketer.name,
            email: marketer.email,
            status: marketer.status,
          },
          inviteLink: `${req.protocol}://${req.get(
            "host"
          )}/marketer/accept-invite?email=${
            marketer.email
          }&token=${temporaryPassword}`,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    }
  );

  router.get("/marketers/top", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const topMarketers = await storage.getTopMarketers(organizationId, limit);

      return res.json(topMarketers);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // App routes
  router.get("/apps", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const apps = await storage.getAppsByOrganization(organizationId);

      return res.json(apps);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/apps",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(404)
            .json({ message: "No organization associated with this user" });
        }

        // Check plan limits
        const organization = await storage.getOrganization(organizationId);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        const apps = await storage.getAppsByOrganization(organizationId);

        const planLimits = PLAN_LIMITS[organization.plan as SubscriptionPlan];
        if (apps.length >= planLimits.apps) {
          return res.status(403).json({
            message: `Your plan allows a maximum of ${planLimits.apps} apps. Please upgrade your plan.`,
          });
        }

        // Validate app data
        const validatedData = insertAppSchema.parse({
          ...req.body,
          organizationId,
        });

        // Create app
        const app = await storage.createApp(validatedData);

        // Create activity
        await storage.createActivity({
          organizationId,
          userId: (req as any).user.id,
          type: "app_created",
          description: `New app "${app.name}" created`,
        });

        return res.status(201).json(app);
      } catch (error: any) {
        return res.status(400).json({ message: error.message });
      }
    }
  );

  router.get("/apps/top", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const topProducts = await storage.getTopProducts(organizationId, limit);

      return res.json(topProducts);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Affiliate links routes
  router.get("/affiliate-links", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      const links = await storage.getAffiliateLinksByUser(userId);

      return res.json(links);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.post("/affiliate-links", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      // Validate app exists and belongs to the organization
      const app = await storage.getApp(req.body.appId);

      if (!app || app.organizationId !== organizationId) {
        return res.status(404).json({ message: "App not found" });
      }

      // Generate a unique code for the link
      const code = randomBytes(6).toString("hex");

      // Create the link
      const validatedData = insertAffiliateLinkSchema.parse({
        userId,
        appId: app.id,
        code,
      });

      const link = await storage.createAffiliateLink(validatedData);

      // Create activity
      await storage.createActivity({
        organizationId,
        userId,
        type: "affiliate_link_created",
        description: `New affiliate link created for "${app.name}"`,
      });

      return res.status(201).json(link);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.get("/affiliate-links/:code/redirect", async (req, res) => {
    try {
      const { code } = req.params;

      // Find the link by code
      const link = await storage.getAffiliateLinkByCode(code);

      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }

      // Get the app details
      const app = await storage.getApp(link.appId);

      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      // Increment click count
      await storage.incrementLinkClicks(link.id);

      // In a real implementation, you might want to track more information about the click

      // Redirect to the app URL
      return res.redirect(`${app.baseUrl}?ref=${link.code}`);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Conversions routes
  router.post("/webhooks/conversions", async (req, res) => {
    try {
      // In a real implementation, you would verify the webhook signature
      // and perform additional validation

      const { code, transactionId, amount } = req.body;

      if (!code || !transactionId || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find the link by code
      const link = await storage.getAffiliateLinkByCode(code);

      if (!link) {
        return res.status(404).json({ message: "Affiliate link not found" });
      }

      // Get the app details
      const app = await storage.getApp(link.appId);

      if (!app) {
        return res.status(404).json({ message: "App not found" });
      }

      // Calculate commission
      let commission = 0;
      if (app.commissionType === "percentage") {
        commission = (app.commissionValue / 100) * amount;
      } else {
        commission = app.commissionValue;
      }

      // Create conversion
      const validatedData = insertConversionSchema.parse({
        linkId: link.id,
        transactionId,
        amount,
        commission,
        status: "pending",
        metadata: req.body,
      });

      const conversion = await storage.createConversion(validatedData);

      // Get user and organization info
      const user = await storage.getUser(link.userId);
      const organization = user?.organizationId
        ? await storage.getOrganization(user.organizationId)
        : null;

      // Create activity
      if (user && organization) {
        await storage.createActivity({
          organizationId: organization.id,
          userId: user.id,
          type: "conversion_created",
          description: `New conversion for "${app.name}" - $${amount.toFixed(
            2
          )}`,
        });

        // In a real implementation, you might want to send a notification to the user

        // Call the organization webhook if configured
        if (organization.webhookUrl) {
          try {
            // In a real implementation, you would use axios to call the webhook
            console.log(
              `Would call webhook at ${organization.webhookUrl} with conversion data`
            );
          } catch (webhookError) {
            console.error("Webhook delivery failed:", webhookError);
          }
        }
      }

      return res.status(201).json(conversion);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.get("/conversions", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const role = (req as any).user.role;
      const organizationId = (req as any).user.organizationId;

      let conversions = [];

      if (role === UserRole.ADMIN && organizationId) {
        // Admins see all conversions for their organization
        conversions = await storage.getConversionsByOrganization(
          organizationId
        );
      } else {
        // Marketers see only their own conversions
        conversions = await storage.getConversionsByUser(userId);
      }

      return res.json(conversions);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Analytics routes
  router.get("/analytics/organization", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const stats = await storage.getOrganizationStats(organizationId);

      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.get("/analytics/user", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      const stats = await storage.getUserStats(userId);

      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Activities routes
  router.get("/activities", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(404)
          .json({ message: "No organization associated with this user" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivitiesByOrganization(
        organizationId,
        limit
      );

      return res.json(activities);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Payment routes (simplified)
  app.post("/api/payouts/request", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      const { amount, paymentMethod } = req.body;

      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create payout
      const payout = await storage.createPayout({
        userId,
        amount,
        status: "pending",
        paymentMethod,
      });

      // In a real implementation, you would integrate with payment providers here

      return res.status(201).json(payout);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/payouts", authenticate, async (req, res) => {
    try {
      const userId = (req as any).user.id;

      const payouts = await storage.getPayoutsByUser(userId);

      return res.json(payouts);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Set up payment routes for subscription plans
  setupPaymentRoutes(app);

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept documents (PDF, DOC, DOCX), images (JPEG, PNG), and common spreadsheet formats
      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, XLS and XLSX files are allowed."
          )
        );
      }
    },
  });

  // Marketer Application Routes

  // Invite a new marketer (organization admins only)
  router.post(
    "/marketer-applications/invite",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const { name, email, phone } = req.body;

        if (!name || !email) {
          return res
            .status(400)
            .json({ message: "Name and email are required" });
        }

        // Get the organization from the authenticated user
        const organizationId = (req as any).user.organizationId;
        const userId = (req as any).user.id;

        if (!organizationId) {
          return res
            .status(400)
            .json({ message: "User is not associated with an organization" });
        }

        // Check if this email is already used by another marketer application
        const existingApplication = await MarketerApplication.findOne({
          email,
        });
        if (existingApplication) {
          return res
            .status(400)
            .json({ message: "An application with this email already exists" });
        }

        // Check if user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "A user with this email already exists" });
        }

        // Get the organization details
        const organization = await Organization.findById(organizationId);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Check if the organization is on a paid plan (or has slots available in free trial)
        if (organization.plan === SubscriptionPlan.FREE_TRIAL) {
          // Check if they've reached the limit for marketers in free trial
          const currentMarketers = await User.countDocuments({
            organizationId: organizationId,
            role: UserRole.MARKETER,
          });

          if (
            currentMarketers >=
            PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].marketers
          ) {
            return res.status(403).json({
              message:
                "You've reached the maximum number of marketers for your trial plan. Please upgrade your subscription.",
            });
          }
        }

        // Generate a random token for the invitation link
        const applicationToken = randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 7); // Token valid for 7 days

        // Create the marketer application
        const application = await MarketerApplication.create({
          name,
          email,
          phone: phone || "",
          organizationId,
          invitedBy: userId,
          applicationDate: new Date(),
          status: "invited",
          applicationToken,
          tokenExpiry,
        });

        // Generate the invitation URL
        const baseUrl =
          process.env.NODE_ENV === "production"
            ? `https://${req.get("host")}`
            : `http://localhost:5000`;

        const invitationUrl = `${baseUrl}/apply/marketer/${applicationToken}`;

        // Send the invitation email
        await sendMarketerInvitationEmail(
          application,
          organization,
          invitationUrl
        );

        // Create activity record
        await storage.createActivity({
          organizationId,
          userId,
          type: "marketer_invited",
          description: `${
            (req as any).user.name || "Admin"
          } invited ${name} as a marketer`,
        });

        return res.status(201).json({
          message: "Invitation sent successfully",
          application: {
            id: application._id,
            name: application.name,
            phone: application.phone,
            email: application.email,
            status: application.status,
            applicationDate: application.applicationDate,
          },
        });
      } catch (error: any) {
        console.error("Error inviting marketer:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Get all marketer applications for an organization
  router.get(
    "/marketer-applications",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const organizationId = (req as any).user.organizationId;
        const { status } = req.query;

        let query: any = { organizationId };

        // Add status filter if provided
        if (
          status &&
          ["invited", "pending", "approved", "rejected"].includes(
            status as string
          )
        ) {
          query.status = status;
        }

        const applications = await MarketerApplication.find(query).sort({
          applicationDate: -1,
        });

        return res.json(
          applications.map((app) => ({
            id: app._id,
            name: app.name,
            email: app.email,
            phone: app.phone,
            status: app.status,
            applicationDate: app.applicationDate,
            resumeUrl: app.resumeUrl,
            kycDocUrl: app.kycDocUrl,
            socialMedia: app.socialMedia,
            experience: app.experience,
            skills: app.skills,
            reviewedAt: app.reviewedAt,
            reviewNotes: app.reviewNotes,
          }))
        );
      } catch (error: any) {
        console.error("Error fetching marketer applications:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Get a specific marketer application
  router.get(
    "/marketer-applications/:id",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const organizationId = (req as any).user.organizationId;

        const application = await MarketerApplication.findOne({
          _id: id,
          organizationId,
        });

        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }

        return res.json({
          id: application._id,
          name: application.name,
          email: application.email,
          phone: application.phone,
          status: application.status,
          applicationDate: application.applicationDate,
          resumeUrl: application.resumeUrl,
          kycDocUrl: application.kycDocUrl,
          socialMedia: application.socialMedia,
          experience: application.experience,
          skills: application.skills,
          reviewedAt: application.reviewedAt,
          reviewNotes: application.reviewNotes,
        });
      } catch (error: any) {
        console.error("Error fetching marketer application:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Verify application token (public route)
  router.get(
    "/marketer-applications/verify/:token",
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;

        // Find application by token
        const application = await MarketerApplication.findOne({
          applicationToken: token,
          tokenExpiry: { $gt: new Date() }, // Token not expired
        });

        if (!application) {
          return res
            .status(404)
            .json({ message: "Invalid or expired invitation" });
        }

        // Get organization details
        const organization = await Organization.findById(
          application.organizationId
        );

        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        return res.json({
          valid: true,
          application: {
            id: application._id,
            name: application.name,
            email: application.email,
            organization: {
              name: organization.name,
              id: organization._id,
            },
          },
        });
      } catch (error: any) {
        console.error("Error verifying application token:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Submit application (public route)
  router.post(
    "/marketer-applications/submit/:token",
    upload.fields([
      { name: "resume", maxCount: 1 },
      { name: "kycDocument", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const { experience, skills, twitter, instagram, linkedin, facebook } =
          req.body;

        // Find application by token
        const application = await MarketerApplication.findOne({
          applicationToken: token,
          tokenExpiry: { $gt: new Date() }, // Token not expired
        });

        if (!application) {
          return res
            .status(404)
            .json({ message: "Invalid or expired invitation" });
        }

        // Update application status
        application.status = "pending";
        application.experience = experience;
        application.skills = skills
          ? skills.split(",").map((s: string) => s.trim())
          : [];

        // Add social media links if provided
        application.socialMedia = {
          twitter: twitter || undefined,
          instagram: instagram || undefined,
          linkedin: linkedin || undefined,
          facebook: facebook || undefined,
        };

        // Upload resume if provided
        if (files.resume && files.resume[0]) {
          const resumeFile = files.resume[0];
          const resumeFileName = `organizations/${
            application.organizationId
          }/marketers/${application._id}/resume-${Date.now()}-${
            resumeFile.originalname
          }`;

          const resumeUrl = await uploadFile(
            resumeFile.buffer,
            resumeFileName,
            resumeFile.mimetype
          );

          application.resumeUrl = resumeUrl;
        }

        // Upload KYC document if provided
        if (files.kycDocument && files.kycDocument[0]) {
          const kycFile = files.kycDocument[0];
          const kycFileName = `organizations/${
            application.organizationId
          }/marketers/${application._id}/kyc-${Date.now()}-${
            kycFile.originalname
          }`;

          const kycDocUrl = await uploadFile(
            kycFile.buffer,
            kycFileName,
            kycFile.mimetype
          );

          application.kycDocUrl = kycDocUrl;
        }

        await application.save();

        // Get organization for activity
        const organization = await Organization.findById(
          application.organizationId
        );

        if (organization) {
          // Create activity record
          await storage.createActivity({
            organizationId: application.organizationId,
            type: "marketer_applied",
            description: `${application.name} submitted their application to ${organization.name}`,
          });
        }

        return res.status(200).json({
          message: "Application submitted successfully",
          application: {
            id: application._id,
            name: application.name,
            email: application.email,
            status: application.status,
          },
        });
      } catch (error: any) {
        console.error("Error submitting application:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Review marketer application (approve/reject)
  router.post(
    "/marketer-applications/:id/review",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { approved, notes } = req.body;
        const organizationId = (req as any).user.organizationId;
        const reviewerId = (req as any).user.id;

        if (approved === undefined) {
          return res
            .status(400)
            .json({ message: "'approved' field is required" });
        }

        // Find the application
        const application = await MarketerApplication.findOne({
          _id: id,
          organizationId,
          status: "pending", // Only pending applications can be reviewed
        });

        if (!application) {
          return res
            .status(404)
            .json({
              message: "Application not found or not in pending status",
            });
        }

        // Get the organization
        const organization = await Organization.findById(organizationId);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        // Update the application status
        application.status = approved ? "approved" : "rejected";
        application.reviewedBy = reviewerId;
        application.reviewedAt = new Date();
        application.reviewNotes = notes || "";

        // If approved, create a user account for the marketer
        if (approved) {
          // Check if the organization has reached its marketer limit
          const currentMarketers = await User.countDocuments({
            organizationId: organizationId,
            role: UserRole.MARKETER,
          });

          const planLimit = PLAN_LIMITS[organization.plan].marketers;

          if (currentMarketers >= planLimit) {
            return res.status(403).json({
              message: `You've reached the maximum number of marketers (${planLimit}) for your plan. Please upgrade your subscription.`,
            });
          }

          // Generate a random password for the new user
          const tempPassword = randomBytes(8).toString("hex");

          // Create the user
          const user = await User.create({
            name: application.name,
            email: application.email,
            password: tempPassword, // This will be hashed by the User model pre-save hook
            role: UserRole.MARKETER,
            organizationId: application.organizationId,
            status: "active",
          });

          // Link the user to the application
          application.user = user._id;

          // Send approval email with password
          await sendMarketerApprovalEmail(application, organization);

          // Create activity
          await storage.createActivity({
            organizationId,
            userId: reviewerId,
            type: "marketer_approved",
            description: `${(req as any).user.name || "Admin"} approved ${
              application.name
            } as a marketer`,
          });
        } else {
          // Send rejection email
          await sendMarketerRejectionEmail(application, organization, notes);

          // Create activity
          await storage.createActivity({
            organizationId,
            userId: reviewerId,
            type: "marketer_rejected",
            description: `${(req as any).user.name || "Admin"} rejected ${
              application.name
            }'s application`,
          });
        }

        await application.save();

        return res.json({
          message: approved
            ? "Application approved successfully"
            : "Application rejected",
          application: {
            id: application._id,
            name: application.name,
            email: application.email,
            status: application.status,
            reviewedAt: application.reviewedAt,
          },
        });
      } catch (error: any) {
        console.error("Error reviewing application:", error);
        return res.status(500).json({ message: error.message });
      }
    }
  );

  // Invite a new marketer (organization admins only)
  app.post(
    "/api/marketers/invite",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(403)
            .json({ message: "Only organization admins can invite marketers" });
        }

        const user = await storage.getUser(userId);
        const organization = await storage.getOrganization(organizationId);

        if (!user || !organization) {
          return res
            .status(404)
            .json({ message: "User or organization not found" });
        }

        const existingApplications = await storage.getMarketerApplications({
          organizationId,
          email,
        });

        if (existingApplications.length > 0) {
          const existingApp = existingApplications[0];
          const baseUrl =
            process.env.NODE_ENV === "production"
              ? "https://growvia.com"
              : `http://${req.hostname}:5000`;
          const invitationUrl = `${baseUrl}/marketer/onboarding/${existingApp.applicationToken}`;

          return res.status(200).json({
            message: "Marketer already invited",
            application: existingApp,
            inviteLink: invitationUrl,
          });
        }

        const application = await storage.createMarketerApplication({
          name,
          email,
          phone,
          organizationId,
          invitedBy: userId,
          status: "invited",
          applicationToken: randomBytes(32).toString("hex"),
        });

        const baseUrl =
          process.env.NODE_ENV === "production"
            ? "https://growvia.com"
            : `http://${req.hostname}:5000`;
        const invitationUrl = `${baseUrl}/marketer/onboarding/${application.applicationToken}`;

        await sendMarketerInvitationEmail(
          application,
          organization,
          invitationUrl
        );

        await storage.createActivity({
          type: "marketer_invited",
          description: `${user.name} invited ${name} as a marketer`,
          organizationId,
          userId,
          metadata: { marketerEmail: email },
        });

        return res.status(201).json({
          message: "Marketer invitation sent successfully",
          application,
          inviteLink: invitationUrl,
        });
      } catch (error: any) {
        console.error("Error inviting marketer:", error);
        return res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );


  app.post(
    "/api/marketers/resend-invite",
    authenticate,
    authorize([UserRole.ADMIN]),
    async (req, res) => {
      try {
        const { email } = req.body;

        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;

        const existingApplications = await storage.getMarketerApplications({
          organizationId,
          email,
        });

        if (existingApplications.length === 0) {
          return res
            .status(404)
            .json({ message: "No existing invitation found for this email" });
        }

        const application = existingApplications[0];
        const organization = await storage.getOrganization(organizationId);

        const baseUrl =
          process.env.NODE_ENV === "production"
            ? `https://growvia.com`
            : `http://${req.hostname}:5000`;

        const invitationUrl = `${baseUrl}/marketer/onboarding/${application.applicationToken}`;

        await sendMarketerInvitationEmail(
          application,
          organization,
          invitationUrl
        );

        return res.status(200).json({
          message: "Invitation resent successfully",
          application,
          inviteLink: invitationUrl,
        });
      } catch (error: any) {
        console.error("Error resending marketer invite:", error);
        return res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  // Get marketer application by token (for onboarding)
  app.get("/api/marketers/application/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res
          .status(400)
          .json({ message: "Application token is required" });
      }

      const application = await storage.getMarketerApplicationByToken(token);

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or token expired" });
      }

      return res.status(200).json({ application });
    } catch (error: any) {
      console.error("Error fetching marketer application:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Submit marketer application with resume and KYC document
  app.post("/api/marketers/application/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      const { experience, skills, socialMedia } = req.body;

      if (!token) {
        return res
          .status(400)
          .json({ message: "Application token is required" });
      }

      // Get the application
      const application = await storage.getMarketerApplicationByToken(token);

      if (!application) {
        return res
          .status(404)
          .json({ message: "Application not found or token expired" });
      }

      if (application.status !== "invited") {
        return res
          .status(400)
          .json({
            message: `Application is already in '${application.status}' status`,
          });
      }

      // Process file uploads if included in the request
      let resumeUrl = null;
      let kycDocUrl = null;

      if (req.files) {
        const files = req.files as any;

        if (files.resume) {
          const resumeFile = files.resume[0];
          resumeUrl = await uploadFile(
            resumeFile.buffer,
            `resume_${application._id}_${Date.now()}.${resumeFile.originalname
              .split(".")
              .pop()}`,
            resumeFile.mimetype
          );
        }

        if (files.kycDocument) {
          const kycFile = files.kycDocument[0];
          kycDocUrl = await uploadFile(
            kycFile.buffer,
            `kyc_${application._id}_${Date.now()}.${kycFile.originalname
              .split(".")
              .pop()}`,
            kycFile.mimetype
          );
        }
      }

      // Update the application
      const updatedApplication = await storage.updateMarketerApplication(
        application._id,
        {
          status: "pending",
          experience: experience || null,
          skills: skills || [],
          socialMedia: socialMedia || {},
          resumeUrl: resumeUrl || application.resumeUrl,
          kycDocUrl: kycDocUrl || application.kycDocUrl,
        }
      );

      // Create activity log
      await storage.createActivity({
        type: "marketer_application_submitted",
        description: `${application.name} submitted their marketer application`,
        organizationId: application.organizationId,
        metadata: { applicationId: application._id },
      });

      return res.status(200).json({
        message: "Application submitted successfully",
        application: updatedApplication,
      });
    } catch (error: any) {
      console.error("Error submitting marketer application:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Get all marketer applications for organization
  app.get("/api/marketers/applications", authenticate, async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;

      if (!organizationId) {
        return res
          .status(403)
          .json({ message: "Only organization users can view applications" });
      }

      const status = req.query.status as string;
      const email = req.query.email as string;

      // Fetch applications with optional filters
      const applications = await storage.getMarketerApplications({
        organizationId,
        ...(status && { status }),
        ...(email && { email }),
      });

      return res.status(200).json(applications);
    } catch (error: any) {
      console.error("Error fetching marketer applications:", error);
      return res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  });

  // Review marketer application (approve/reject)
  app.post(
    "/api/marketers/applications/:id/review",
    authenticate,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { approved, notes } = req.body;

        if (approved === undefined) {
          return res
            .status(400)
            .json({ message: "The 'approved' field is required" });
        }

        // Get the user info from authenticated request
        const userId = (req as any).user.id;
        const organizationId = (req as any).user.organizationId;

        if (!organizationId) {
          return res
            .status(403)
            .json({
              message: "Only organization admins can review applications",
            });
        }

        // Get the application
        const application = await storage.getMarketerApplication(id);

        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }

        // Check if application belongs to this organization
        if (
          application.organizationId.toString() !== organizationId.toString()
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized to review this application" });
        }

        // Check if application is in pending status
        if (application.status !== "pending") {
          return res
            .status(400)
            .json({
              message: `Application is not in 'pending' status (current status: ${application.status})`,
            });
        }

        // Review the application
        const updatedApplication = await storage.reviewMarketerApplication(
          id,
          approved,
          userId,
          notes
        );

        // Get the organization for email notification
        const organization = await storage.getOrganization(organizationId);

        // Send email based on the review decision
        if (approved) {
          await sendMarketerApprovalEmail(updatedApplication, organization);
        } else {
          await sendMarketerRejectionEmail(
            updatedApplication,
            organization,
            notes
          );
        }

        // Create activity log
        const reviewer = await storage.getUser(userId);
        await storage.createActivity({
          type: approved
            ? "marketer_application_approved"
            : "marketer_application_rejected",
          description: `${reviewer.name} ${
            approved ? "approved" : "rejected"
          } ${application.name}'s marketer application`,
          organizationId,
          userId,
          metadata: {
            applicationId: application._id,
            marketerEmail: application.email,
            notes,
          },
        });

        return res.status(200).json({
          message: `Application ${
            approved ? "approved" : "rejected"
          } successfully`,
          application: updatedApplication,
        });
      } catch (error: any) {
        console.error("Error reviewing marketer application:", error);
        return res
          .status(500)
          .json({ message: error.message || "Internal server error" });
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
