import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioUrl = searchParams.get('url');

  if (!audioUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const range = req.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    // Very important: don't let Wikimedia know we're a proxy if they are 429ing
    // But for SoundHelix/others, just forward normally
    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(audioUrl, { 
      headers,
      cache: 'no-store' // Avoid caching partial responses incorrectly
    });

    if (response.status === 429) {
       return NextResponse.json({ error: 'Source is busy' }, { status: 429 });
    }

    const responseHeaders = new Headers();
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];

    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) responseHeaders.set(header, value);
    });

    // Fallback content type
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'audio/mpeg');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    // Ensure we don't send transfer-encoding: chunked if we have a stream from fetch
    // Response constructor handles this usually

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Audio proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy audio' }, { status: 500 });
  }
}
