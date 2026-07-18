import { NextRequest, NextResponse } from 'next/server';
import { 
  migrateCommunity, 
  migrateNotifications, 
  migrateActivityLogs,
  migrateIncidentReports
} from '@/lib/db-migrate';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.MIGRATION_SECRET;
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await migrateCommunity();
    await migrateNotifications();
    await migrateActivityLogs();
    await migrateIncidentReports();

    return NextResponse.json({ message: 'Migrations completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
