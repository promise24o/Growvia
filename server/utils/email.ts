import nodemailer from 'nodemailer';
import { User } from '@shared/schema';

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