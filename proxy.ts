import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create a new ratelimiter that allows 15 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(15, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/portal",
})

/**
 * Edge-safe check that a session cookie is present and well-formed. Middleware
 * runs on the Edge runtime, which has no Node `crypto`, so we cannot decrypt
 * here. Middleware is only a page-routing gate (rewrites to /unauthorized),
 * NOT a security boundary: every API route independently decrypts and
 * re-validates the session server-side, so a forged cookie is still rejected.
 * At minimum this rejects cookies that are absent or grossly malformed
 * (e.g. arbitrary non-AES values), refusing to serve protected UI.
 */
function validSession(req: NextRequest): boolean {
  const sessionToken = req.cookies.get('session_token');
  if (!sessionToken || !sessionToken.value) return false;
  // Encrypted sessions are "16-byte-hex-iv:hex-ciphertext" regardless of
  // payload, so a format check is safe on every real session.
  const value = sessionToken.value;
  const colon = value.indexOf(':');
  if (colon <= 0) return false;
  const ivHex = value.slice(0, colon);
  const body = value.slice(colon + 1);
  if (ivHex.length !== 32 || !/^[0-9a-f]+$/i.test(ivHex)) return false;
  return body.length > 0 && /^[0-9a-f]+$/i.test(body);
}

// Routes that require authentication
const authProtectedRoutes = [
  '/eaf',
  '/grades',
  '/settings',
  '/assistant',
  '/accounts',
  '/subjects',
  '/community',
  '/profile',
  '/admin', // Protect admin UI
  '/api/admin', // Protect admin API
  '/api/student/me',
  '/api/student/eaf',
  '/api/student/grades',
  '/api/student/settings',
  '/api/student/change-password',
  '/api/student/logout',
  '/api/community',
  '/api/ai'
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate Limiting Logic for Gemma 4 (15 RPM)
  const rateProtectedRoutes = [
    '/api/ai',
    '/api/student/login',
    '/api/deepgram',
    '/api/community/report',
    '/api/community/comments/report'
  ];

  if (rateProtectedRoutes.some(route => pathname.startsWith(route))) {
    // Vercel overwrites these trusted headers at the edge, so they cannot be
    // spoofed by the client. Prefer them over x-forwarded-for (spoofable).
    const identifier =
      req.headers.get('true-client-ip') ||
      req.headers.get('x-vercel-forwarded-for') ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      (req as any).ip ||
      '127.0.0.1';
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier)
      if (!success) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Gemma 4 is experiencing high demand. Please wait a moment.",
            code: "RATE_LIMIT_EXCEEDED"
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json",
              "X-Ratelimit-Limit": limit.toString(),
              "X-Ratelimit-Remaining": remaining.toString(),
              "X-Ratelimit-Reset": reset.toString(),
            } 
          }
        )
      }
    } catch (error) {
      console.error("Ratelimit error:", error)
    }
  }

  // EXPLICITLY skip for audio proxy
  if (pathname.startsWith('/api/audio/proxy')) {
    return NextResponse.next();
  }

  // Check if the current route is protected by auth
  const isProtected = authProtectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    // Only trust a session that decrypts to a valid userId, not mere cookie presence.
    const isAuthed = validSession(req);

    // If no valid session, show restriction
    if (!isAuthed) {
      // For API routes, return 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
      }
      
      const response = NextResponse.rewrite(new URL('/unauthorized', req.url));
      // Set a non-HttpOnly cookie that the client layout can read
      response.cookies.set('is_restricted', '1', { path: '/', maxAge: 60 });
      return response;
    }
    
    // Clear restricted cookie if user is authenticated
    if (req.cookies.has('is_restricted')) {
      const response = NextResponse.next();
      response.cookies.delete('is_restricted');
      return response;
    }
  } else {
    // Also clear it if we are on a non-protected route (like Home)
    if (req.cookies.has('is_restricted')) {
      const response = NextResponse.next();
      response.cookies.delete('is_restricted');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which paths the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/audio/proxy (audio proxy)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/audio/proxy).*)',
  ],
};

// Default export as well just in case
export default proxy;
