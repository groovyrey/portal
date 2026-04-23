import { NextRequest, NextResponse } from 'next/server';
import { migrateCommunity, migrateNotifications, migrateActivityLogs } from '@/lib/db-migrate';

export async function GET(req: NextRequest) {
  try {
    // Basic auth check for admin (you can add more robust checks)
    const authHeader = req.headers.get('authorization');
    if (process.env.ADMIN_SECRET && authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await migrateCommunity();
    await migrateNotifications();
    await migrateActivityLogs();

    return NextResponse.json({ message: 'Migrations completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
