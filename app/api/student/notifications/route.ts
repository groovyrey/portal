import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';

function getUserId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie) return null;
  try {
    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    return sessionData.userId;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const notifsRes = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 25
    `, [userId]);

    const notifications = notifsRes.rows.map(n => ({
      id: n.id.toString(),
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      link: n.link,
      createdAt: n.created_at.toISOString()
    }));

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, token } = body;

    if (action === 'registerDevice') {
      const existing = await query(`SELECT id FROM device_tokens WHERE user_id = $1 AND token = $2`, [userId, token]);
      if (existing.rows.length === 0) {
        await query(`INSERT INTO device_tokens (user_id, token) VALUES ($1, $2)`, [userId, token]);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 });
    if (action === 'markRead' && !id) return NextResponse.json({ error: 'ID required for markRead' }, { status: 400 });

    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'markRead') {
      await query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);
    } else if (action === 'markAllRead') {
      await query(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE user_id = $1
      `, [userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (!action) return NextResponse.json({ error: 'Action required' }, { status: 400 });

    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'ID required for delete' }, { status: 400 });
      await query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);
    } else if (action === 'clearAll') {
      await query(`
        DELETE FROM notifications 
        WHERE user_id = $1
      `, [userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
