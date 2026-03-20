import { NextResponse } from 'next/server';
import { syncHolidays } from '@/lib/holiday-service';

/**
 * Trigger holiday sync.
 * Ideally called by a CRON job (e.g. Vercel Cron or GitHub Action)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const result = await syncHolidays(year);
    
    if (result.success) {
      return NextResponse.json({ success: true, count: result.count, year });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Sync failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('[HolidaysAPI] Critical Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
