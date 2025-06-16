import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Secret key for JWT token generation
const JWT_SECRET = process.env.JWT_SECRET || 'growvia-super-secret-key-change-in-production';

// For simplicity, we'll use an in-memory store for password reset tokens
// In production, these should be stored in a database
interface ResetToken {
  userId: string | number;
  token: string;
  expiresAt: Date;
}

const resetTokens: ResetToken[] = [];

// Generate JWT auth token
export function generateToken(payload: any, expiresIn = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate a password reset token
export function generatePasswordResetToken(userId: string | number): string {
  // Input validation
  if (userId === undefined || userId === null) {
    throw new Error('User ID is required to generate a password reset token');
  }
  
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Store the reset token with an expiration of 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in milliseconds
  
  // Convert userId to string for consistent comparison
  const userIdStr = String(userId);
  
  // Remove any existing tokens for this user
  const userTokenIndex = resetTokens.findIndex(rt => String(rt.userId) === userIdStr);
  if (userTokenIndex !== -1) {
    resetTokens.splice(userTokenIndex, 1);
  }
  
  // Add the new token
  resetTokens.push({
    userId,
    token: resetToken,
    expiresAt
  });
  
  return resetToken;
}

// Verify a password reset token
export function verifyPasswordResetToken(userId: string | number, token: string): boolean {
  // Input validation
  if (userId === undefined || userId === null || !token) {
    return false;
  }
  
  // Convert userId to string for consistent comparison
  const userIdStr = String(userId);
  
  // Find the token for this user
  const resetToken = resetTokens.find(rt => 
    String(rt.userId) === userIdStr && 
    rt.token === token && 
    rt.expiresAt > new Date()
  );
  
  return !!resetToken;
}

// Remove a used password reset token
export function removePasswordResetToken(userId: string | number): void {
  // Input validation
  if (userId === undefined || userId === null) {
    return;
  }
  
  // Convert userId to string for consistent comparison
  const userIdStr = String(userId);
  
  const userTokenIndex = resetTokens.findIndex(rt => String(rt.userId) === userIdStr);
  if (userTokenIndex !== -1) {
    resetTokens.splice(userTokenIndex, 1);
  }
}

export function verifyEmailToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}