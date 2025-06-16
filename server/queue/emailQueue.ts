import Queue from "bull";
import { IMarketerApplication, IOrganization, IUser } from "server/models";
import redisConfig from "../config/redis";
import {
  sendMarketerApprovalEmail,
  sendMarketerInvitationEmail,
  sendMarketerRejectionEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendVerificationEmail,
} from "../utils/email";

// Define job types
interface EmailJobData {
  type:
    | "invitation"
    | "approval"
    | "resend_invitation"
    | "rejection"
    | "password_reset"
    | "password_reset_success"
    | "email_verification";
  application?: IMarketerApplication;
  organization?: IOrganization;
  user?: IUser;
  invitationUrl?: string;
  resetUrl?: string;
  resetToken?: string;
  verificationUrl?: string;
  email?: string;
  organizationName?: string;
  notes?: string;
  coolOffDays?: number;
  tempPassword?: string; 
}

const emailQueue = new Queue<EmailJobData>("email-queue", {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Process jobs
emailQueue.process(async (job) => {
  const {
    type,
    application,
    organization,
    user,
    invitationUrl,
    resetUrl,
    resetToken,
    verificationUrl,
    email,
    organizationName,
    notes,
    tempPassword,
    coolOffDays,
  } = job.data;

  try {
    switch (type) {
      case "invitation":
      case "resend_invitation":
        if (!application || !organization || !invitationUrl) {
          throw new Error("Missing required fields for invitation email");
        }
        await sendMarketerInvitationEmail(
          application,
          organization,
          invitationUrl
        );
        break;
      case "approval":
        if (!application || !organization) {
          throw new Error("Missing required fields for approval email");
        }
        await sendMarketerApprovalEmail(
          application,
          organization,
          tempPassword
        );
        break;
      case "rejection":
        if (!application || !organization) {
          throw new Error("Missing required fields for rejection email");
        }
        await sendMarketerRejectionEmail(
          application,
          organization,
          notes,
          coolOffDays
        );
        break;
      case "password_reset":
        if (!user || !resetToken || !resetUrl) {
          throw new Error("Missing required fields for password reset email");
        }
        await sendPasswordResetEmail(user, resetToken, resetUrl);
        break;
      case "password_reset_success":
        if (!user) {
          throw new Error(
            "Missing required fields for password reset success email"
          );
        }
        await sendPasswordResetSuccessEmail(user);
        break;
      case "email_verification":
        if (!email || !organizationName || !verificationUrl) {
          throw new Error(
            "Missing required fields for email verification email"
          );
        }
        await sendVerificationEmail(email, organizationName, verificationUrl);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  } catch (error: any) {
    console.error(`Error processing email job (${type}):`, error);
    throw error; // Bull will handle retries
  }
});

// Error handling
emailQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

emailQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);
});

emailQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

export default emailQueue;
