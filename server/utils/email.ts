import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import { IMarketerApplication } from '../models/MarketerApplication';
import { IOrganization } from '../models/Organization';

interface EmailConfig {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  host: 'nl1-ts101.a2hosting.com',
  port: 465,
  secure: true, // use TLS
  auth: {
    user: 'developer@antigravitygroup.ng',
    pass: ')TukMui#YqwP',
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// Helper to send emails
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    const emailOptions = {
      from: '"Growvia" <developer@antigravitygroup.ng>',
      to: config.to,
      subject: config.subject,
      text: config.text || '',
      html: config.html || '',
    };

    await transporter.sendMail(emailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send marketer invitation email
export async function sendMarketerInvitationEmail(
  application: IMarketerApplication,
  organization: IOrganization,
  invitationUrl: string
): Promise<boolean> {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've Been Invited as a Marketer</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #6f42c1;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #eee;
          border-top: none;
        }
        .button {
          display: inline-block;
          background-color: #6f42c1;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5a32ad;
        }
        .footer {
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          text-align: center;
        }
        .highlight {
          font-weight: bold;
          color: #6f42c1;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>You've Been Invited as a Marketer</h1>
      </div>
      <div class="content">
        <p>Hello ${application.name},</p>
        
        <p>You have been invited to join <span class="highlight">${organization.name}</span> as an affiliate marketer on Growvia!</p>
        
        <p>As a marketer with ${organization.name}, you will be able to:</p>
        <ul>
          <li>Create unique referral links for their apps/products</li>
          <li>Track your conversions and earnings in real-time</li>
          <li>Get paid for successful referrals</li>
        </ul>
        
        <p>To complete your registration and start earning, please click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${invitationUrl}" class="button">Complete Your Registration</a>
        </div>
        
        <p>This invitation link will expire in 7 days.</p>
        
        <p>If you have any questions, please contact the team at ${organization.name}.</p>
        
        <p>Thank you,<br>The Growvia Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Hello ${application.name},

    You have been invited to join ${organization.name} as an affiliate marketer on Growvia!

    As a marketer with ${organization.name}, you will be able to:
    - Create unique referral links for their apps/products
    - Track your conversions and earnings in real-time
    - Get paid for successful referrals

    To complete your registration and start earning, please visit the following link:
    ${invitationUrl}

    This invitation link will expire in 7 days.

    If you have any questions, please contact the team at ${organization.name}.

    Thank you,
    The Growvia Team
  `;

  return sendEmail({
    to: application.email,
    subject: `You've Been Invited to Join ${organization.name} as a Marketer`,
    text: textTemplate,
    html: htmlTemplate,
  });
}

// Send marketer application status email (approved)
export async function sendMarketerApprovalEmail(
  application: IMarketerApplication,
  organization: IOrganization
): Promise<boolean> {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Marketer Application Has Been Approved</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #28a745;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #eee;
          border-top: none;
        }
        .button {
          display: inline-block;
          background-color: #6f42c1;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5a32ad;
        }
        .footer {
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          text-align: center;
        }
        .highlight {
          font-weight: bold;
          color: #28a745;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Application Approved!</h1>
      </div>
      <div class="content">
        <p>Hello ${application.name},</p>
        
        <p>Congratulations! Your application to become a marketer for <span class="highlight">${organization.name}</span> has been approved.</p>
        
        <p>You are now ready to start creating affiliate links and earning commissions.</p>
        
        <div style="text-align: center;">
          <a href="https://growvia.com/login" class="button">Login to Your Account</a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Thank you,<br>The Growvia Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Hello ${application.name},

    Congratulations! Your application to become a marketer for ${organization.name} has been approved.

    You are now ready to start creating affiliate links and earning commissions.

    Login to your account here: https://growvia.com/login

    If you have any questions or need assistance, please don't hesitate to contact our support team.

    Thank you,
    The Growvia Team
  `;

  return sendEmail({
    to: application.email,
    subject: 'Your Marketer Application Has Been Approved',
    text: textTemplate,
    html: htmlTemplate,
  });
}

// Send marketer application status email (rejected)
export async function sendMarketerRejectionEmail(
  application: IMarketerApplication,
  organization: IOrganization,
  rejectionReason?: string
): Promise<boolean> {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Marketer Application Status</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #6c757d;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #eee;
          border-top: none;
        }
        .reason {
          background-color: #f8f9fa;
          padding: 15px;
          border-left: 4px solid #6c757d;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          background-color: #6f42c1;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5a32ad;
        }
        .footer {
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Application Update</h1>
      </div>
      <div class="content">
        <p>Hello ${application.name},</p>
        
        <p>Thank you for your interest in becoming a marketer for ${organization.name}.</p>
        
        <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
        
        ${rejectionReason ? `
        <div class="reason">
          <p><strong>Feedback:</strong></p>
          <p>${rejectionReason}</p>
        </div>
        ` : ''}
        
        <p>If you believe this decision was made in error or if you would like to apply again in the future, please contact ${organization.name} directly.</p>
        
        <p>Thank you for your understanding,<br>The Growvia Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Hello ${application.name},

    Thank you for your interest in becoming a marketer for ${organization.name}.

    After careful review, we regret to inform you that your application has not been approved at this time.
    ${rejectionReason ? `\nFeedback: ${rejectionReason}` : ''}

    If you believe this decision was made in error or if you would like to apply again in the future, please contact ${organization.name} directly.

    Thank you for your understanding,
    The Growvia Team
  `;

  return sendEmail({
    to: application.email,
    subject: 'Update on Your Marketer Application',
    text: textTemplate,
    html: htmlTemplate,
  });
}

// Password reset email template
export async function sendPasswordResetEmail(
  user: User,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #6f42c1;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #eee;
          border-top: none;
        }
        .button {
          display: inline-block;
          background-color: #6f42c1;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5a32ad;
        }
        .footer {
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          text-align: center;
        }
        .code {
          font-family: monospace;
          background-color: #f1f1f1;
          padding: 2px 4px;
          border-radius: 3px;
          margin: 0 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Growvia Password Reset</h1>
      </div>
      <div class="content">
        <p>Hello ${user.name},</p>
        
        <p>We received a request to reset your password for your Growvia account. To reset your password, please click the button below:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>This password reset link will expire in 1 hour for security reasons.</p>
        
        <p>If you didn't request a password reset, please ignore this email or contact our support team if you have any concerns.</p>
        
        <p>Thank you,<br>The Growvia Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Hello ${user.name},

    We received a request to reset your password for your Growvia account.
    To reset your password, please visit the following link:
    ${resetUrl}

    This password reset link will expire in 1 hour for security reasons.

    If you didn't request a password reset, please ignore this email or contact our support team if you have any concerns.

    Thank you,
    The Growvia Team
  `;

  return sendEmail({
    to: user.email,
    subject: 'Reset Your Growvia Password',
    text: textTemplate,
    html: htmlTemplate,
  });
}

// Password reset success email template
export async function sendPasswordResetSuccessEmail(user: User): Promise<boolean> {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #28a745;
          padding: 20px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 0 0 10px 10px;
          border: 1px solid #eee;
          border-top: none;
        }
        .button {
          display: inline-block;
          background-color: #6f42c1;
          color: white !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .button:hover {
          background-color: #5a32ad;
        }
        .footer {
          font-size: 12px;
          color: #777;
          margin-top: 20px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Password Reset Successful</h1>
      </div>
      <div class="content">
        <p>Hello ${user.name},</p>
        
        <p>Your Growvia account password has been successfully reset.</p>
        
        <p>If you did not make this change or if you believe an unauthorized person has accessed your account, please contact our support team immediately.</p>
        
        <div style="text-align: center;">
          <a href="https://growvia.com/login" class="button">Login to Your Account</a>
        </div>
        
        <p>Thank you,<br>The Growvia Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>This is an automated email, please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  const textTemplate = `
    Hello ${user.name},

    Your Growvia account password has been successfully reset.

    If you did not make this change or if you believe an unauthorized person has accessed your account, please contact our support team immediately.

    You can login to your account here: https://growvia.com/login

    Thank you,
    The Growvia Team
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset Successful',
    text: textTemplate,
    html: htmlTemplate,
  });
}