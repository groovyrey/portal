import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/eaf',
  '/grades',
  '/settings',
  '/assistant',
  '/accounts',
  '/offered-subjects',
  '/community',
  '/profile', // Base profile path should be protected
  '/api/student/me',
  '/api/student/eaf',
  '/api/student/grades',
  '/api/student/settings',
  '/api/student/change-password',
  '/api/ratings',
  '/api/community',
  '/api/ai'
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if the current route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    const sessionToken = req.cookies.get('session_token');

    // If no session token, show restriction (rewrite to /unauthorized)
    if (!sessionToken) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
