import Queue from 'bull';
import { IMarketerApplication, IOrganization, IUser } from 'server/models';
import redisConfig from '../config/redis';
import {
  sendMarketerInvitationEmail,
  sendMarketerApprovalEmail,
  sendMarketerRejectionEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
  sendMarketerRevokedEmail,
  sendApplicationRemovedEmail,
  sendLoginNotificationEmail,
  sendAccountDeletionNotificationEmail,
  sendGrowCoinTransferNotificationEmail,
  sendGrowCoinReceivedNotificationEmail,
  sendGrowCoinTopUpNotificationEmail,
  sendCampaignInvitationEmail,
} from '../utils/email';

interface EmailJobData {
  type: string;
  application?: IMarketerApplication;
  organization?: IOrganization;
  user?: IUser;
  [key: string]: any; // Allow arbitrary fields for spread operator
}

const emailQueue = new Queue<EmailJobData>('email-queue', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

emailQueue.process(async (job) => {
  const { type, application, organization, user, ...data } = job.data;
  try {
    switch (type) {
      case 'invitation':
      case 'resend_invitation':
        if (!application || !organization || !data.invitationUrl) {
          throw new Error('Missing required fields for invitation email');
        }
        await sendMarketerInvitationEmail(application, organization, data.invitationUrl, data);
        break;
      case 'approval':
        if (!application || !organization) {
          throw new Error('Missing required fields for approval email');
        }
        await sendMarketerApprovalEmail(application, organization, data.tempPassword, data);
        break;
      case 'rejection':
        if (!application || !organization) {
          throw new Error('Missing required fields for rejection email');
        }
        await sendMarketerRejectionEmail(application, organization, data.notes, data.coolOffDays, data);
        break;
      case 'password_reset':
        if (!user || !data.resetToken || !data.resetUrl) {
          throw new Error('Missing required fields for password reset email');
        }
        await sendPasswordResetEmail(user, data.resetToken, data.resetUrl, data);
        break;
      case 'password_reset_success':
        if (!user) {
          throw new Error('Missing required fields for password reset success email');
        }
        await sendPasswordResetSuccessEmail(user, data);
        break;
      case 'email_verification':
        if (!data.email || !data.organizationName || !data.verificationUrl) {
          throw new Error('Missing required fields for email verification email');
        }
        await sendVerificationEmail(data.email, data.organizationName, data.verificationUrl, data);
        break;
      case 'marketer_revoked':
        if (!user || !organization || !data.reason) {
          throw new Error('Missing required fields for marketer revoked email');
        }
        await sendMarketerRevokedEmail(user, organization, data.reason, data);
        break;
      case 'application_removed':
        if (!data.email || !data.organizationName || !data.reason || !data.name) {
          throw new Error('Missing required fields for application removed email');
        }
        await sendApplicationRemovedEmail(data.email, data.organizationName, data.reason, data.name, data);
        break;
      case 'login_notification':
        if (!data.email || !data.name || !data.location || !data.ipAddress || !data.loginTime || !data.loginUrl || !data.supportUrl) {
          throw new Error('Missing required fields for login notification email');
        }
        await sendLoginNotificationEmail(data.email, data.name, data.location, data.ipAddress, data.loginTime, data.loginUrl, data.supportUrl, data);
        break;
      case 'account_deletion_notification':
        if (!user || !data.email || !data.name || !data.timestamp || !data.deletionDate || !data.cancelUrl) {
          throw new Error('Missing required fields for account deletion notification email');
        }
        await sendAccountDeletionNotificationEmail(user, data.timestamp, data.deletionDate, data.cancelUrl, data);
        break;
      case 'growcoin_transfer_notification':
        if (!data.email || !data.name || !data.receiver || !data.amount || !data.transactionId || !data.timestamp) {
          throw new Error('Missing required fields for GrowCoin transfer notification email');
        }
        await sendGrowCoinTransferNotificationEmail(data.email, data.name, data.receiver, data.amount, data.transactionId, data.timestamp, data);
        break;
      case 'growcoin_received_notification':
        if (!data.email || !data.name || !data.sender || !data.amount || !data.transactionId || !data.timestamp) {
          throw new Error('Missing required fields for GrowCoin received notification email');
        }
        await sendGrowCoinReceivedNotificationEmail(data.email, data.name, data.sender, data.amount, data.transactionId, data.timestamp, data);
        break;
      case 'growcoin_topup_notification':
        if (!data.email || !data.name || !data.amount || !data.transactionId || !data.timestamp) {
          throw new Error('Missing required fields for GrowCoin top-up notification email');
        }
        await sendGrowCoinTopUpNotificationEmail(data.email, data.name, data.amount, data.transactionId, data.timestamp, data);
        break;
      case 'campaign_invitation':
      case 'campaign_invitation_resent':
        if (!user || !data.campaign || !organization || !data.invitationUrl) {
          throw new Error('Missing required fields for campaign invitation email');
        }
        await sendCampaignInvitationEmail(user, data.campaign, organization, data.invitationUrl, data);
        break;
      case 'marketplace_application_approved':
        if (!user || !data.campaign || !organization) {
          throw new Error('Missing required fields for marketplace application approval email');
        }
        // Email will be sent with campaign details and next steps
        console.log(`Marketplace application approved for ${user.email} - Campaign: ${data.campaign.name}`);
        // TODO: Implement sendMarketplaceApprovalEmail function in utils/email
        break;
      case 'marketplace_application_rejected':
        if (!user || !data.campaign || !organization) {
          throw new Error('Missing required fields for marketplace application rejection email');
        }
        // Email will be sent with rejection reason and suggestions
        console.log(`Marketplace application rejected for ${user.email} - Campaign: ${data.campaign.name}, Reason: ${data.reason}`);
        // TODO: Implement sendMarketplaceRejectionEmail function in utils/email
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  } catch (error: any) {
    console.error(`Error processing email job (${type}):`, error);
    throw error;
  }
});

emailQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

emailQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

export default emailQueue;