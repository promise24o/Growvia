import {
  loginSchema,
  registerSchema,
  SubscriptionPlan,
  UserRole,
} from "@shared/schema";
import { randomBytes } from "crypto";
import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "server/middleware/auth";
import { MongoStorage } from "../mongoStorage";
import emailQueue from "../queue/emailQueue";
import { setTrialEndDate } from "../services/subscription";
import { IStorage } from "../storage";
import {
  generatePasswordResetToken,
  generateToken,
  removePasswordResetToken,
  verifyEmailToken,
  verifyPasswordResetToken,
} from "../utils/token";

const storage: IStorage = new MongoStorage();
const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await storage.getUserByEmail(validatedData.email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "pending") {
      return res.status(403).json({ message: "User is not verified" });
    }

    const isPasswordValid = await storage.verifyPassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const tokenPayload = {
      id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
      organizationId: user.organizationId
        ? user.organizationId.map((id) => id.toString())
        : null,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    return res.json({
      token,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/register", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const validatedData = registerSchema.parse(req.body);
    const [existingUser, existingOrg] = await Promise.all([
      storage.getUserByEmail(validatedData.email),
      storage.getOrganizationByEmail(validatedData.email),
    ]);

    if (existingUser || existingOrg) {
      throw new Error("Email already in use");
    }

    const organization = await storage.createOrganization(
      {
        name: validatedData.organizationName,
        email: validatedData.email,
        plan: SubscriptionPlan.FREE_TRIAL,
      },
      {session}
    );

    await setTrialEndDate(organization.id, { session });

    const verificationToken = randomBytes(32).toString("hex");
    const verificationUrl = `${
      process.env.NODE_ENV === "production"
        ? "https://growvia.com"
        : "http://localhost:5000"
    }/verify-email?token=${verificationToken}`;

    const user = await storage.createUser(
      {
        organizationId: [organization.id],
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: UserRole.ADMIN,
        status: "pending",
        verificationToken,
      },
      { session }
    );

    await emailQueue.add({
      type: "email_verification",
      email: user.email,
      organizationName: organization.name,
      verificationUrl,
    });

    await storage.createActivity(
      {
        organizationId: organization.id,
        userId: user.id,
        type: "organization_created",
        description: `${user.name} created organization ${organization.name}`,
      },
      { session }
    );

    await session.commitTransaction();

    const token = generateToken({
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Registration error:", error);
    return res
      .status(400)
      .json({ message: error.message || "Registration failed" });
  } finally {
    session.endSession();
  }
});

router.post("/resend-verification", async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;
    if (!email) {
      throw new Error("Email required");
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.status !== "pending") {
      throw new Error("User is already verified");
    }

    const organizationId =
      user.organizationId && user.organizationId.length > 0
        ? user.organizationId[0]
        : null;
    if (!organizationId) {
      throw new Error("Organization not found");
    }

    const organization = await storage.getOrganization(
      organizationId.toString()
    );
    if (!organization) {
      throw new Error("Organization not found");
    }

    const verificationToken = randomBytes(32).toString("hex");
    const verificationUrl = `${
      process.env.NODE_ENV === "production"
        ? "https://growvia.com"
        : "http://localhost:5000"
    }/verify-email?token=${verificationToken}`;

    const updatedUser = await storage.updateUser(
      user._id.toString(),
      { verificationToken },
      { session }
    );

    if (!updatedUser) {
      throw new Error("Failed to update verification token");
    }

    await emailQueue.add({
      type: "email_verification",
      email: user.email,
      organizationName: organization.name,
      verificationUrl,
    });

    await storage.createActivity(
      {
        organizationId: organizationId,
        userId: user.id,
        type: "verification_email_resent",
        description: `Verification email resent for ${user.email}`,
      },
      { session }
    );

    await session.commitTransaction();
    return res.status(200).json({ message: "Verification email sent" });
  } catch (error: any) {
    await session.abortTransaction();
    console.error("Resend verification error:", error);
    return res.status(400).json({
      message: error.message || "Failed to resend verification email",
    });
  } finally {
    session.endSession();
  }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.id) {
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link shortly",
      });
    }

    const resetToken = generatePasswordResetToken(user.id);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password?id=${user.id}&token=${resetToken}`;

    await emailQueue.add({
      type: "password_reset",
      user,
      resetToken,
      resetUrl,
    });

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

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { userId, token, newPassword } = req.body;
    if (!userId || !token || !newPassword) {
      return res
        .status(400)
        .json({ message: "User ID, token, and new password are required" });
    }

    const isValidToken = verifyPasswordResetToken(userId, token);
    if (!isValidToken) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await storage.updateUser(userId, { password: newPassword });
    removePasswordResetToken(userId);

    await emailQueue.add({
      type: "password_reset_success",
      user,
    });

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

router.post("/verify-reset-token", async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res
        .status(400)
        .json({ message: "User ID and token are required" });
    }

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
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id || (req as any).user.sub;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Invalid token - no user identifier found" });
    }
    let user = await storage.getUser(userId);
    if (!user) {
      user = await storage.getUser(userId);
      if (user) {
        user = {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status || "active",
          organizationId: user.organizationId || [],
          avatar: user.avatar,
        };
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let organizations = [];
    if (user.organizationId && user.organizationId.length > 0) {
      for (const orgId of user.organizationId) {
        try {
          const organization = await storage.getOrganization(orgId.toString());
          if (organization) {
            organizations.push({
              id: organization.id,
              name: organization.name,
              plan: organization.plan,
              logo: organization.logo,
            });
          }
        } catch (err) {
          console.log("Error getting organization from storage:", err);
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
      organizations,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidToken = verifyEmailToken(token, user.verificationToken ?? "");
    if (!isValidToken) {
      return res.status(401).json({ message: "Invalid verification token" });
    }

    if (user.status === "active") {
      return res.status(400).json({ message: "Email already verified" });
    }

    const organizationId =
      user.organizationId && user.organizationId.length > 0
        ? user.organizationId[0]
        : null;
    if (!organizationId) {
      return res
        .status(400)
        .json({ message: "No organization associated with user" });
    }

    await storage.updateUser(user._id as string, {
      status: "active",
      verificationToken: null,
    });

    await storage.createActivity({
      organizationId,
      userId: user.id,
      type: "email_verified",
      description: `Email verified for ${user.email}`,
    });

    const tokenPayload = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    const authToken = generateToken(tokenPayload);

    return res.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: "active",
      },
      token: authToken,
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    return res
      .status(500)
      .json({ message: "An error occurred processing your request" });
  }
});

router.get("/auth/email-from-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ email: user.email });
  } catch (error: any) {
    console.error("Email from token error:", error);
    return res
      .status(500)
      .json({ message: "An error occurred processing your request" });
  }
});

export default router;
