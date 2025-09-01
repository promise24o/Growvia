import * as Sentry from '@sentry/node';
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Request, Response, Router } from "express";
import mongoose from "mongoose";
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { authenticate } from "server/middleware/auth";
import { GrowCoinTransaction } from "server/models/GrowCoinTransaction";
import { GrowCoinWallet } from "server/models/GrowCoinWallet";
import { Referral } from "server/models/Referral";
import { UserSession } from "server/models/UserSession";
import { auditLog } from "server/utils/auditLog";
import { generateBackupCodes, hashCodes, verifyBackupCode } from "server/utils/backupCodes";
import speakeasy from 'speakeasy';
import {
    loginSchema,
    registerSchema,
    SubscriptionPlan,
    UserRole,
} from "../../shared/schema";
import { MongoStorage } from "../mongoStorage";
import emailQueue from "../queue/emailQueue";
import { setTrialEndDate } from "../services/subscription.service";
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

// Apply Sentry request handler for this router
if (process.env.GLITCHTIP_DSN && Sentry.Handlers?.requestHandler) {
  router.use(Sentry.Handlers.requestHandler({
    serverName: false,
    user: ['id', 'username', 'email'],
    transaction: 'methodPath',
    flushTimeout: 2000,
  }));
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.requestHandler not available. Skipping request handler middleware.");
}

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

    if (user.twoFactorEnabled) {
      return res.json({
        twoFactorRequired: true,
        userId: user._id ? user._id.toString() : user.id,
      });
    }

    const tokenPayload = {
      id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
      organizationId: user.organizationId
        ? user.organizationId.map((id) => id.toString())
        : null,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    let location = 'Unknown';
    let ipAddress = 'Unknown';
    try {
      const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
      const data = await response.json();

      if (data.city && data.region && data.country) {
        location = `${data.city}, ${data.region}, ${data.country}`;
      }
      ipAddress = data?.ip || 'Unknown';
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          route: req.path,
          method: req.method,
          email: validatedData.email,
        },
      });
    }

    const session = await UserSession.create({
      userId: user._id,
      token,
      ipAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      location,
    });

    if (user.loginNotifications) {
      const origin = req.get("origin") || "https://www.growviapro.com";
      await emailQueue.add({
        type: "login_notification",
        email: user.email,
        name: user.name,
        location,
        ipAddress,
        loginTime: new Date().toISOString(),
        loginUrl: `${origin}/auth/login`,
        supportUrl: `${origin}/support`,
      });
    }

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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        email: req.body.email,
      },
    });
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

    let organization = null;
    if (validatedData.role === UserRole.ADMIN) {
      organization = await storage.createOrganization(
        {
          name: validatedData.organizationName,
          email: validatedData.email,
          plan: SubscriptionPlan.FREE_TRIAL,
        },
        { session }
      );
      await setTrialEndDate(organization.id, { session });
    }

    const verificationToken = randomBytes(32).toString("hex");
    const origin = req.get("origin") || "https://www.growviapro.com";
    const verificationUrl = `${origin}/auth/verify-email?token=${verificationToken}`;

    const user = await storage.createUser(
      {
        organizationId: organization ? [organization.id] : [],
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: validatedData.role || UserRole.MARKETER,
        status: "pending",
        verificationToken,
      },
      { session }
    );

    await emailQueue.add({
      type: "email_verification",
      email: user.email,
      organizationName: organization ? organization.name : validatedData.name,
      verificationUrl,
    });

    await storage.createActivity(
      {
        organizationId: organization ? organization.id : null,
        userId: user.id,
        type: validatedData.role === UserRole.ADMIN ? "organization_created" : "marketer_registered",
        description: validatedData.role === UserRole.ADMIN
          ? `${user.name} created organization ${organization?.name}`
          : `${user.name} registered as a marketer`,
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        email: req.body.email,
        role: req.body.role,
      },
    });
    return res
      .status(400)
      .json({ message: error.message || "Registration failed" });
  } finally {
    session.endSession();
  }
});

