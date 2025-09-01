import bcrypt from 'bcrypt';

export function generateBackupCodes(count = 10): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    const code = Math.random().toString(36).slice(-8).toUpperCase();
    codes.add(code);
  }
  return Array.from(codes);
}

export async function hashCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
}

export async function verifyBackupCode(inputCode: string, backupCodes: string[]): Promise<boolean> {
  try {
    for (const code of backupCodes) {
      const isMatch = await bcrypt.compare(inputCode, code);
      if (isMatch) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return false;
  }
}