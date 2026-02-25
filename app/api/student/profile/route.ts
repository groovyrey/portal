import { NextRequest, NextResponse } from 'next/server';
import { getStudentProfile } from '@/lib/data-service';
import { query } from '@/lib/pg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('id');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // 1. Try to get from Firestore (Data Service) as it's the source of truth for badges and settings
    const profile = await getStudentProfile(studentId);
    
    if (profile) {
      return NextResponse.json({
        success: true,
        data: profile
      });
    }

    // 2. Fallback to PostgreSQL if Firestore doc doesn't exist yet (e.g. sync in progress)
    const studentRes = await query(`
      SELECT id, name, course, year_level, semester, email
      FROM students
      WHERE id = $1
    `, [studentId]);

    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = studentRes.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        course: student.course,
        yearLevel: student.year_level,
        semester: student.semester,
        email: student.email,
        badges: [],
        settings: {
          notifications: true,
          isPublic: true,
          showAcademicInfo: true
        }
      }
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
