import { NextRequest, NextResponse } from 'next/server';
import { migrateNotifications } from '@/lib/db-migrate';

export async function GET(req: NextRequest) {
  try {
    await migrateNotifications();
    return NextResponse.json({ success: true, message: 'Notifications table migrated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
