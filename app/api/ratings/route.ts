import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const statsRes = await query('SELECT AVG(rating) as average, COUNT(*) as count FROM ratings');
    const stats = statsRes.rows[0];
    
    let userRating = null;
    const sessionCookie = req.cookies.get('session_token');
    if (sessionCookie?.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const { userId } = JSON.parse(decrypted);
        const userRatingRes = await query('SELECT * FROM ratings WHERE user_id = ?', [userId]);
        if (userRatingRes.rowCount > 0) userRating = userRatingRes.rows[0];
      } catch (e) {}
    }

    // Fetch recent feedbacks with text
    const feedbackRes = await query('SELECT rating, feedback, updated_at FROM ratings WHERE feedback IS NOT NULL AND feedback != "" ORDER BY updated_at DESC LIMIT 3');
    const recentFeedbacks = feedbackRes.rows.map(row => ({
      rating: row.rating,
      feedback: row.feedback,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({ 
      average: parseFloat((stats.average || 0).toFixed(1)), 
      count: stats.count || 0, 
      userRating, 
      recentFeedbacks 
    });
  } catch (error: any) {
    console.error('Ratings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rating, feedback } = await req.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const now = new Date().toISOString();
    await query(`
      INSERT INTO ratings (user_id, rating, feedback, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        rating = excluded.rating,
        feedback = excluded.feedback,
        updated_at = excluded.updated_at
    `, [userId, rating, feedback || "", now]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Ratings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
