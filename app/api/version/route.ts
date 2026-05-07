import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { initDatabase } from '@/lib/db-init';

export async function GET() {
  // Wake up Turso and initialize tables
  try {
    initDatabase().catch(() => {});
  } catch (e) {
    // Fail silently
  }

  return NextResponse.json({ version: APP_VERSION });
}
