import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string (e.g. "Jan 5, 2023")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(date);
}

/**
 * Calculate the days remaining in a trial period
 * @param trialEndDate The date when the trial ends
 * @returns Number of days remaining in the trial, or 0 if the trial has expired
 */
export function getTrialDaysRemaining(trialEndDate: Date): number {
  const now = new Date();
  const endDate = new Date(trialEndDate);
  
  // If trial already expired, return 0
  if (now > endDate) {
    return 0;
  }
  
  // Calculate days difference
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
