import { NextRequest, NextResponse } from 'next/server';
import { getStudentProfile } from '@/lib/data-service';
import { query } from '@/lib/turso';
import { decrypt, isStaff } from '@/lib/auth';
import { parseStudentName } from '@/lib/utils';
import { Student } from '@/types';

function getSessionUserId(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie?.value) return null;

  try {
    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    return sessionData.userId || null;
  } catch {
    return null;
  }
}

function buildPublicProfile(profile: Student) {
  const settings = {
    notifications: true,
    isPublic: true,
    showAcademicInfo: true,
    showStudentId: false,
    ...(profile.settings || {}),
  };

  const publicProfile: Partial<Student> = {
    id: profile.id,
    name: profile.name,
    parsedName: profile.parsedName,
    profilePhotoUrl: profile.profilePhotoUrl,
    badges: profile.badges || [],
    settings: {
      isPublic: settings.isPublic,
      showAcademicInfo: settings.showAcademicInfo,
      showStudentId: settings.showStudentId,
      notifications: settings.notifications,
    },
  };

  if (settings.showAcademicInfo) {
    publicProfile.course = profile.course;
    publicProfile.yearLevel = profile.yearLevel;
    publicProfile.semester = profile.semester;
  }

  return publicProfile;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('id');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    const viewerId = getSessionUserId(req);
    if (!viewerId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const isOwner = viewerId === studentId;
    const viewerIsStaff = isOwner ? false : await isStaff(viewerId);

    let profile = await getStudentProfile(studentId);

    if (!profile) {
      const studentRes = await query(`
        SELECT id, name, course, year_level, semester, email, profile_photo_url
        FROM students
        WHERE id = $1
      `, [studentId]);

      if (studentRes.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const student = studentRes.rows[0];
      profile = {
        id: student.id,
        name: student.name,
        parsedName: parseStudentName(student.name || ''),
        course: student.course,
        profilePhotoUrl: student.profile_photo_url || null,
        yearLevel: student.year_level,
        semester: student.semester,
        email: student.email,
        badges: [],
        settings: {
          notifications: true,
          isPublic: true,
          showAcademicInfo: true,
          showStudentId: false,
        },
      };
    }

    const settings = {
      notifications: true,
      isPublic: true,
      showAcademicInfo: true,
      showStudentId: false,
      ...(profile.settings || {}),
    };

    if (!isOwner && !viewerIsStaff && !settings.isPublic) {
      return NextResponse.json({ error: 'This profile is private' }, { status: 403 });
    }

    if (!isOwner && !viewerIsStaff) {
      return NextResponse.json({
        success: true,
        data: buildPublicProfile(profile),
      });
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { profilePhotoUrl } = await req.json();
    if (profilePhotoUrl === undefined) {
      return NextResponse.json({ error: 'profilePhotoUrl is required' }, { status: 400 });
    }

    if (profilePhotoUrl !== null) {
      let parsed: URL;
      try {
        parsed = new URL(profilePhotoUrl);
      } catch {
        return NextResponse.json({ error: 'Invalid photo URL' }, { status: 400 });
      }
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Photo URL must be HTTPS' }, { status: 400 });
      }
      if (profilePhotoUrl.length > 1000) {
        return NextResponse.json({ error: 'Photo URL is too long' }, { status: 400 });
      }
    }

    await query(
      'UPDATE students SET profile_photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [profilePhotoUrl, userId]
    );

    return NextResponse.json({ success: true, profilePhotoUrl });
  } catch (error: unknown) {
    console.error('Update profile photo error:', error);
    return NextResponse.json({ error: 'Failed to update profile photo' }, { status: 500 });
  }
}