router.post('/register-v2', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const validatedData = registerSchema.parse(req.body);
    const [existingUser, existingOrg] = await Promise.all([
      storage.getUserByEmail(validatedData.email),
      storage.getOrganizationByEmail(validatedData.email),
    ]);

    if (existingUser || existingOrg) {
      throw new Error('Email already in use');
    }

    let organization = null;
    if (validatedData.role === UserRole.ADMIN) {
      organization = await storage.createOrganization(
        {
          name: validatedData.organizationName,
          email: validatedData.email,
          plan: SubscriptionPlan.FREE_TRIAL,
        },
        { session }
      );
      await setTrialEndDate(organization.id, { session });
    }

    const verificationToken = randomBytes(32).toString('hex');
    const origin = req.get('origin') || 'https://www.growviapro.com';
    const verificationUrl = `${origin}/auth/verify-email?token=${verificationToken}`;

    const user = await storage.createUser(
      {
        organizationId: organization ? [organization.id] : [],
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        role: validatedData.role || UserRole.MARKETER,
        status: 'pending',
        verificationToken,
      },
      { session }
    );

    // Create wallet for new user
    await GrowCoinWallet.create(
      [
        {
          userId: user.id,
          balance: 0,
          pendingBalance: validatedData.referrer && validatedData.role !== UserRole.ADMIN ? 3 : 0,
        },
      ],
      { session }
    );

    // Handle referral if referrer is provided
    let referral = null;
    if (validatedData.referrer) {
      const referrer = await storage.getUserByEmailOrUsername(validatedData.referrer);
      if (referrer && referrer.id.toString() !== user.id.toString()) {
        referral = await Referral.create(
          [
            {
              referrerId: referrer.id,
              referredId: user.id,
              type: validatedData.role === UserRole.ADMIN ? 'organization' : 'marketer',
              status: 'pending',
              organizationId: organization ? organization.id : undefined,
            },
          ],
          { session }
        );
      }
    }

    await emailQueue.add({
      type: 'email_verification',
      email: user.email,
      organizationName: organization ? organization.name : validatedData.name,
      verificationUrl,
      name: user.name,
    });

    await storage.createActivity(
      {
        organizationId: organization ? organization.id : null,
        userId: user.id,
        type: validatedData.role === UserRole.ADMIN ? 'organization_created' : 'marketer_registered',
        description: validatedData.role === UserRole.ADMIN
          ? `${user.name} created organization ${organization?.name}`
          : `${user.name} registered as a marketer`,
        metadata: referral ? { referralId: referral[0].id } : undefined,
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        email: req.body.email,
        role: req.body.role,
      },
    });
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

    const organization = await storage.getOrganization(
      organizationId?.toString() || ""
    );

    const verificationToken = randomBytes(32).toString("hex");
    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    const verificationUrl = `${origin}/auth/verify-email?token=${verificationToken}`;

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
      organizationName: organization ? organization.name : user.name,
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        email: req.body.email,
      },
    });
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
    if (!user) {
      return res.status(404).json({ message: "User with this email not found" });
    }

    const resetToken = generatePasswordResetToken(user._id.toString());
    const origin = req.get("origin") || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${origin}/auth/reset-password/change?id=${user._id}&token=${resetToken}`;

    await emailQueue.add({
      type: "password_reset",
      user,
      resetToken,
      resetUrl,
    });

    return res.status(200).json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        email: req.body.email,
      },
    });
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await storage.updateUser(userId, { password: hashedPassword });
    removePasswordResetToken(userId);

    await emailQueue.add({
      type: "password_reset_success",
      user,
    });

    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: req.body.userId,
      },
    });
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: req.body.userId,
      },
    });
    return res
      .status(500)
      .json({ message: "An error occurred processing your request" });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Invalid token - no user identifier found" });
    }
    let user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let responseData: any = {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        avatar: user.avatar,
      },
      organizations: [],
    };

    if (user.role === 'marketer') {
      responseData.user = {
        id: user._id.toString(),
        name: user.name,
        username: user.username || null,
        about: user.about || null,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country || null,
        state: user.state || null,
        loginNotifications: user.loginNotifications || false,
        twoFactorEnabled: user.twoFactorEnabled || false,
        languages: user.languages || [],
        industryFocus: user.industryFocus || null,
        organizationId: user.organizationId || [],
        avatar: user.avatar,
        status: user.status || "active",
        verificationToken: user.verificationToken || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        clicks: user.clicks || 0,
        conversions: user.conversions || 0,
        commission: user.commission || 0,
        payoutStatus: user.payoutStatus || "pending",
        assignedApps: user.assignedApps || [],
        socialMedia: user.socialMedia || {},
        skills: user.skills || [],
        backupCodeGenerated: user.backupCodes.length > 0 ? true : false
      };
    }

    if (user.organizationId && user.organizationId.length > 0) {
      for (const orgId of user.organizationId) {
        try {
          const organization = await storage.getOrganization(orgId.toString());
          if (organization) {
            responseData.organizations.push({
              id: organization._id.toString(),
              name: organization.name,
              plan: organization.plan,
              logo: organization.logo,
            });
          }
        } catch (err) {
          Sentry.captureException(err, {
            extra: {
              route: req.path,
              method: req.method,
              userId,
              organizationId: orgId.toString(),
            },
          });
        }
      }
    }

    return res.json(responseData);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
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

    if (user.role === 'admin' && !organizationId) {
      return res
        .status(400)
        .json({ message: "No organization associated with admin user" });
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        token: req.query.token,
      },
    });
    return res
      .status(500)
      .json({ message: "An error occurred processing your request" });
  }
});

router.get("/verify-email-v2", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid verification token');
    }

    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    if (user.status === "active") {
      return res.status(400).json({ message: "Email already verified" });
    }

    await storage.updateUser(
      user._id.toString(),
      { status: 'active', verificationToken: null },
      { session }
    );

    const referral = await Referral.findOne({ referredId: user._id.toString(), status: 'pending' }).session(session);
    
    if (referral && referral.type === UserRole.MARKETER) {
      let referrerWallet = await GrowCoinWallet.findOne({ userId: referral.referrerId }).session(session);
      let referredWallet = await GrowCoinWallet.findOne({ userId: referral.referredId }).session(session);
    
      if (!referrerWallet) {
        referrerWallet = await GrowCoinWallet.create(
          [
            {
              userId: referral.referrerId,
              balance: 0,
              pendingBalance: 0,
            },
          ],
          { session, ordered: true }
        );
        referrerWallet = referrerWallet[0];
      }
    
      if (!referredWallet) {
        referredWallet = await GrowCoinWallet.create(
          [
            {
              userId: referral.referredId,
              balance: 0,
              pendingBalance: 0,
            },
          ],
          { session, ordered: true }
        );
        referredWallet = referredWallet[0];
      }
    
      await GrowCoinWallet.updateOne(
        { userId: referral.referrerId },
        { $inc: { balance: 5 } },
        { session }
      );
    
      await GrowCoinWallet.updateOne(
        { userId: referral.referredId },
        { $inc: { balance: 3, pendingBalance: -3 } },
        { session }
      );
    
      await Referral.updateOne(
        { _id: referral._id },
        { status: 'earned', rewardAmount: 5, rewardType: 'growcoins' },
        { session }
      );
      
      const transactionIdReferrer = nanoid();
      const transactionIdReferred = nanoid();
      await GrowCoinTransaction.create(
        [
          {
            userId: referral.referrerId,
            description: `Referral reward for ${user.email}`,
            type: 'Referral',
            amount: 5,
            status: 'Completed',
            transactionId: transactionIdReferrer,
          },
          {
            userId: referral.referredId,
            description: `Referral bonus for signup`,
            type: 'Referral',
            amount: 3,
            status: 'Completed',
            transactionId: transactionIdReferred,
          },
        ],
        { session, ordered: true }
      );
    
      await emailQueue.add({
        type: 'growcoin_received_notification',
        email: user.email,
        name: user.name,
        sender: 'Growvia Pro',
        amount: 3,
        transactionId: transactionIdReferred,
        timestamp: new Date().toISOString(),
      });
    
      const referrer = await storage.getUserByEmailOrUsername(referral.referrerId);
      if (referrer) {
        await emailQueue.add({
          type: 'growcoin_received_notification',
          email: referrer.email,
          name: referrer.name,
          sender: 'Growvia Pro',
          amount: 5,
          transactionId: transactionIdReferrer,
          timestamp: new Date().toISOString(),
        });
      }
    }

    await storage.createActivity(
      {
        userId: user._id.toString(),
        type: 'email_verified',
        description: `${user.name} verified their email`,
      },
      { session }
    );

    await session.commitTransaction();

    const tokenPayload = {
      id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
      organizationId: user.organizationId
        ? user.organizationId.map((id) => id.toString())
        : null,
      role: user.role,
    };

    const authToken = generateToken(tokenPayload);

    let location = 'Unknown';
    let ipAddress = 'Unknown';
    try {
      const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
      const data = await response.json();

      if (data.city && data.region && data.country) {
        location = `${data.city}, ${data.region}, ${data.country}`;
      }
      ipAddress = data?.ip || 'Unknown';
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          route: req.path,
          method: req.method,
          token: req.query.token,
        },
      });
    }
  
    await UserSession.create({
      userId: user._id.toString(),
      token: authToken,
      ipAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      location,
    });

    return res.json({
      message: "Email verified successfully",
      user: {
        id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
          ? user.organizationId.map((id) => id.toString())
          : null,
        status: "active",
      },
      authToken,
    });
  } catch (error: any) {
    await session.abortTransaction();
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        token: req.query.token,
      },
    });
    return res
      .status(400)
      .json({ message: error.message || 'Email verification failed' });
  } finally {
    session.endSession();
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
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        token: req.query.token,
      },
    });
    return res
      .status(500)
      .json({ message: "An error occurred processing your request" });
  }
});

router.get('/me/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const sessions = await UserSession.find({ userId: (req as any).user.id })
      .sort({ lastActive: -1 })
      .select('-token');

    res.json({ sessions });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: "Failed to fetch sessions" });
  }
});

router.delete('/me/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await UserSession.findOneAndDelete({
      _id: sessionId,
      userId: (req as any).user.id,
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session logged out successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
        sessionId: req.params.sessionId,
      },
    });
    return res.status(500).json({ message: "Failed to delete session" });
  }
});

router.delete('/me/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    await UserSession.deleteMany({ userId: (req as any).user.id });
    res.json({ message: 'Sessions cleared successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: "Failed to clear sessions" });
  }
});

router.post("/logout", authenticate, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    await UserSession.deleteOne({ token });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: "Logout failed" });
  }
});

router.put('/notifications/login', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { loginNotifications } = req.body;

    const user = await storage.updateUser(
      userId,
      { loginNotifications: Boolean(loginNotifications) }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      message: 'Login notifications updated successfully',
      loginNotifications: user.loginNotifications,
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = speakeasy.generateSecret({
      name: `Growvia (${user.email})`,
    });

    const qr = await QRCode.toDataURL(secret.otpauth_url);

    await storage.updateUser(userId, {
      twoFactorSecret: secret.base32,
    });

    res.json({
      message: '2FA setup generated',
      qrCode: qr,
      secret: secret.base32,
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to generate 2FA setup' });
  }
});

router.post('/2fa/confirm-setup', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await storage.getUser((req as any).user.id);

    const verified = speakeasy.totp.verify({
      secret: user?.twoFactorSecret || '',
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) return res.status(400).json({ message: 'Invalid token' });

    await storage.updateUser((req as any).user.id, {
      twoFactorEnabled: true,
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to confirm 2FA setup' });
  }
});

router.post('/2fa/verify', async (req, res) => {
  try {
    const { token: twoFAToken, userId } = req.body;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret || '',
      encoding: 'base32',
      token: twoFAToken,
      window: 1
    });

    if (!verified) return res.status(400).json({ message: 'Invalid token' });

    const tokenPayload = {
      id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
      organizationId: user.organizationId
        ? user.organizationId.map((id) => id.toString())
        : null,
      role: user.role,
    };

    const authToken = generateToken(tokenPayload);

    let location = 'Unknown';
    let ipAddress = '';
    try {
      const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
      const data = await response.json();

      if (data.city && data?.region && data?.country) {
        location = `${data.city}, ${data.region}, ${data.country}`;
      }
      ipAddress = data?.ip || 'Unknown';
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          route: req.path,
          method: req.method,
          userId,
        },
      });
    }

    const session = await UserSession.create({
      userId: user._id,
      token: authToken,
      ipAddress,
      userAgent: req.get('user-agent') || 'Unknown',
      location,
    });

    if (user.loginNotifications) {
      const origin = req.get("origin") || "https://www.growviapro.com";
      await emailQueue.add({
        type: "login_notification",
        email: user.email,
        name: user.name,
        location,
        ipAddress,
        loginTime: new Date().toISOString(),
        loginUrl: `${origin}/auth/login`,
        supportUrl: `${origin}/support`,
      });
    }

    return res.json({
      token: authToken,
      user: {
        id: user._id ? user._id.toString() : user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: req.body.userId,
      },
    });
    return res.status(500).json({ message: 'Failed to verify 2FA' });
  }
});

router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    await storage.updateUser(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to disable 2FA' });
  }
});

router.post('/2fa/backup-codes/generate', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.backupCodes.length > 0) {
      return res.status(403).json({ message: 'Backup codes can only be generated once' });
    }

    const backupCodes = generateBackupCodes();
    const hashedCodes = await hashCodes(backupCodes);

    await storage.updateUser(userId, {
      backupCodes: hashedCodes,
    });

    res.json({ backupCodes, message: 'Backup codes generated successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to generate backup codes' });
  }
});

router.post('/2fa/backup-codes/verify', async (req, res) => {
  try {
    const { code, userId } = req.body;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await verifyBackupCode(code, user.backupCodes);

    if (!isValid) return res.status(400).json({ message: 'Invalid backup code' });

    const updatedCodes = [];
    for (const storedCode of user.backupCodes) {
      const isMatch = await bcrypt.compare(code, storedCode);
      if (!isMatch) {
        updatedCodes.push(storedCode);
      }
    }

    await storage.updateUser(userId, {
      backupCodes: updatedCodes,
    });

    const tokenPayload = {
      id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
      organizationId: user.organizationId
        ? user.organizationId.map((id) => id.toString())
        : null,
      role: user.role,
    };

    const authToken = generateToken(tokenPayload);

    let location = 'Unknown';
    let ipAddress = '';
    try {
      const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
      const data = await response.json();

      if (data.city && data?.region && data?.country) {
        location = `${data.city}, ${data.region}, ${data.country}`;
      }
      ipAddress = data?.ip || 'Unknown';
    } catch (err) {
      Sentry.captureException(err, {
        extra: {
          route: req.path,
          method: req.method,
          userId,
        },
      });
    }

    const session = await UserSession.create({
      userId: user._id,
      token: authToken,
      ipAddress,
      userAgent: req.get('user-agent') || 'Unknown',
      location,
    });

    if (user.loginNotifications) {
      const origin = req.get("origin") || "https://www.growviapro.com";
      await emailQueue.add({
        type: "login_notification",
        email: user.email,
        name: user.name,
        location,
        ipAddress,
        loginTime: new Date().toISOString(),
        loginUrl: `${origin}/auth/login`,
        supportUrl: `${origin}/support`,
      });
    }

    return res.json({
      token: authToken,
      user: {
        id: user._id ? user._id.toString() : user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: req.body.userId,
      },
    });
    return res.status(500).json({ message: 'Failed to verify backup code' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ message: 'Invalid current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await storage.updateUser(userId, { password: hashedPassword });

    await auditLog(userId, 'PASSWORD_CHANGED', 'User changed their password');

    await storage.createActivity({
      userId,
      type: "password_changed",
      description: `Your password has been changed successfully`,
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to change password' });
  }
});

router.post('/auth/request-deletion', authenticate, async (req, res) => {
  try {
    const { twoFACode } = req.body;
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Admin accounts cannot be deleted' });

    if (user.twoFactorEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret || '',
        encoding: 'base32',
        token: twoFACode,
        window: 1,
      });
      if (!verified) return res.status(400).json({ message: 'Invalid 2FA code' });
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 14);
    await storage.updateUser(userId, {
      status: 'inactive',
      deletionRequestedAt: new Date(),
      deletionScheduledAt: deletionDate,
    });

    await auditLog(userId, 'ACCOUNT_DELETION_REQUESTED', `User requested account deletion, scheduled for ${deletionDate.toISOString()}`);

    await emailQueue.add({
      type: 'account_deletion_notification',
      email: user.email,
      name: user.name,
      timestamp: new Date().toISOString(),
      deletionDate: deletionDate.toISOString(),
      cancelUrl: `${req.get('origin') || 'https://www.growviapro.com'}/auth/cancel-deletion`,
    });

    await storage.invalidateUserSessions(userId);

    res.json({ message: 'Account deletion requested. You have 14 days to cancel.' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to request account deletion' });
  }
});

router.post('/auth/cancel-deletion', authenticate, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.deletionRequestedAt) return res.status(400).json({ message: 'No deletion request found' });

    await storage.updateUser(userId, {
      status: 'active',
      deletionRequestedAt: null,
      deletionScheduledAt: null,
    });

    await auditLog(userId, 'ACCOUNT_DELETION_CANCELLED', 'User cancelled account deletion request');

    await emailQueue.add({
      type: 'account_deletion_cancelled_notification',
      email: user.email,
      name: user.name,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Account deletion request cancelled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: {
        route: req.path,
        method: req.method,
        userId: (req as any).user.id,
      },
    });
    return res.status(500).json({ message: 'Failed to cancel deletion request' });
  }
});

// Sentry error handler must be after all routes
if (process.env.GLITCHTIP_DSN && Sentry.Handlers?.errorHandler) {
  router.use(Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      return error.status === 404 || error.status >= 500;
    },
  }));
} else if (process.env.GLITCHTIP_DSN) {
  console.warn("Sentry.Handlers.errorHandler not available. Skipping error handler middleware.");
}

export default router;