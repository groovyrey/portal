import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  where,
  limit,
  orderBy,
  doc,
  getDoc,
  setDoc,
  increment
} from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await initDatabase();
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    const statsRef = doc(db, 'stats', 'ratings');
    const statsSnap = await getDoc(statsRef);
    
    let userRating = null;
    const sessionCookie = req.cookies.get('session_token');
    if (sessionCookie?.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const { userId } = JSON.parse(decrypted);
        const userRatingRef = doc(db, 'ratings', userId);
        const userRatingSnap = await getDoc(userRatingRef);
        if (userRatingSnap.exists()) userRating = userRatingSnap.data();
      } catch (e) {}
    }

    const stats = statsSnap.exists() ? statsSnap.data() : { average: 0, count: 0 };
    
    // Fetch recent feedbacks with text
    const feedbacksRef = collection(db, 'ratings');
    const q = query(
      feedbacksRef, 
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
    const feedbackSnap = await getDocs(q);
    const recentFeedbacks = feedbackSnap.docs
      .map(doc => ({
        rating: doc.data().rating,
        feedback: doc.data().feedback,
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(f => f.feedback && f.feedback.trim().length > 0)
      .slice(0, 3);

    return NextResponse.json({ ...stats, userRating, recentFeedbacks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { rating, feedback } = await req.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }

    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
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
    if (!db) return NextResponse.json({ error: 'DB not initialized' }, { status: 500 });

    // Check for existing rating by this user
    const ratingDocRef = doc(db, 'ratings', userId);
    const ratingSnap = await getDoc(ratingDocRef);
    
    let diff = rating;
    let countInc = 1;

    if (ratingSnap.exists()) {
      const oldRating = ratingSnap.data().rating;
      diff = rating - oldRating;
      countInc = 0;
    }

    // Store/Update individual rating
    await setDoc(ratingDocRef, {
      userId,
      rating,
      feedback: feedback || "",
      updatedAt: serverTimestamp()
    });

    // Update aggregate stats
    const statsRef = doc(db, 'stats', 'ratings');
    const statsSnap = await getDoc(statsRef);
    
    if (statsSnap.exists()) {
      const data = statsSnap.data();
      const newCount = data.count + countInc;
      const newTotalStars = data.totalStars + diff;
      const newAverage = newCount > 0 ? parseFloat((newTotalStars / newCount).toFixed(1)) : 0;
      
      await setDoc(statsRef, {
        count: newCount,
        totalStars: newTotalStars,
        average: newAverage,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(statsRef, {
        count: 1,
        totalStars: rating,
        average: rating,
        updatedAt: serverTimestamp()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
