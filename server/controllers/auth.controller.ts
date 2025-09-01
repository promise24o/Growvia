import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import {
  loginUser,
  registerUser,
  registerUserV2,
  resendVerificationEmail,
  requestPasswordReset,
  resetUserPassword,
  verifyResetTokenService,
  getUserProfile,
  verifyUserEmail,
  verifyUserEmailV2,
  getEmailByVerificationToken,
  getUserSessions,
  deleteUserSession,
  clearUserSessions,
  logoutUser,
  updateUserLoginNotifications,
  setupTwoFactorAuth,
  confirmTwoFactorAuthSetup,
  verifyTwoFactorAuth,
  disableTwoFactorAuth,
  generateUserBackupCodes,
  verifyUserBackupCode,
  changeUserPassword,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '../services';

export const login = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body, req);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, email: req.body.email },
    });
    return res.status(400).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body, req);
    return res.status(201).json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, email: req.body.email, role: req.body.role },
    });
    return res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

export const registerV2 = async (req: Request, res: Response) => {
  try {
    const result = await registerUserV2(req.body, req);
    return res.status(201).json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, email: req.body.email, role: req.body.role },
    });
    return res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    await resendVerificationEmail(req.body, req);
    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, email: req.body.email },
    });
    return res.status(400).json({ message: error.message || 'Failed to resend verification email' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await requestPasswordReset(req.body, req);
    return res.status(200).json({ message: 'Password reset link has been sent to your email' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, email: req.body.email },
    });
    return res.status(500).json({ message: 'An error occurred processing your request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await resetUserPassword(req.body);
    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: req.body.userId },
    });
    return res.status(500).json({ message: 'An error occurred processing your request' });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const isValid = await verifyResetTokenService(req.body);
    return res.status(200).json({ valid: isValid });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: req.body.userId },
    });
    return res.status(500).json({ message: 'An error occurred processing your request' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await getUserProfile(userId);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = await verifyUserEmail(req.query);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, token: req.query.token },
    });
    return res.status(500).json({ message: 'An error occurred processing your request' });
  }
};

export const verifyEmailV2 = async (req: Request, res: Response) => {
  try {
    const result = await verifyUserEmailV2(req.query, req);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, token: req.query.token },
    });
    return res.status(400).json({ message: error.message || 'Email verification failed' });
  }
};

export const getEmailFromToken = async (req: Request, res: Response) => {
  try {
    const email = await getEmailByVerificationToken(req.query);
    return res.json({ email });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, token: req.query.token },
    });
    return res.status(500).json({ message: 'An error occurred processing your request' });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await getUserSessions((req as any).user.id);
    return res.json({ sessions });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to fetch sessions' });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    await deleteUserSession((req as any).user.id, req.params.sessionId);
    return res.json({ message: 'Session logged out successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id, sessionId: req.params.sessionId },
    });
    return res.status(500).json({ message: 'Failed to delete session' });
  }
};

export const clearSessions = async (req: Request, res: Response) => {
  try {
    await clearUserSessions((req as any).user.id);
    return res.json({ message: 'Sessions cleared successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to clear sessions' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await logoutUser(token);
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Logout failed' });
  }
};

export const updateLoginNotifications = async (req: Request, res: Response) => {
  try {
    const result = await updateUserLoginNotifications((req as any).user.id, req.body);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Server error' });
  }
};

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const result = await setupTwoFactorAuth((req as any).user.id);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to generate 2FA setup' });
  }
};

export const confirm2FASetup = async (req: Request, res: Response) => {
  try {
    await confirmTwoFactorAuthSetup((req as any).user.id, req.body);
    return res.json({ message: '2FA enabled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to confirm 2FA setup' });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const result = await verifyTwoFactorAuth(req.body, req);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: req.body.userId },
    });
    return res.status(500).json({ message: 'Failed to verify 2FA' });
  }
};

export const disable2FA = async (req: Request, res: Response) => {
  try {
    await disableTwoFactorAuth((req as any).user.id);
    return res.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

export const generateBackupCodes = async (req: Request, res: Response) => {
  try {
    const result = await generateUserBackupCodes((req as any).user.id);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to generate backup codes' });
  }
};

export const verifyBackupCode = async (req: Request, res: Response) => {
  try {
    const result = await verifyUserBackupCode(req.body, req);
    return res.json(result);
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: req.body.userId },
    });
    return res.status(500).json({ message: 'Failed to verify backup code' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    await changeUserPassword((req as any).user.id, req.body);
    return res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

export const requestDeletion = async (req: Request, res: Response) => {
  try {
    await requestAccountDeletion((req as any).user.id, req.body);
    return res.json({ message: 'Account deletion requested. You have 14 days to cancel.' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to request account deletion' });
  }
};

export const cancelDeletion = async (req: Request, res: Response) => {
  try {
    await cancelAccountDeletion((req as any).user.id);
    return res.json({ message: 'Account deletion request cancelled successfully' });
  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { route: req.path, method: req.method, userId: (req as any).user.id },
    });
    return res.status(500).json({ message: 'Failed to cancel deletion request' });
  }
};