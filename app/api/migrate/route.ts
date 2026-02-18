import { NextResponse } from 'next/server';
import { migrateCommunity } from '@/lib/db-migrate';

export async function GET() {
  try {
    await migrateCommunity();
    return NextResponse.json({ 
      success: true, 
      message: 'PostgreSQL Migration Successful'
    });
  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
