import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const subjectCode = req.nextUrl.searchParams.get('subjectCode');
    if (!subjectCode) return NextResponse.json({ error: 'Subject code required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      decrypt(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log('Fetching notes for subject:', subjectCode);

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });

    const notesQuery = query(
      collection(db, 'subject_notes'),
      where('subjectCode', '==', subjectCode),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(notesQuery);
    console.log(`Found ${snapshot.size} notes for ${subjectCode}`);
    
    const notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
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

    console.log('Successfully saved note with ID:', noteRef.id, 'for subject:', subjectCode);

    return NextResponse.json({ 
      success: true, 
      id: noteRef.id 
    });
  } catch (error: any) {
    console.error('Post note error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { noteId } = await req.json();
    if (!noteId) return NextResponse.json({ error: 'Note ID required' }, { status: 400 });

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

    const noteDocRef = doc(db, 'subject_notes', noteId);
    const noteSnap = await getDoc(noteDocRef);

    if (!noteSnap.exists()) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const noteData = noteSnap.data();
    if (noteData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this note' }, { status: 403 });
    }

    await deleteDoc(noteDocRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete note error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
