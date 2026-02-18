import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp, 
  doc, 
  getDoc, 
  where, 
  documentId, 
  deleteDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { decrypt } from '@/lib/auth';
import { initDatabase } from '@/lib/db-init';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (postId) {
        // Optimized: Fetch names of students who liked this specific post
        const postSnap = await getDoc(doc(db, 'community_posts', postId));
        if (!postSnap.exists()) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        
        const likes = postSnap.data().likes || [];
        if (likes.length === 0) return NextResponse.json({ success: true, reactors: [] });

        // Batch fetch student names (max 30 due to Firestore query limits for 'in')
        const qReactors = query(collection(db, 'students'), where(documentId(), 'in', likes.slice(0, 30)));
        const studentsSnap = await getDocs(qReactors);
        
        const reactors = studentsSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name
        }));

        return NextResponse.json({ success: true, reactors });
    }

    const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isUnreviewed: doc.data().isUnreviewed || false,
      topic: doc.data().topic || 'General',
      // Convert Firestore timestamp to ISO string for frontend
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, userName, poll, isUnreviewed, topic } = await req.json();
    if (!content && !poll) return NextResponse.json({ error: 'Content or Poll required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const postData: any = {
      userId,
      userName: userName || 'Anonymous Student',
      content: content || '',
      createdAt: serverTimestamp(),
      isUnreviewed: isUnreviewed || false,
      topic: topic || 'General'
    };

    if (poll && poll.question && poll.options) {
      postData.poll = {
        question: poll.question,
        options: poll.options.map((opt: string) => ({
          text: opt,
          votes: []
        }))
      };
    }

    const docRef = await addDoc(collection(db, 'community_posts'), postData);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (postSnap.data().userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own posts' }, { status: 403 });
    }

    // Delete associated comments first
    const commentsQuery = query(collection(db, 'community_comments'), where('postId', '==', postId));
    const commentsSnap = await getDocs(commentsQuery);
    
    const deleteCommentsPromises = commentsSnap.docs.map(commentDoc => deleteDoc(commentDoc.ref));
    await Promise.all(deleteCommentsPromises);

    await deleteDoc(postRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { postId, action, optionIndex } = await req.json(); // action: 'like' | 'unlike' | 'vote'
    if (!postId || !action) return NextResponse.json({ error: 'Post ID and action required' }, { status: 400 });

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted);
    const userId = sessionData.userId;

    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not ready' }, { status: 500 });

    const postRef = doc(db, 'community_posts', postId);

    if (action === 'like') {
      await updateDoc(postRef, {
        likes: arrayUnion(userId)
      });
    } else if (action === 'unlike') {
      await updateDoc(postRef, {
        likes: arrayRemove(userId)
      });
    } else if (action === 'vote') {
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      
      const poll = postSnap.data().poll;
      if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

      // Check if user already voted in this poll
      const hasVoted = poll.options.some((opt: any) => opt.votes.includes(userId));
      if (hasVoted) return NextResponse.json({ error: 'Already voted' }, { status: 400 });

      const newOptions = [...poll.options];
      newOptions[optionIndex].votes.push(userId);

      await updateDoc(postRef, {
        'poll.options': newOptions
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
