import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Attempting to fetch educational quotes specifically
    // ZenQuotes free tier might not support keyword filtering reliably,
    // but we'll try the keyword endpoint as suggested.
    const response = await fetch('https://zenquotes.io/api/quotes/keyword/education', {
      next: { revalidate: 3600 }, // Cache for 1 hour to stay within rate limits (5 req/30s)
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) throw new Error('Failed to fetch from ZenQuotes');

    const data = await response.json();
    
    // ZenQuotes returns an array. If keyword filter is unsupported, it might return random quotes.
    if (data && Array.isArray(data) && data.length > 0) {
      // Pick a random one from the 50 returned if it's a batch, or just the first one
      const randomIndex = Math.floor(Math.random() * Math.min(data.length, 10));
      return NextResponse.json({
        quote: data[randomIndex].q,
        author: data[randomIndex].a
      });
    }

    throw new Error('Invalid data format from ZenQuotes');
  } catch (error: any) {
    console.error('[Quotes API] Error:', error.message);
    // Fallback to a single random quote if keyword endpoint fails
    try {
      const fallbackRes = await fetch('https://zenquotes.io/api/random');
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData[0]) {
        return NextResponse.json({
          quote: fallbackData[0].q,
          author: fallbackData[0].a
        });
      }
    } catch (e) {}
    
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
