import { query } from './turso';

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

/**
 * Fetches Philippine holidays for a given year from Google Calendar API
 */
export async function fetchPHHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const calendarId = 'en.philippines#holiday@group.v.calendar.google.com';
  
  if (!apiKey) {
    console.error('[HolidayService] No API key found for Google Calendar');
    return [];
  }

  try {
    const timeMin = `${year}-01-01T00:00:00Z`;
    const timeMax = `${year}-12-31T23:59:59Z`;
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Calendar API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    return (data.items || []).map((event: any) => ({
      date: event.start?.date || event.start?.dateTime?.split('T')[0],
      localName: event.summary,
      name: event.summary,
      countryCode: 'PH',
      fixed: true,
      global: true,
      types: ['Public']
    }));
  } catch (error) {
    console.error('[HolidayService] Error fetching holidays from Google:', error);
    return [];
  }
}

/**
 * Caches holidays in Turso
 */
export async function syncHolidays(year: number = new Date().getFullYear()) {
  const holidays = await fetchPHHolidays(year);
  if (holidays.length === 0) return { success: false, message: 'No holidays fetched' };

  try {
    const res = await query('SELECT data FROM metadata WHERE id = ?', ['holidays']);
    let currentData: any = {};
    if (res.rowCount > 0) {
      currentData = res.rows[0].data || {};
    }

    currentData[`y${year}`] = holidays;
    currentData.lastUpdated = new Date().toISOString();

    await query(`
      INSERT INTO metadata (id, data) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data
    `, ['holidays', JSON.stringify(currentData)]);

    return { success: true, count: holidays.length };
  } catch (error) {
    console.error('[HolidayService] Sync Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Retrieves cached holidays from Turso
 */
export async function getCachedHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
  try {
    const res = await query('SELECT data FROM metadata WHERE id = ?', ['holidays']);
    
    if (res.rowCount > 0) {
      const data = res.rows[0].data || {};
      return data[`y${year}`] || [];
    }
    return [];
  } catch (error) {
    console.error('[HolidayService] Get Cache Error:', error);
    return [];
  }
}
