import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'soundhelix.com',
  'www.soundhelix.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const audioUrl = searchParams.get('url');

  if (!audioUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!isAllowedUrl(audioUrl)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    const range = req.headers.get('range');
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    };

    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(audioUrl, { 
      headers,
      cache: 'no-store'
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

    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'audio/mpeg');
    }

    const origin = req.headers.get('origin') || '';
    const allowedOrigin = origin.includes('lcchub.vercel.app') || origin.includes('localhost')
      ? origin
      : 'https://lcchub.vercel.app';
    responseHeaders.set('Access-Control-Allow-Origin', allowedOrigin);

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
