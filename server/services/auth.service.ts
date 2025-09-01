import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import {
  loginSchema,
  registerSchema,
  SubscriptionPlan,
  UserRole,
} from '../../shared/schema';
import { GrowCoinTransaction } from '../models/GrowCoinTransaction';
import { GrowCoinWallet } from '../models/GrowCoinWallet';
import { Referral } from '../models/Referral';
import { UserSession } from '../models/UserSession';
import { MongoStorage } from '../mongoStorage';
import emailQueue from '../queue/emailQueue';
import { IStorage } from '../storage';
import { auditLog } from '../utils/auditLog';
import { generateBackupCodes, hashCodes, verifyBackupCode } from '../utils/backupCodes';
import {
  generatePasswordResetToken,
  generateToken,
  removePasswordResetToken,
  verifyEmailToken,
  verifyPasswordResetToken,
} from '../utils/token';
import { setTrialEndDate } from './subscription.service';

const storage: IStorage = new MongoStorage();

export const loginUser = async (data: any, req: any) => {
  const validatedData = loginSchema.parse(data);
  const user = await storage.getUserByEmail(validatedData.email);

  if (!user) throw new Error('Invalid email or password');
  if (user.status === 'pending') throw new Error('User is not verified');

  const isPasswordValid = await storage.verifyPassword(validatedData.password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  if (user.twoFactorEnabled) {
    return {
      twoFactorRequired: true,
      userId: user._id ? user._id.toString() : user.id,
    };
  }

  const tokenPayload = {
    id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
    organizationId: user.organizationId ? user.organizationId.map((id) => id.toString()) : null,
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
    throw err;
  }

  const session = await UserSession.create({
    userId: user._id,
    token,
    ipAddress,
    userAgent: req.get('User-Agent') || 'Unknown',
    location,
  });

  if (user.loginNotifications) {
    const origin = req.get('origin') || 'https://www.growviapro.com';
    await emailQueue.add({
      type: 'login_notification',
      email: user.email,
      name: user.name,
      location,
      ipAddress,
      loginTime: new Date().toISOString(),
      loginUrl: `${origin}/auth/login`,
      supportUrl: `${origin}/support`,
    });
  }

  return {
    token,
    user: {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || [],
      status: user.status,
    },
  };
};

export const registerUser = async (data: any, req: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const validatedData = registerSchema.parse(data);
    const [existingUser, existingOrg] = await Promise.all([
      storage.getUserByEmail(validatedData.email),
      storage.getOrganizationByEmail(validatedData.email),
    ]);

    if (existingUser || existingOrg) throw new Error('Email already in use');

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

    await emailQueue.add({
      type: 'email_verification',
      email: user.email,
      organizationName: organization ? organization.name : validatedData.name,
      verificationUrl,
    });

    await storage.createActivity(
      {
        organizationId: organization ? organization.id : null,
        userId: user.id,
        type: validatedData.role === UserRole.ADMIN ? 'organization_created' : 'marketer_registered',
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

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const registerUserV2 = async (data: any, req: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const validatedData = registerSchema.parse(data);
    const [existingUser, existingOrg] = await Promise.all([
      storage.getUserByEmail(validatedData.email),
      storage.getOrganizationByEmail(validatedData.email),
    ]);

    if (existingUser || existingOrg) throw new Error('Email already in use');

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

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId || [],
        status: user.status,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const resendVerificationEmail = async (data: any, req: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { email } = data;
    if (!email) throw new Error('Email required');

    const user = await storage.getUserByEmail(email);
    if (!user) throw new Error('User not found');
    if (user.status !== 'pending') throw new Error('User is already verified');

    const organizationId = user.organizationId && user.organizationId.length > 0 ? user.organizationId[0] : null;
    const organization = await storage.getOrganization(organizationId?.toString() || '');

    const verificationToken = randomBytes(32).toString('hex');
    const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    const verificationUrl = `${origin}/auth/verify-email?token=${verificationToken}`;

    const updatedUser = await storage.updateUser(user._id.toString(), { verificationToken }, { session });
    if (!updatedUser) throw new Error('Failed to update verification token');

    await emailQueue.add({
      type: 'email_verification',
      email: user.email,
      organizationName: organization ? organization.name : user.name,
      verificationUrl,
    });

    await storage.createActivity(
      {
        organizationId,
        userId: user.id,
        type: 'verification_email_resent',
        description: `Verification email resent for ${user.email}`,
      },
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const requestPasswordReset = async (data: any, req: any) => {
  const { email } = data;
  if (!email) throw new Error('Email is required');

  const user = await storage.getUserByEmail(email);
  if (!user) throw new Error('User with this email not found');

  const resetToken = generatePasswordResetToken(user._id.toString());
  const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
  const resetUrl = `${origin}/auth/reset-password/change?id=${user._id}&token=${resetToken}`;

  await emailQueue.add({
    type: 'password_reset',
    user,
    resetToken,
    resetUrl,
  });
};

export const resetUserPassword = async (data: any) => {
  const { userId, token, newPassword } = data;
  if (!userId || !token || !newPassword) throw new Error('User ID, token, and new password are required');

  const isValidToken = verifyPasswordResetToken(userId, token);
  if (!isValidToken) throw new Error('Invalid or expired token');

  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await storage.updateUser(userId, { password: hashedPassword });
  removePasswordResetToken(userId);

  await emailQueue.add({
    type: 'password_reset_success',
    user,
  });
};

export const verifyResetTokenService = async (data: any) => {
  const { userId, token } = data;
  if (!userId || !token) throw new Error('User ID and token are required');

  return verifyPasswordResetToken(userId, token);
};

export const getUserProfile = async (userId: string) => {
  if (!userId) throw new Error('Invalid token - no user identifier found');

  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  let responseData: any = {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
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
      status: user.status || 'active',
      verificationToken: user.verificationToken || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      clicks: user.clicks || 0,
      conversions: user.conversions || 0,
      commission: user.commission || 0,
      payoutStatus: user.payoutStatus || 'pending',
      assignedApps: user.assignedApps || [],
      socialMedia: user.socialMedia || {},
      skills: user.skills || [],
      backupCodeGenerated: user.backupCodes.length > 0 ? true : false,
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
        throw err;
      }
    }
  }

  return responseData;
};

export const verifyUserEmail = async (query: any) => {
  const { token } = query;
  if (!token || typeof token !== 'string') throw new Error('Token is required');

  const user = await storage.getUserByVerificationToken(token);
  if (!user) throw new Error('User not found');

  const isValidToken = verifyEmailToken(token, user.verificationToken ?? '');
  if (!isValidToken) throw new Error('Invalid verification token');

  if (user.status === 'active') throw new Error('Email already verified');

  const organizationId = user.organizationId && user.organizationId.length > 0 ? user.organizationId[0] : null;

  if (user.role === 'admin' && !organizationId) throw new Error('No organization associated with admin user');

  await storage.updateUser(user._id as string, {
    status: 'active',
    verificationToken: null,
  });

  await storage.createActivity({
    organizationId,
    userId: user.id,
    type: 'email_verified',
    description: `Email verified for ${user.email}`,
  });

  const tokenPayload = {
    id: user.id,
    organizationId: user.organizationId,
    role: user.role,
  };

  const authToken = generateToken(tokenPayload);

  return {
    message: 'Email verified successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || [],
      status: 'active',
    },
    token: authToken,
  };
};

export const verifyUserEmailV2 = async (query: any, req: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token } = query;
    if (!token || typeof token !== 'string') throw new Error('Invalid verification token');

    const user = await storage.getUserByVerificationToken(token);
    if (!user) throw new Error('Invalid or expired verification token');

    if (user.status === 'active') throw new Error('Email already verified');

    await storage.updateUser(user._id.toString(), { status: 'active', verificationToken: null }, { session });

    const referral = await Referral.findOne({ referredId: user._id.toString(), status: 'pending' }).session(session);

    if (referral && referral.type === UserRole.MARKETER) {
      let referrerWallet = await GrowCoinWallet.findOne({ userId: referral.referrerId }).session(session);
      let referredWallet = await GrowCoinWallet.findOne({ userId: referral.referredId }).session(session);

      if (!referrerWallet) {
        referrerWallet = await GrowCoinWallet.create(
          [{ userId: referral.referrerId, balance: 0, pendingBalance: 0 }],
          { session, ordered: true }
        );
        referrerWallet = referrerWallet[0];
      }

      if (!referredWallet) {
        referredWallet = await GrowCoinWallet.create(
          [{ userId: referral.referredId, balance: 0, pendingBalance: 0 }],
          { session, ordered: true }
        );
        referredWallet = referredWallet[0];
      }

      await GrowCoinWallet.updateOne({ userId: referral.referrerId }, { $inc: { balance: 5 } }, { session });
      await GrowCoinWallet.updateOne({ userId: referral.referredId }, { $inc: { balance: 3, pendingBalance: -3 } }, { session });

      await Referral.updateOne({ _id: referral._id }, { status: 'earned', rewardAmount: 5, rewardType: 'growcoins' }, { session });

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
      organizationId: user.organizationId ? user.organizationId.map((id) => id.toString()) : null,
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
      throw err;
    }

    await UserSession.create({
      userId: user._id.toString(),
      token: authToken,
      ipAddress,
      userAgent: req.get('User-Agent') || 'Unknown',
      location,
    });

    return {
      message: 'Email verified successfully',
      user: {
        id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ? user.organizationId.map((id) => id.toString()) : null,
        status: 'active',
      },
      authToken,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getEmailByVerificationToken = async (query: any) => {
  const { token } = query;
  if (!token || typeof token !== 'string') throw new Error('Token is required');

  const user = await storage.getUserByVerificationToken(token);
  if (!user) throw new Error('User not found');

  return user.email;
};

export const getUserSessions = async (userId: string) => {
  return await UserSession.find({ userId }).sort({ lastActive: -1 }).select('-token');
};

export const deleteUserSession = async (userId: string, sessionId: string) => {
  const session = await UserSession.findOneAndDelete({ _id: sessionId, userId });
  if (!session) throw new Error('Session not found');
};

export const clearUserSessions = async (userId: string) => {
  await UserSession.deleteMany({ userId });
};

export const logoutUser = async (token: string | undefined) => {
  if (!token) throw new Error('No token provided');
  await UserSession.deleteOne({ token });
};

export const updateUserLoginNotifications = async (userId: string, data: any) => {
  const { loginNotifications } = data;
  const user = await storage.updateUser(userId, { loginNotifications: Boolean(loginNotifications) });
  if (!user) throw new Error('User not found');

  return {
    message: 'Login notifications updated successfully',
    loginNotifications: user.loginNotifications,
  };
};

export const setupTwoFactorAuth = async (userId: string) => {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const secret = speakeasy.generateSecret({
    name: `Growvia (${user.email})`,
  });

  const qr = await QRCode.toDataURL(secret.otpauth_url);

  await storage.updateUser(userId, { twoFactorSecret: secret.base32 });

  return {
    message: '2FA setup generated',
    qrCode: qr,
    secret: secret.base32,
  };
};

export const confirmTwoFactorAuthSetup = async (userId: string, data: any) => {
  const { token } = data;
  const user = await storage.getUser(userId);

  const verified = speakeasy.totp.verify({
    secret: user?.twoFactorSecret || '',
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) throw new Error('Invalid token');

  await storage.updateUser(userId, { twoFactorEnabled: true });
};

export const verifyTwoFactorAuth = async (data: any, req: any) => {
  const { token: twoFAToken, userId } = data;
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret || '',
    encoding: 'base32',
    token: twoFAToken,
    window: 1,
  });

  if (!verified) throw new Error('Invalid token');

  const tokenPayload = {
    id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
    organizationId: user.organizationId ? user.organizationId.map((id) => id.toString()) : null,
    role: user.role,
  };

  const authToken = generateToken(tokenPayload);

  let location = 'Unknown';
  let ipAddress = '';
  try {
    const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
    const data = await response.json();
    if (data.city && data.region && data.country) {
      location = `${data.city}, ${data.region}, ${data.country}`;
    }
    ipAddress = data?.ip || 'Unknown';
  } catch (err) {
    throw err;
  }

  const session = await UserSession.create({
    userId: user._id,
    token: authToken,
    ipAddress,
    userAgent: req.get('user-agent') || 'Unknown',
    location,
  });

  if (user.loginNotifications) {
    const origin = req.get('origin') || 'https://www.growviapro.com';
    await emailQueue.add({
      type: 'login_notification',
      email: user.email,
      name: user.name,
      location,
      ipAddress,
      loginTime: new Date().toISOString(),
      loginUrl: `${origin}/auth/login`,
      supportUrl: `${origin}/support`,
    });
  }

  return {
    token: authToken,
    user: {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || [],
      status: user.status,
    },
  };
};

export const disableTwoFactorAuth = async (userId: string) => {
  await storage.updateUser(userId, {
    twoFactorEnabled: false,
    twoFactorSecret: null,
  });
};

export const generateUserBackupCodes = async (userId: string) => {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');
  if (user.backupCodes.length > 0) throw new Error('Backup codes can only be generated once');

  const backupCodes = generateBackupCodes();
  const hashedCodes = await hashCodes(backupCodes);

  await storage.updateUser(userId, { backupCodes: hashedCodes });

  return { backupCodes, message: 'Backup codes generated successfully' };
};

export const verifyUserBackupCode = async (data: any, req: any) => {
  const { code, userId } = data;
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const isValid = await verifyBackupCode(code, user.backupCodes);
  if (!isValid) throw new Error('Invalid backup code');

  const updatedCodes = [];
  for (const storedCode of user.backupCodes) {
    const isMatch = await bcrypt.compare(code, storedCode);
    if (!isMatch) {
      updatedCodes.push(storedCode);
    }
  }

  await storage.updateUser(userId, { backupCodes: updatedCodes });

  const tokenPayload = {
    id: user._id ? user._id.toString() : user.id ? user.id.toString() : null,
    organizationId: user.organizationId ? user.organizationId.map((id) => id.toString()) : null,
    role: user.role,
  };

  const authToken = generateToken(tokenPayload);

  let location = 'Unknown';
  let ipAddress = '';
  try {
    const response = await fetch('https://ipinfo.io/json?token=cccbd6831f7ccd');
    const data = await response.json();
    if (data.city && data.region && data.country) {
      location = `${data.city}, ${data.region}, ${data.country}`;
    }
    ipAddress = data?.ip || 'Unknown';
  } catch (err) {
    throw err;
  }

  const session = await UserSession.create({
    userId: user._id,
    token: authToken,
    ipAddress,
    userAgent: req.get('user-agent') || 'Unknown',
    location,
  });

  if (user.loginNotifications) {
    const origin = req.get('origin') || 'https://www.growviapro.com';
    await emailQueue.add({
      type: 'login_notification',
      email: user.email,
      name: user.name,
      location,
      ipAddress,
      loginTime: new Date().toISOString(),
      loginUrl: `${origin}/auth/login`,
      supportUrl: `${origin}/support`,
    });
  }

  return {
    token: authToken,
    user: {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || [],
      status: user.status,
    },
  };
};

export const changeUserPassword = async (userId: string, data: any) => {
  const { currentPassword, newPassword } = data;
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error('Invalid current password');

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await storage.updateUser(userId, { password: hashedPassword });

  await auditLog(userId, 'PASSWORD_CHANGED', 'User changed their password');

  await storage.createActivity({
    userId,
    type: 'password_changed',
    description: 'Your password has been changed successfully',
  });
};

export const requestAccountDeletion = async (userId: string, data: any, req: any) => {
  const { twoFACode } = data;
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Admin accounts cannot be deleted');

  if (user.twoFactorEnabled) {
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret || '',
      encoding: 'base32',
      token: twoFACode,
      window: 1,
    });
    if (!verified) throw new Error('Invalid 2FA code');
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
};

export const cancelAccountDeletion = async (userId: string) => {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');
  if (!user.deletionRequestedAt) throw new Error('No deletion request found');

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
};