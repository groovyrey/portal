import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { pool } from '@/lib/turso';
import { migrateCommunity, migrateNotifications, migrateActivityLogs } from '@/lib/db-migrate';

export async function GET() {
  // Wake up Turso and initialize tables
  try {
    // Initialize tables if needed
    migrateCommunity().catch(() => {});
    migrateNotifications().catch(() => {});
    migrateActivityLogs().catch(() => {});
  } catch (e) {
    // Fail silently or handle internal warming error
  }

  return NextResponse.json({ version: APP_VERSION });
}
