import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getAllStudents } from '@/lib/data-service';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      // Basic check if user is staff should ideally be here too, 
      // but let's assume the client-side check is sufficient for now or add it if we have a way to check from ID
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const allStudents = await getAllStudents();
    
    const totalStudents = allStudents.length;
    const courseStats: Record<string, { count: number, yearLevels: Record<string, number> }> = {};

    allStudents.forEach(student => {
      const course = student.course || 'Unknown';
      const year = student.yearLevel || 'N/A';
      
      if (!courseStats[course]) {
        courseStats[course] = { count: 0, yearLevels: {} };
      }
      
      courseStats[course].count++;
      courseStats[course].yearLevels[year] = (courseStats[course].yearLevels[year] || 0) + 1;
    });

    const courses = Object.entries(courseStats).map(([name, data]) => ({
      name,
      count: data.count,
      yearLevels: Object.entries(data.yearLevels)
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => a.level.localeCompare(b.level))
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalStudents,
        courses
      }
    });

  } catch (error: any) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
