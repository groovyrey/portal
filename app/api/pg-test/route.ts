import { NextResponse } from 'next/server';
import { query } from '@/lib/pg';

export async function GET() {
  try {
    const res = await query('SELECT version()');
    return NextResponse.json({ 
      success: true, 
      version: res.rows[0].version 
    });
  } catch (error: any) {
    console.error('PostgreSQL Test Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
