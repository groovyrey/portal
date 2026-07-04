import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  requestId?: string;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standardized API response builder for all endpoints
 */
export const ApiResponse = {
  /**
   * Success response with optional status code (default 200)
   */
  success: <T>(data: T, statusCode = 200) => {
    return NextResponse.json(
      { success: true, data } as ApiSuccessResponse<T>,
      { status: statusCode }
    );
  },

  /**
   * Error response with error code and optional requestId for debugging
   */
  error: (message: string, statusCode = 500, code = 'INTERNAL_ERROR', requestId?: string) => {
    const response: ApiErrorResponse = {
      success: false,
      error: message,
      code,
      ...(requestId && { requestId }),
    };
    return NextResponse.json(response, { status: statusCode });
  },

  /**
   * Validation error response from Zod or manual validation
   */
  validation: (errors: Record<string, string[]> | ZodError, requestId?: string) => {
    let errorMap: Record<string, string[]>;

    if (errors instanceof ZodError) {
      errorMap = errors.flatten().fieldErrors as Record<string, string[]>;
    } else {
      errorMap = errors;
    }

    const response: ApiErrorResponse = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errorMap,
      ...(requestId && { requestId }),
    };

    return NextResponse.json(response, { status: 400 });
  },

  /**
   * Unauthorized error (401)
   */
  unauthorized: (message = 'Unauthorized', requestId?: string) => {
    return ApiResponse.error(message, 401, 'UNAUTHORIZED', requestId);
  },

  /**
   * Forbidden error (403)
   */
  forbidden: (message = 'Forbidden', requestId?: string) => {
    return ApiResponse.error(message, 403, 'FORBIDDEN', requestId);
  },

  /**
   * Not found error (404)
   */
  notFound: (message = 'Not found', requestId?: string) => {
    return ApiResponse.error(message, 404, 'NOT_FOUND', requestId);
  },

  /**
   * Rate limit error (429)
   */
  rateLimited: (message = 'Too many requests', requestId?: string) => {
    return ApiResponse.error(message, 429, 'RATE_LIMITED', requestId);
  },

  /**
   * Server error with automatic logging
   */
  serverError: (context: string, error: unknown, statusCode = 500, metadata?: Record<string, any>) => {
    const requestId = logger.error(context, error, metadata);
    return ApiResponse.error(
      'An unexpected error occurred. Please try again later.',
      statusCode,
      'INTERNAL_ERROR',
      requestId
    );
  },
};
