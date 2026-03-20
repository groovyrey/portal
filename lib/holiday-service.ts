import { adminDb as db } from './firebase-admin';

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
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.GEMINI_API_KEY;
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
      fixed: true, // Google doesn't explicitly flag this, but most holidays are fixed dates
      global: true,
      types: ['Public']
    }));
  } catch (error) {
    console.error('[HolidayService] Error fetching holidays from Google:', error);
    return [];
  }
}

/**
 * Caches holidays in Firestore
 */
export async function syncHolidays(year: number = new Date().getFullYear()) {
  if (!db) {
    console.error('[HolidayService] Firebase Admin DB not initialized');
    return { success: false, error: 'Database not initialized' };
  }

  const holidays = await fetchPHHolidays(year);
  if (holidays.length === 0) return { success: false, message: 'No holidays fetched' };

  try {
    const docRef = db.collection('metadata').doc('holidays');
    await docRef.set({
      [`y${year}`]: holidays,
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    return { success: true, count: holidays.length };
  } catch (error) {
    console.error('[HolidayService] Sync Error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Retrieves cached holidays from Firestore
 */
export async function getCachedHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
  if (!db) return [];

  try {
    const docRef = db.collection('metadata').doc('holidays');
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return data?.[`y${year}`] || [];
    }
    return [];
  } catch (error) {
    console.error('[HolidayService] Get Cache Error:', error);
    return [];
  }
}
