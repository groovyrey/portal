import { NextResponse } from 'next/server';

// Fallback quotes to use when API rate limit is reached or fails
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

let lastFetchTime = 0;
let cachedQuotes: any[] = [];

export async function GET() {
  const now = Date.now();

  // Simple in-memory cache (resets on server restart/redeploy)
  // Cache for 1 hour (3600000 ms) to be very safe with rate limits
  if (cachedQuotes.length > 0 && (now - lastFetchTime < 3600000)) {
    const randomQuote = cachedQuotes[Math.floor(Math.random() * cachedQuotes.length)];
    return NextResponse.json({
      quote: randomQuote.q,
      author: randomQuote.a
    });
  }

  try {
    // Fetch a batch of quotes to cache
    const response = await fetch('https://zenquotes.io/api/quotes', {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`ZenQuotes API error: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      cachedQuotes = data;
      lastFetchTime = now;
      const randomQuote = data[0];
      return NextResponse.json({
        quote: randomQuote.q,
        author: randomQuote.a
      });
    } else {
       throw new Error('Invalid data format');
    }

  } catch (error) {
    console.warn('Using fallback quotes due to API error:', error);
    // Serve from fallback list
    const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    return NextResponse.json({
      quote: randomFallback.q,
      author: randomFallback.a
    });
  }
}
