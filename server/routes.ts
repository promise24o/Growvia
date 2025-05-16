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
import { z } from "zod";
import { MongoStorage } from "./mongoStorage";
import { setupPaymentRoutes } from "./services/payment";
import { handleTrialExpiry, setTrialEndDate } from "./services/subscription";
import { IStorage } from "./storage";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "./utils/email";
import {
  generatePasswordResetToken,
  removePasswordResetToken,
  verifyPasswordResetToken,
} from "./utils/token";
import {
  User,
  Organization,
  App,
  AffiliateLink,
  Conversion
} from './models';

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
  next: NextFunction,
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
  apiRouter?: any,
): Promise<Server> {
  // Determine which router to use for API routes
  const router = apiRouter || app;

  // Set up payment routes on main app
  setupPaymentRoutes(app);
  
  // Management dashboard routes (system admin only)
  router.get("/management/users", authenticate, requireManagement, async (req, res) => {
    try {
      // Get all users in the system
      const users = await User.find().sort({ createdAt: -1 });
      return res.json(users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        createdAt: user.createdAt
      })));
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  router.get("/management/organizations", authenticate, requireManagement, async (req, res) => {
    try {
      // Get all organizations in the system
      const organizations = await Organization.find().sort({ createdAt: -1 });
      return res.json(organizations.map(org => ({
        id: org._id,
        name: org.name,
        email: org.email,
        plan: org.plan,
        createdAt: org.createdAt,
        trialEndsAt: org.trialEndsAt,
        onboardingCompleted: org.onboardingCompleted
      })));
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  router.get("/management/analytics", authenticate, requireManagement, async (req, res) => {
    try {
      // Get platform-wide analytics
      const userCount = await User.countDocuments();
      const organizationCount = await Organization.countDocuments();
      const appCount = await App.countDocuments();
      const linkCount = await AffiliateLink.countDocuments();
      const conversionCount = await Conversion.countDocuments();
      
      // Active users by role
      const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
      const marketerCount = await User.countDocuments({ role: UserRole.MARKETER });
      
      // Plan distribution
      const freeTrial = await Organization.countDocuments({ plan: SubscriptionPlan.FREE_TRIAL });
      const starter = await Organization.countDocuments({ plan: SubscriptionPlan.STARTER });
      const growth = await Organization.countDocuments({ plan: SubscriptionPlan.GROWTH });
      const pro = await Organization.countDocuments({ plan: SubscriptionPlan.PRO });
      const enterprise = await Organization.countDocuments({ plan: SubscriptionPlan.ENTERPRISE });
      
      return res.json({
        userCount,
        organizationCount,
        appCount,
        linkCount,
        conversionCount,
        usersByRole: {
          admin: adminCount,
          marketer: marketerCount
        },
        organizationsByPlan: {
          freeTrial,
          starter,
          growth,
          pro,
          enterprise
        }
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
  
  // User actions (suspend, activate, change role)
  router.patch("/management/users/:userId", authenticate, requireManagement, async (req, res) => {
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
        status: user.status
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

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
        resetUrl,
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
    },
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
        user.password,
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token - use toString() for MongoDB ObjectIDs
      // Handle different types of user objects (from MongoDB or from MemStorage)
      const tokenPayload = {
        id: user._id ? user._id.toString() : (user.id ? user.id.toString() : null),
        organizationId: user.organizationId ? user.organizationId.toString() : null,
        role: user.role
      };
      
      console.log("Generating token with payload:", tokenPayload);
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

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
        validatedData.email,
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
        return res.status(401).json({ message: "Invalid token - no user identifier found" });
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
              status: user.status || 'active',
              organizationId: user.organizationId,
              avatar: user.avatar
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
                logo: orgDoc.logo
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
          status: user.status || 'active',
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
          req.body,
        );

        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }

        return res.json(organization);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
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
    },
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

        const users = await storage.getUsersByOrganization(organizationId);

        // Filter to only get marketers
        const marketers = users.filter(
          (user) => user.role === UserRole.MARKETER,
        );

        return res.json(marketers);
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
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
          (u) => u.role === UserRole.MARKETER,
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
          inviteLink: `${req.protocol}://${req.get("host")}/marketer/accept-invite?email=${marketer.email}&token=${temporaryPassword}`,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message });
      }
    },
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
    },
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
          description: `New conversion for "${app.name}" - $${amount.toFixed(2)}`,
        });

        // In a real implementation, you might want to send a notification to the user

        // Call the organization webhook if configured
        if (organization.webhookUrl) {
          try {
            // In a real implementation, you would use axios to call the webhook
            console.log(
              `Would call webhook at ${organization.webhookUrl} with conversion data`,
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
        conversions =
          await storage.getConversionsByOrganization(organizationId);
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
        limit,
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

  const httpServer = createServer(app);

  return httpServer;
}
