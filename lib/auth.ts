import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Use a stable fallback for development. In production, SESSION_SECRET must be set.
const FALLBACK_SECRET = '4a2c918e7b1f3d5c6e8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e';
const SECRET_KEY = process.env.SESSION_SECRET || FALLBACK_SECRET;
const KEY = Buffer.from(SECRET_KEY, 'hex');

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
