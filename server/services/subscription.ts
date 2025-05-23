import { Organization, SubscriptionPlan, PLAN_LIMITS } from '@shared/schema';
import { storage } from '../storage';

/**
 * Check if an organization's trial has expired
 * @param organization The organization to check
 * @returns Boolean indicating whether the trial has expired
 */
export function isTrialExpired(organization: Organization): boolean {
  // If not on free trial, return false
  if (organization.plan !== SubscriptionPlan.FREE_TRIAL) {
    return false;
  }
  
  // If no trial end date, return false (shouldn't happen)
  if (!organization.trialEndsAt) {
    return false;
  }
  
  // Check if current date is past trial end date
  const now = new Date();
  const trialEnd = new Date(organization.trialEndsAt);
  
  return now > trialEnd;
}

/**
 * Calculate and set the trial end date for an organization
 * @param organizationId The ID of the organization
 * @returns Organization with updated trial end date
 */
export async function setTrialEndDate(organizationId: number): Promise<Organization | undefined> {
  const organization = await storage.getOrganization(organizationId);
  
  if (!organization) {
    return undefined;
  }
  
  // Set the trial end date to 7 days from now
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(now.getDate() + PLAN_LIMITS[SubscriptionPlan.FREE_TRIAL].durationDays);
  
  // Update the organization with the trial end date
  return await storage.updateOrganization(organizationId, {
    plan: SubscriptionPlan.FREE_TRIAL,
    trialEndsAt: trialEnd
  });
}

/**
 * Handle trial expiry by downgrading to a limited plan or showing upgrade prompt
 * @param organizationId The ID of the organization
 * @returns Boolean indicating whether the trial was expired and handled
 */
export async function handleTrialExpiry(organizationId: number): Promise<boolean> {
  const organization = await storage.getOrganization(organizationId);
  
  if (!organization) {
    return false;
  }
  
  // Check if trial is expired
  if (isTrialExpired(organization)) {
    // Update the organization to Starter plan with limitations
    await storage.updateOrganization(organizationId, {
      plan: SubscriptionPlan.STARTER
    });
    
    // Create an activity to log the trial expiry
    await storage.createActivity({
      organizationId,
      type: 'trial_expired',
      description: 'Free trial period has ended. Upgraded to Starter plan.'
    });
    
    return true;
  }
  
  return false;
}

/**
 * Get the days remaining in the trial period
 * @param organization The organization to check
 * @returns Number of days remaining, or 0 if not on trial or trial expired
 */
export function getTrialDaysRemaining(organization: Organization): number {
  // If not on free trial, return 0
  if (organization.plan !== SubscriptionPlan.FREE_TRIAL) {
    return 0;
  }
  
  // If no trial end date, return 0 (shouldn't happen)
  if (!organization.trialEndsAt) {
    return 0;
  }
  
  // Calculate days remaining
  const now = new Date();
  const trialEnd = new Date(organization.trialEndsAt);
  
  // If trial already expired, return 0
  if (now > trialEnd) {
    return 0;
  }
  
  // Calculate days difference
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}