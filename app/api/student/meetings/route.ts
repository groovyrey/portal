import { NextResponse } from 'next/server';
import { query } from '@/lib/turso';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const result = await query(
      'SELECT * FROM student_meetings WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    console.error('Fetch Meetings Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, description, date, transcript, summary } = body;

    if (!userId || !subject || !description || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await query(
      'INSERT INTO student_meetings (user_id, subject, description, date, transcript, summary) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, subject, description, date, transcript, summary]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Meeting Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, description, notes } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'ID and User ID are required' }, { status: 400 });
    }

    const updates = [];
    const values = [];

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, userId);

    await query(
      `UPDATE student_meetings SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Meeting Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
        return NextResponse.json({ error: 'ID and User ID are required' }, { status: 400 });
    }

    try {
        await query(
            'DELETE FROM student_meetings WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Meeting Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
