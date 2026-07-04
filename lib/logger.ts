import crypto from 'crypto';

export interface LogMetadata {
  [key: string]: any;
}

const generateRequestId = () => crypto.randomUUID().slice(0, 8);

export const logger = {
  /**
   * Log an error with context and optional metadata
   * @param context - Context label (e.g., "[LoginAPI]", "[DataService]")
   * @param error - Error object or message
   * @param metadata - Additional context data
   * @returns requestId for user reference
   */
  error: (context: string, error: unknown, metadata?: LogMetadata) => {
    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(
      `[${timestamp}] [ERROR] [${requestId}] ${context}`,
      errorMsg,
      errorStack ? { stack: errorStack, ...metadata } : metadata
    );

    return requestId;
  },

  /**
   * Log a warning
   * @param context - Context label
   * @param message - Warning message
   * @param metadata - Additional context data
   */
  warn: (context: string, message: string, metadata?: LogMetadata) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [WARN] ${context}`,
      message,
      metadata
    );
  },

  /**
   * Log info messages
   * @param context - Context label
   * @param message - Info message
   * @param metadata - Additional context data
   */
  info: (context: string, message: string, metadata?: LogMetadata) => {
    const timestamp = new Date().toISOString();
    console.info(
      `[${timestamp}] [INFO] ${context}`,
      message,
      metadata
    );
  },

  /**
   * Log debug messages (only in development)
   * @param context - Context label
   * @param message - Debug message
   * @param metadata - Additional context data
   */
  debug: (context: string, message: string, metadata?: LogMetadata) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(
        `[${timestamp}] [DEBUG] ${context}`,
        message,
        metadata
      );
    }
  },
};
