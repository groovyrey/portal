import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { pool } from '@/lib/turso';
import { migrateCommunity, migrateNotifications, migrateActivityLogs } from '@/lib/db-migrate';

export async function GET() {
  // Wake up Turso and run migrations
  try {
    await pool.query('SELECT 1');
    
    // Run migrations (these check for table existence anyway)
    migrateCommunity().catch(e => console.error('Community migration failed:', e));
    migrateNotifications().catch(e => console.error('Notifications migration failed:', e));
    migrateActivityLogs().catch(e => console.error('Activity logs migration failed:', e));
  } catch (e) {
    console.error('DB Warmup/Migration failed:', e);
  }

  return NextResponse.json({ version: APP_VERSION });
}
