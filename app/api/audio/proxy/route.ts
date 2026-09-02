import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

const ALLOWED_DOMAINS = [
  'soundhelix.com',
  'www.soundhelix.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
];

const ALLOWED_ORIGIN_HOSTS = ['lcchub.vercel.app', 'localhost', '127.0.0.1'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsed.hostname === domain);
  } catch {
    return false;
  }
}

function isAuthenticated(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get('session_token');
  if (!sessionCookie?.value) return false;
  try {
    decrypt(sessionCookie.value);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // redirect:'manual' prevents following redirects, which could otherwise
    // lead the server-side fetch from an allowlisted host to a private/internal
    // URL (SSRF). Only direct 2xx/206 audio responses are streamed back.
    const response = await fetch(audioUrl, {
      headers,
      cache: 'no-store',
      redirect: 'manual',
    });

    if (response.status === 429) {
       return NextResponse.json({ error: 'Source is busy' }, { status: 429 });
    }

    if (response.status >= 300 || response.status < 200) {
       return NextResponse.json({ error: 'Upstream returned an unexpected status' }, { status: 502 });
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

    // Reflect the request origin only on an exact host match; never a
    // substring match (which would allow spoofed origins like evil.lcchub.vercel.app.evil.com).
    const origin = req.headers.get('origin') || '';
    let originHost = '';
    try { originHost = new URL(origin).hostname; } catch { originHost = ''; }
    const allowedOrigin = ALLOWED_ORIGIN_HOSTS.includes(originHost)
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
