import fs from "fs/promises";
import nodemailer from "nodemailer";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "90d3a7001@smtp-brevo.com",
    pass: process.env.EMAIL_PASSWORD || "sY0PR5jk6fhDJNL4",
  },
  debug: true,
  logger: true,
});

// Brevo API configuration
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default sender address
const defaultFrom = process.env.EMAIL_FROM || "Growvia Pro <noreply@growviapro.com>";

// Helper function to send email via Brevo API
const sendEmailViaApi = async (
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<boolean> => {
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY is not set in environment variables");
    return false;
  }
  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: process.env.EMAIL_FROM || "Growvia App",
          email: "noreply@growviapro.com",
        },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "accept": "application/json",
          "api-key": BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );
    console.log(`Email sent via Brevo API to ${toEmail}:`, response.data);
    return true;
  } catch (error: any) {
    console.error(
      `Error sending email via Brevo API to ${toEmail}:`,
      error.response?.data || error.message
    );
    return false;
  }
};

// Helper function to render templates with placeholders
async function renderTemplate(
  templateName: string,
  data: Record<string, any>
): Promise<string> {
  const templatePath = path.join(
    __dirname,
    "..",
    "emails",
    `${templateName}.html`
  );
  let templateContent = await fs.readFile(templatePath, "utf-8");

  // Replace simple placeholders (e.g., {{name}}, {{resetUrl}})
  for (const [key, value] of Object.entries(data)) {
    templateContent = templateContent.replace(
      new RegExp(`{{${key}}}`, "g"),
      value.toString()
    );
  }

  // Handle conditional blocks for notes in marketer-rejection
  if (templateName === "marketer-rejection") {
    if (data.notes) {
      templateContent = templateContent.replace(
        /{{#if notes}}([\s\S]*?){{\/if}}/,
        (match, content) => content.replace("{{notes}}", data.notes)
      );
    } else {
      templateContent = templateContent.replace(
        /{{#if notes}}[\s\S]*?{{\/if}}/,
        ""
      );
    }
  }

  return templateContent;
}

// Helper function to send emails with SMTP and API fallback
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from = defaultFrom,
  toName = "User"
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    if (info.rejected.length > 0 || info.accepted.length === 0) {
      console.error("Email was rejected or not accepted:", info);
      // Fallback to Brevo API
      return await sendEmailViaApi(to, toName, subject, html);
    }

    console.log(`Email sent successfully to ${to} via SMTP`);
    return true;
  } catch (error: any) {
    console.error(`SMTP error for ${to}:`, error.message || error);
    // Fallback to Brevo API
    return await sendEmailViaApi(to, toName, subject, html);
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  user: any,
  resetToken: string,
  resetUrl: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = "Reset Your Password - Growvia";
  const html = await renderTemplate("password-reset", {
    name: user.name,
    resetUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(user.email, subject, html, defaultFrom, user.name);
}

// Send password reset success email
export async function sendPasswordResetSuccessEmail(
  user: any,
  data: Record<string, any>
): Promise<boolean> {
  const subject = "Your Password Has Been Reset - Growvia";
  const loginUrl =
    process.env.NODE_ENV === "production"
      ? `${process.env.BASE_URL}login`
      : `${process.env.LOCAL_URL}login`;
  const html = await renderTemplate("password-reset-success", {
    name: user.name,
    loginUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(user.email, subject, html, defaultFrom, user.name);
}

// Send marketer invitation email
export async function sendMarketerInvitationEmail(
  application: any,
  organization: any,
  invitationUrl: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `You've been invited to join ${organization.name} as a marketer on Growvia`;
  const html = await renderTemplate("marketer-invitation", {
    name: application.name,
    organizationName: organization.name,
    invitationUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(application.email, subject, html, defaultFrom, application.name);
}

// Send marketer application approval email
export async function sendMarketerApprovalEmail(
  application: any,
  organization: any,
  tempPassword?: string,
  data: Record<string, any> = {}
): Promise<boolean> {
  const subject = `Your application as a marketer for ${organization.name} has been approved`;
  const loginUrl =
    process.env.NODE_ENV === "production"
      ? `${process.env.BASE_URL}login`
      : `${process.env.LOCAL_URL}login`;
  const html = await renderTemplate("marketer-approval", {
    name: application.name,
    organizationName: organization.name,
    loginUrl,
    tempPassword,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(application.email, subject, html, defaultFrom, application.name);
}

// Send marketer application rejection email
export async function sendMarketerRejectionEmail(
  application: any,
  organization: any,
  notes?: string,
  coolOffDays?: number,
  data: Record<string, any> = {}
): Promise<boolean> {
  const subject = `Update on your marketer application for ${organization.name}`;
  const html = await renderTemplate("marketer-rejection", {
    name: application.name,
    organizationName: organization.name,
    notes: notes || "",
    coolOffDays: coolOffDays || null,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(application.email, subject, html, defaultFrom, application.name);
}

// Send email verification email
export async function sendVerificationEmail(
  email: string,
  organizationName: string,
  verificationUrl: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = "Verify Your Email Address - Growvia";
  const html = await renderTemplate("verify-account", {
    organizationName,
    verificationUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(email, subject, html, defaultFrom, organizationName);
}

// Send marketer revoked email
export async function sendMarketerRevokedEmail(
  user: any,
  organization: any,
  reason: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `Your marketer application for ${organization.name} has been revoked`;
  const html = await renderTemplate("marketer-revoked", {
    name: user.name,
    organizationName: organization.name,
    reason,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(user.email, subject, html, defaultFrom, user.name);
}

// Send application removed email
export async function sendApplicationRemovedEmail(
  email: string,
  organizationName: string,
  reason: string,
  name: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `Your marketer application for ${organizationName} has been removed`;
  const html = await renderTemplate("application-removed", {
    name,
    organizationName,
    reason,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(email, subject, html, defaultFrom, name);
}

// Send login notification email
export async function sendLoginNotificationEmail(
  email: string,
  name: string,
  location: string,
  ipAddress: string,
  loginTime: string,
  loginUrl: string,
  supportUrl: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = "New Login Detected - Growvia";
  const html = await renderTemplate("login-notification", {
    name,
    location,
    ipAddress,
    loginTime,
    loginUrl,
    supportUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(email, subject, html, defaultFrom, name);
}

// Send account deletion notification email
export async function sendAccountDeletionNotificationEmail(
  user: any,
  timestamp: string,
  deletionDate: string,
  cancelUrl: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `Account Deletion Request Confirmation`;
  const html = await renderTemplate("account-deletion-notification", {
    name: user.name,
    timestamp,
    deletionDate,
    cancelUrl,
    year: new Date().getFullYear(),
    ...data,
  });

  return await sendEmail(user.email, subject, html, defaultFrom, user.name);
}

// Send GrowCoins transfer notification email
export async function sendGrowCoinTransferNotificationEmail(
  email: string,
  name: string,
  receiver: string,
  amount: number,
  transactionId: string,
  timestamp: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `GrowCoins Transfer Confirmation`;
  const html = await renderTemplate('growcoin_transfer_notification', {
    email,
    name,
    receiver,
    amount,
    transactionId,
    timestamp,
    year: new Date().getFullYear(),
    ...data,
  });
  return await sendEmail(email, subject, html, defaultFrom, name);
}

// Send GrowCoins received notification email
export async function sendGrowCoinReceivedNotificationEmail(
  email: string,
  name: string,
  sender: string,
  amount: number,
  transactionId: string,
  timestamp: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `GrowCoins Received`;
  const html = await renderTemplate('growcoin_received_notification', {
    email,
    name,
    sender,
    amount,
    transactionId,
    timestamp,
    year: new Date().getFullYear(),
    ...data,
  });
  return await sendEmail(email, subject, html, defaultFrom, name);
}

// Send GrowCoins top-up notification email
export async function sendGrowCoinTopUpNotificationEmail(
  email: string,
  name: string,
  amount: number,
  transactionId: string,
  timestamp: string,
  data: Record<string, any>
): Promise<boolean> {
  const subject = `GrowCoins Top-Up Confirmation`;
  const html = await renderTemplate('growcoin_topup_notification', {
    email,
    name,
    amount,
    transactionId,
    timestamp,
    year: new Date().getFullYear(),
    ...data,
  });
  return await sendEmail(email, subject, html, defaultFrom, name);
}