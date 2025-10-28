import { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { EmailNotificationJob } from '../queues/jobs';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const templates = {
  conversionAlert: (data: any) => ({
    subject: `New Conversion: ${data.eventType}`,
    html: `
      <h2>New Conversion Tracked</h2>
      <p><strong>Event Type:</strong> ${data.eventType}</p>
      <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
      <p><strong>Affiliate:</strong> ${data.affiliateName}</p>
      <p><strong>Campaign:</strong> ${data.campaignName}</p>
      <p><strong>Commission:</strong> ${data.commission}</p>
    `,
  }),
  weeklyReport: (data: any) => ({
    subject: `Weekly Performance Report - ${data.week}`,
    html: `
      <h2>Weekly Performance Report</h2>
      <p><strong>Total Conversions:</strong> ${data.totalConversions}</p>
      <p><strong>Total Revenue:</strong> ${data.totalRevenue}</p>
      <p><strong>Total Commission:</strong> ${data.totalCommission}</p>
      <p><strong>Top Affiliates:</strong></p>
      <ul>
        ${data.topAffiliates.map((a: any) => `<li>${a.name}: ${a.conversions} conversions</li>`).join('')}
      </ul>
    `,
  }),
  payoutNotification: (data: any) => ({
    subject: `Payout Processed - ${data.amount}`,
    html: `
      <h2>Payout Processed</h2>
      <p>Your payout of <strong>${data.amount} ${data.currency}</strong> has been processed.</p>
      <p><strong>Period:</strong> ${data.period}</p>
      <p><strong>Conversions:</strong> ${data.conversions}</p>
      <p>Funds will arrive in 3-5 business days.</p>
    `,
  }),
};

export async function processEmails(job: Job<EmailNotificationJob>) {
  const { to, template, data } = job.data;

  await job.updateProgress(20);

  const templateFn = templates[template as keyof typeof templates];
  if (!templateFn) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const { subject, html } = templateFn(data);

  await job.updateProgress(50);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@growvia.com',
    to,
    subject,
    html,
  });

  await job.updateProgress(100);

  console.log(`Email sent to ${to}: ${subject}`);

  return { sent: true };
}
