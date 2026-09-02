import { NextRequest, NextResponse } from 'next/server';
import { 
  migrateCommunity, 
  migrateNotifications, 
  migrateActivityLogs,
  dropIncidentReports
} from '@/lib/db-migrate';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.MIGRATION_SECRET;
    // Fail closed: the endpoint requires the secret to be configured AND match.
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await migrateCommunity();
    await migrateNotifications();
    await migrateActivityLogs();
    await dropIncidentReports();

    return NextResponse.json({ message: 'Migrations completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
