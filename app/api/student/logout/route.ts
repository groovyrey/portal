import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const isProd = process.env.NODE_ENV === 'production';
  
  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  // Clear UI indicator cookie
  response.cookies.set('portal_session_active', '', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  
  return response;
}
