import crypto from 'crypto';
import { query } from './turso';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SESSION_SECRET;

// Enforce SESSION_SECRET in all environments
if (!SECRET_KEY) {
  const error = new Error(
    'SESSION_SECRET environment variable is required. ' +
    'Generate a 64-character hex string: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
  // In development, log warning but allow startup with random secret
  if (typeof window === 'undefined') {
    console.warn('⚠️  SESSION_SECRET not set. Using temporary random secret. Sessions will not persist across restarts.');
    console.warn('⚠️  Set SESSION_SECRET in .env.local for development persistence.');
  }
}

// Use provided secret or generate random one for development
const KEY = SECRET_KEY 
  ? Buffer.from(SECRET_KEY, 'hex')
  : crypto.randomBytes(32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Server-side check if a student ID has staff privileges
 */
export async function isStaff(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const res = await query("SELECT badges FROM students WHERE id = ?", [userId]);
    if (res.rowCount === 0) return false;
    const badges = res.rows[0].badges || [];
    return badges.includes('staff');
  } catch (error) {
    console.error('Error in isStaff check:', error);
    return false;
  }
}
