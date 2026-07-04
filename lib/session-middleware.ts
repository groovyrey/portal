import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './auth';
import { logger } from './logger';

export interface SessionData {
  userId: string;
  password: string;
}

/**
 * Extracts and validates session from request
 * @param req - NextRequest object
 * @returns SessionData or null if session invalid/missing
 */
export async function getSession(req: NextRequest): Promise<SessionData | null> {
  try {
    const sessionCookie = req.cookies.get('session_token');
    
    if (!sessionCookie?.value) {
      return null;
    }

    const decrypted = decrypt(sessionCookie.value);
    const sessionData = JSON.parse(decrypted) as unknown;

    // Validate session structure
    if (
      typeof sessionData === 'object' &&
      sessionData !== null &&
      'userId' in sessionData &&
      'password' in sessionData &&
      typeof (sessionData as Record<string, unknown>).userId === 'string' &&
      typeof (sessionData as Record<string, unknown>).password === 'string'
    ) {
      return sessionData as SessionData;
    }

    return null;
  } catch (error) {
    logger.warn('[SessionMiddleware]', 'Failed to parse session cookie', { error: String(error) });
    return null;
  }
}

/**
 * Extracts userId from session
 * Useful for routes that only need the user ID
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getSession(req);
  return session?.userId ?? null;
}

/**
 * Middleware to require valid session
 * Returns 401 if session missing or invalid
 */
export async function requireSession(req: NextRequest): Promise<{ session: SessionData | null; error?: NextResponse }> {
  const session = await getSession(req);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'Session expired. Please log in again.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      ),
    };
  }

  return { session };
}

/**
 * Middleware to require admin role
 * Checks both session and staff badge
 */
export async function requireAdmin(req: NextRequest, isStaffFn: (userId: string) => Promise<boolean>): Promise<{ session: SessionData | null; error?: NextResponse }> {
  const { session, error } = await requireSession(req);

  if (error) {
    return { session: null, error };
  }

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  const isStaff = await isStaffFn(session.userId);

  if (!isStaff) {
    logger.warn('[AdminMiddleware]', 'Non-admin attempted admin action', { userId: session.userId });
    return {
      session: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}
