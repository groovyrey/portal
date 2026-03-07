import { NextResponse } from 'next/server';
import { getStaffMembers } from '@/lib/data-service';

export async function GET() {
  try {
    const staff = await getStaffMembers();
    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error('Public staff fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
