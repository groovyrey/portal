import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const subjectCode = req.nextUrl.searchParams.get('subjectCode');
    if (!subjectCode) return NextResponse.json({ error: 'Subject code required' }, { status: 400 });

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    const notesQuery = query(
      collection(db, 'subject_notes'),
      where('subjectCode', '==', subjectCode),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(notesQuery);
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { subjectCode, content, userName, imageUrl } = await req.json();
    if (!subjectCode || (!content && !imageUrl) || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    const noteRef = await addDoc(collection(db, 'subject_notes'), {
      userId,
      userName,
      subjectCode,
      content,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      id: noteRef.id 
    });
  } catch (error: any) {
    console.error('Post note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
