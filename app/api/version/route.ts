import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';
import { pool } from '@/lib/pg';

export async function GET() {
  // Wake up Postgres (Fire and forget, but wait for it to establish a connection)
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('DB Warmup failed:', e);
  }

  return NextResponse.json({ version: APP_VERSION });
}
