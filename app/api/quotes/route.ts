import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_QUOTES = [
  { q: "The beautiful thing about learning is that no one can take it away from you.", a: "B.B. King" },
  { q: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", a: "Malcolm X" },
  { q: "Live as if you were to die tomorrow. Learn as if you were to live forever.", a: "Mahatma Gandhi" },
  { q: "The expert in anything was once a beginner.", a: "Helen Hayes" },
  { q: "Education is the most powerful weapon which you can use to change the world.", a: "Nelson Mandela" },
  { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
  { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
  { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" }
];

let cachedQuotes: any[] = [];
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();

  // Refresh cache every 30 minutes to keep variety high
  if (cachedQuotes.length === 0 || (now - lastFetchTime > 1800000)) {
    try {
      const response = await fetch('https://zenquotes.io/api/quotes', {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedQuotes = data;
          lastFetchTime = now;
        }
      }
    } catch (error) {
      console.warn('API Fetch failed, using fallback pool');
    }
  }

  // Always pick a random quote from the available pool
  const pool = cachedQuotes.length > 0 ? cachedQuotes : FALLBACK_QUOTES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];

  // Map fields to match client expectation (q -> quote, a -> author)
  return NextResponse.json({
    quote: selected.q || selected.quote,
    author: selected.a || selected.author
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache'
    }
  });
}
