import fs from "fs/promises";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "noreply@growvia.com",
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default sender address
const defaultFrom = process.env.EMAIL_FROM || "Growvia <noreply@growvia.com>";

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
      // Keep the notes block and replace {{notes}}
      templateContent = templateContent.replace(
        /{{#if notes}}([\s\S]*?){{\/if}}/,
        (match, content) => content.replace("{{notes}}", data.notes)
      );
    } else {
      // Remove the notes block entirely
      templateContent = templateContent.replace(
        /{{#if notes}}[\s\S]*?{{\/if}}/,
        ""
      );
    }
  }

  return templateContent;
}

// Helper function to send emails
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from = defaultFrom
): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    // Check if it was accepted by at least one recipient
    if (info.rejected.length > 0 || info.accepted.length === 0) {
      console.error("Email was rejected or not accepted:", info);
      return false;
    }

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`Error sending email to ${to}:`, error.message || error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  user: any,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const subject = "Reset Your Password - Growvia";
  const html = await renderTemplate("password-reset", {
    name: user.name,
    resetUrl,
    year: new Date().getFullYear(),
  });

  return await sendEmail(user.email, subject, html);
}

// Send password reset success email
export async function sendPasswordResetSuccessEmail(
  user: any
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
  });

  return await sendEmail(user.email, subject, html);
}

// Send marketer invitation email
export async function sendMarketerInvitationEmail(
  application: any,
  organization: any,
  invitationUrl: string
): Promise<boolean> {
  const subject = `You've been invited to join ${organization.name} as a marketer on Growvia`;
  const html = await renderTemplate("marketer-invitation", {
    name: application.name,
    organizationName: organization.name,
    invitationUrl,
    year: new Date().getFullYear(),
  });

  return await sendEmail(application.email, subject, html);
}

// Send marketer application approval email
export async function sendMarketerApprovalEmail(
  application: any,
  organization: any,
  tempPassword?: string
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
  });

  return await sendEmail(application.email, subject, html);
}

// Send marketer application rejection email
export async function sendMarketerRejectionEmail(
  application: any,
  organization: any,
  notes?: string,
  coolOffDays?: number
): Promise<boolean> {
  const subject = `Update on your marketer application for ${organization.name}`;
  const html = await renderTemplate("marketer-rejection", {
    name: application.name,
    organizationName: organization.name,
    notes: notes || "",
    coolOffDays: coolOffDays || null,
    year: new Date().getFullYear(),
  });

  return await sendEmail(application.email, subject, html);
}

// Send email verification email
export async function sendVerificationEmail(
  email: string,
  organizationName: string,
  verificationUrl: string
): Promise<boolean> {
  const subject = "Verify Your Email Address - Growvia";
  const html = await renderTemplate("verify-account", {
    organizationName,
    verificationUrl,
    year: new Date().getFullYear(),
  });

  return await sendEmail(email, subject, html);
}
