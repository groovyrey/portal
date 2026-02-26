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
import { notifyAllStudents } from '@/lib/notification-service';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using the URL (contains cloud_name, api_key, and api_secret)
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
  secure: true
});

/**
 * Extracts Cloudinary public ID from URL
 */
function extractPublicId(url: string) {
  try {
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v12345678/folder/public_id.jpg
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const publicIdWithExtension = lastPart.split('.')[0];
    
    // Check if there are folders (parts between 'upload/' and the last part)
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
      const folderParts = parts.slice(uploadIndex + 2, parts.length - 1);
      return [...folderParts, publicIdWithExtension].join('/');
    }
    
    return publicIdWithExtension;
  } catch (e) {
    return null;
  }
}

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

    // Notify all students about the new note (don't await to keep response fast)
    notifyAllStudents({
      excludeUserId: userId,
      title: 'New Subject Note',
      message: `${userName} shared a new note for ${subjectCode}.`,
      link: `/subjects/${encodeURIComponent(subjectCode)}`
    }).catch(err => console.error('Notification error:', err));

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

    // Delete image from Cloudinary if it exists
    if (noteData.imageUrl) {
      const publicId = extractPublicId(noteData.imageUrl);
      if (publicId) {
        console.log('Deleting image from Cloudinary:', publicId);
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error('Cloudinary deletion error:', cloudinaryError);
          // Continue with note deletion even if image deletion fails
        }
      }
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
