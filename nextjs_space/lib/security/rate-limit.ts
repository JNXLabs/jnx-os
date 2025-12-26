/**
 * Rate Limiting Middleware
 * Prevents abuse and DoS attacks
 */

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * For production, use Redis or external service
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   * Returns true if limit exceeded
   */
  check(identifier: string): { limited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = store[identifier];

    // Clean up expired entries periodically
    this.cleanup();

    if (!record || now > record.resetTime) {
      // Create new record
      store[identifier] = {
        count: 1,
        resetTime: now + this.config.interval,
      };

      return {
        limited: false,
        remaining: this.config.uniqueTokenPerInterval - 1,
        resetTime: store[identifier].resetTime,
      };
    }

    // Increment existing record
    record.count += 1;

    if (record.count > this.config.uniqueTokenPerInterval) {
      return {
        limited: true,
        remaining: 0,
        resetTime: record.resetTime,
      };
    }

    return {
      limited: false,
      remaining: this.config.uniqueTokenPerInterval - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }
}

/**
 * Pre-configured rate limiters
 */
export const rateLimiters = {
  // General API: 100 requests per 15 minutes
  general: new RateLimiter({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 100,
  }),

  // Auth endpoints: 10 requests per 15 minutes
  auth: new RateLimiter({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 10,
  }),

  // Strict: 5 requests per 15 minutes
  strict: new RateLimiter({
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5,
  }),
};

/**
 * Get rate limit identifier from request
 * Uses IP address or user ID
 */
export function getRateLimitIdentifier(
  ip: string | null,
  userId: string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }
  if (ip) {
    return `ip:${ip}`;
  }
  return 'unknown';
}
