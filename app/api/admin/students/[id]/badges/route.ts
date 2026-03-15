import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, updateDoc } from 'firebase/firestore';
import { decrypt, isStaff } from '@/lib/auth';
import { getStudentProfile } from '@/lib/data-service';
import { logAdminAction } from '@/lib/admin-logs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let adminId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      adminId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Server-side authorization check
    if (!(await isStaff(adminId))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { badges: newBadges } = await req.json();
    if (!Array.isArray(newBadges)) {
      return NextResponse.json({ error: 'Badges must be an array.' }, { status: 400 });
    }

    // Fetch Admin and Target Student Profiles for logging
    const [adminProfile, targetProfile] = await Promise.all([
      getStudentProfile(adminId),
      getStudentProfile(id)
    ]);

    const existingBadges = targetProfile?.badges || [];
    const added = newBadges.filter(b => !existingBadges.includes(b));
    const removed = existingBadges.filter(b => !newBadges.includes(b));

    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, {
      badges: newBadges
    });

    // Log the action
    let detailedAction = 'No changes';
    if (added.length > 0 || removed.length > 0) {
      detailedAction = "";
      if (added.length > 0) detailedAction += `Added: ${added.join(', ')}. `;
      if (removed.length > 0) detailedAction += `Removed: ${removed.join(', ')}. `;
    }

    await logAdminAction({
      adminId,
      adminName: adminProfile?.name || 'Unknown Staff',
      targetId: id,
      targetName: targetProfile?.name || 'Unknown Student',
      action: 'Update Badges',
      details: detailedAction.trim() || 'No changes made'
    });

    return NextResponse.json({ success: true, message: 'Badges updated successfully' });

  } catch (error: any) {
    console.error('Admin update badges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
