import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/pg';

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 });
    }

    // Store the subscription in the database
    // Using ON CONFLICT (if we had a unique constraint on user_id + subscription endpoint, but JSONB is tricky)
    // We'll just check if it exists or use a simple insert and handle errors
    await query(`
      INSERT INTO push_subscriptions (user_id, subscription)
      VALUES ($1, $2)
      ON CONFLICT (user_id, subscription) DO NOTHING
    `, [userId, JSON.stringify(subscription)]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, endpoint } = await req.json();

    if (!userId || !endpoint) {
      return NextResponse.json({ error: 'Missing userId or endpoint' }, { status: 400 });
    }

    // Remove the subscription from the database
    // For FCM, we might store { token: '...' } or just the token string
    await query(`
      DELETE FROM push_subscriptions
      WHERE user_id = $1 AND (subscription->>'token' = $2 OR subscription::text = $3)
    `, [userId, endpoint, JSON.stringify(endpoint)]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
