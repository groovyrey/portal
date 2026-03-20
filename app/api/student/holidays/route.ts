import { NextResponse } from 'next/server';
import { getCachedHolidays, syncHolidays } from '@/lib/holiday-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Try getting from cache first
    let holidays = await getCachedHolidays(year);

    // If cache is empty, sync and return
    if (!holidays || holidays.length === 0) {
      const syncResult = await syncHolidays(year);
      if (syncResult.success) {
        holidays = await getCachedHolidays(year);
      }
    }

    return NextResponse.json(holidays || []);
  } catch (error) {
    console.error('[StudentHolidaysAPI] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
