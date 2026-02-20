import { NextRequest, NextResponse } from 'next/server';
import { migrateNotifications, migratePushSubscriptions } from '@/lib/db-migrate';

export async function GET(req: NextRequest) {
  try {
    await migrateNotifications();
    await migratePushSubscriptions();
    return NextResponse.json({ success: true, message: 'Notifications and Push Subscriptions tables migrated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
