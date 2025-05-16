import nodemailer from 'nodemailer';

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@growvia.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

// Default sender address
const defaultFrom = process.env.EMAIL_FROM || 'Growvia <noreply@growvia.com>';

// Helper function to send emails
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from = defaultFrom
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
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
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Growvia</h1>
        <p style="color: white; margin-top: 5px;">Affiliate Marketing Platform</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px;">
        <h2>Hello ${user.name},</h2>
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>This password reset link will expire in 1 hour for security reasons.</p>
        
        <p>Best regards,<br>The Growvia Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>If you did not request a password reset, please contact support immediately.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
}

// Send password reset success email
export async function sendPasswordResetSuccessEmail(
  user: any
): Promise<boolean> {
  const subject = "Your Password Has Been Reset - Growvia";
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Growvia</h1>
        <p style="color: white; margin-top: 5px;">Affiliate Marketing Platform</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px;">
        <h2>Hello ${user.name},</h2>
        <p>Your password has been successfully reset.</p>
        <p>You can now log in to your account with your new password.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NODE_ENV === 'production' ? 'https://growvia.com/login' : 'http://localhost:5000/login'}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In</a>
        </div>
        
        <p>If you did not reset your password, please contact support immediately.</p>
        
        <p>Best regards,<br>The Growvia Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
}

// Send marketer invitation email
export async function sendMarketerInvitationEmail(
  application: any,
  organization: any,
  invitationUrl: string
): Promise<boolean> {
  const subject = `You've been invited to join ${organization.name} as a marketer on Growvia`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Growvia</h1>
        <p style="color: white; margin-top: 5px;">Affiliate Marketing Platform</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px;">
        <h2>Hello ${application.name},</h2>
        <p>You have been invited by ${organization.name} to join their affiliate marketing program on Growvia.</p>
        <p>As a marketer, you'll have the opportunity to earn commissions by promoting their products/services.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${invitationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation & Complete Application</a>
        </div>
        
        <p>This invitation link will expire in 7 days. If you have any questions, please contact ${organization.name} directly.</p>
        
        <p>Best regards,<br>The Growvia Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
        <p>If you did not expect to receive this invitation, please ignore this email.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(application.email, subject, html);
}

// Send marketer application approval email
export async function sendMarketerApprovalEmail(
  application: any,
  organization: any
): Promise<boolean> {
  const subject = `Your application as a marketer for ${organization.name} has been approved`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Growvia</h1>
        <p style="color: white; margin-top: 5px;">Affiliate Marketing Platform</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px;">
        <h2>Congratulations ${application.name}!</h2>
        <p>Your application to become a marketer for ${organization.name} has been <strong style="color: #10b981;">approved</strong>.</p>
        <p>You can now log in to your account and start creating affiliate links for ${organization.name}'s products.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${process.env.NODE_ENV === 'production' ? 'https://growvia.com/login' : 'http://localhost:5000/login'}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In to Your Account</a>
        </div>
        
        <p>If you have any questions about your marketer account, please contact ${organization.name} directly.</p>
        
        <p>Best regards,<br>The Growvia Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(application.email, subject, html);
}

// Send marketer application rejection email
export async function sendMarketerRejectionEmail(
  application: any,
  organization: any,
  notes?: string
): Promise<boolean> {
  const subject = `Update on your marketer application for ${organization.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Growvia</h1>
        <p style="color: white; margin-top: 5px;">Affiliate Marketing Platform</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9fafb; border-radius: 0 0 5px 5px;">
        <h2>Hello ${application.name},</h2>
        <p>Thank you for your interest in becoming a marketer for ${organization.name}.</p>
        <p>We regret to inform you that your application has not been approved at this time.</p>
        
        ${notes ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Feedback from the organization:</h3>
          <p>${notes}</p>
        </div>
        ` : ''}
        
        <p>You may contact ${organization.name} directly if you have any questions about this decision.</p>
        
        <p>Best regards,<br>The Growvia Team</p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Growvia. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(application.email, subject, html);
}