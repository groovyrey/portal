import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { logActivity } from '@/lib/activity-service';

export async function POST(req: NextRequest) {
  try {
    const { settings: newSettings } = await req.json();
    if (!newSettings || typeof newSettings !== 'object' || Array.isArray(newSettings)) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    // Whitelist the settings keys the app actually supports, so a client
    // cannot inject arbitrary JSON or clobber unrelated settings.
    const ALLOWED_KEYS = new Set([
      'notifications', 'classReminders', 'paymentReminders',
      'isPublic', 'showAcademicInfo', 'showStudentId',
      'campus', 'assistant', 'accent', 'theme',
    ]);
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(newSettings)) {
      if (key.length > 40 || value === null) continue;
      if (!ALLOWED_KEYS.has(key)) continue;
      const stringified = typeof value === 'string' ? (value as string) : JSON.stringify(value);
      if (stringified.length > 2000) continue;
      sanitized[key] = value;
    }
    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const res = await query('SELECT settings FROM students WHERE id = ?', [userId]);
    const existingSettings = res.rowCount > 0 ? res.rows[0].settings || {} : {};

    // Merge with existing settings rather than wholesale replacement.
    const mergedSettings = { ...existingSettings, ...sanitized };

    // Identify precisely which keys changed
    const changedKeys: string[] = [];
    const keyMap: Record<string, string> = {
      notifications: 'App Alerts',
      classReminders: 'Schedule Reminders',
      paymentReminders: 'Financial Alerts',
      isPublic: 'Public Profile',
      showAcademicInfo: 'Academic Info',
      showStudentId: 'Student ID',
      campus: 'Campus Location',
      assistant: 'AI Assistant Preferences'
    };

    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] !== existingSettings[key]) {
        changedKeys.push(keyMap[key] || key);
      }
    });

    await query('UPDATE students SET settings = ? WHERE id = ?', [JSON.stringify(mergedSettings), userId]);

    // Only log if something actually changed
    if (changedKeys.length > 0) {
      logActivity(
        userId, 
        'Settings', 
        { 
          message: 'Updated account settings', 
          changes: changedKeys.join(', '),
          data: sanitized 
        }
      ).catch(e => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
