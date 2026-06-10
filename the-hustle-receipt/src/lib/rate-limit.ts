interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * A simple in-memory rate limiter.
 * @param key Unique key for the requester (e.g., IP address + action)
 * @param limit Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 * @returns { isAllowed: boolean, remaining: number, resetTime: number }
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  
  // Clean up expired entries occasionally (every 100 calls to rateLimit)
  if (Math.random() < 0.01) {
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { isAllowed: true, remaining: limit - 1, resetTime: store[key].resetTime };
  }

  store[key].count++;

  if (store[key].count > limit) {
    return { isAllowed: false, remaining: 0, resetTime: store[key].resetTime };
  }

  return { 
    isAllowed: true, 
    remaining: limit - store[key].count, 
    resetTime: store[key].resetTime 
  };
}
