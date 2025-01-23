interface RateLimit {
  count: number;
  firstAttempt: number;
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const rateLimits = new Map<string, RateLimit>();

export const checkRateLimit = (email: string): boolean => {
  const now = Date.now();
  const limit = rateLimits.get(email);

  if (!limit) {
    rateLimits.set(email, { count: 1, firstAttempt: now });
    return true;
  }

  // Reset if outside window
  if (now - limit.firstAttempt > RATE_LIMIT_WINDOW) {
    rateLimits.set(email, { count: 1, firstAttempt: now });
    return true;
  }

  // Increment and check
  limit.count++;
  if (limit.count > MAX_ATTEMPTS) {
    return false;
  }

  return true;
};

export const resetRateLimit = (email: string): void => {
  rateLimits.delete(email);
};
