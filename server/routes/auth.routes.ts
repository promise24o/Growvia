import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    login, register,
    registerV2,
    resendVerification,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    getMe,
    verifyEmail,
    verifyEmailV2,
    getEmailFromToken,
    getSessions,
    deleteSession,  
    clearSessions,
    logout,
    updateLoginNotifications,
    setup2FA,
    confirm2FASetup,
    verify2FA,
    disable2FA,
    generateBackupCodes,
    verifyBackupCode,
    changePassword,
    requestDeletion,
    cancelDeletion,
} from '../controllers';
import * as Sentry from '@sentry/node';

const router = Router();

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

router.post('/login', login);
router.post('/register', register);
router.post('/register-v2', registerV2);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-token', verifyResetToken);
router.get('/me', authenticate, getMe);
router.get('/verify-email', verifyEmail);
router.get('/verify-email-v2', verifyEmailV2);
router.get('/auth/email-from-token', getEmailFromToken);
router.get('/me/sessions', authenticate, getSessions);
router.delete('/me/sessions/:sessionId', authenticate, deleteSession);
router.delete('/me/sessions', authenticate, clearSessions);
router.post('/logout', authenticate, logout);
router.put('/notifications/login', authenticate, updateLoginNotifications);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/confirm-setup', authenticate, confirm2FASetup);
router.post('/2fa/verify', verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/2fa/backup-codes/generate', authenticate, generateBackupCodes);
router.post('/2fa/backup-codes/verify', verifyBackupCode);
router.post('/change-password', authenticate, changePassword);
router.post('/auth/request-deletion', authenticate, requestDeletion);
router.post('/auth/cancel-deletion', authenticate, cancelDeletion);

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