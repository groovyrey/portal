import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp, doc, updateDoc, increment, where, deleteDoc, getDoc } from 'firebase/firestore';
import { decrypt } from '@/lib/auth';
import { initDatabase } from '@/lib/db-init';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const q = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId)
    );
    const querySnapshot = await getDocs(q);
    
    const comments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { postId, content, userName } = await req.json();
    if (!postId || !content) return NextResponse.json({ error: 'Post ID and content required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const commentData = {
      postId,
      userId,
      userName: userName || 'Anonymous Student',
      content,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'community_comments'), commentData);

    // Increment comment count on the post
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      commentCount: increment(1)
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      comment: {
        ...commentData,
        id: docRef.id,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const commentRef = doc(db, 'community_comments', commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const commentData = commentSnap.data();
    if (commentData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    await deleteDoc(commentRef);

    // Decrement comment count on the post
    const postRef = doc(db, 'community_posts', commentData.postId);
    await updateDoc(postRef, {
      commentCount: increment(-1)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
