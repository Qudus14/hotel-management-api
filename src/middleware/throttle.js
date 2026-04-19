/**
 * Simple in-memory throttling (no Redis needed)
 */
const buckets = new Map();

class TokenBucket {
  constructor(capacity, refillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / 1000) * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  tryConsume(tokens = 1) {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }
}

const throttle = (options = {}) => {
  const {
    capacity = 10,
    refillRate = 1,
    cost = 1,
    keyGenerator = (req) => req.user?.id || req.ip,
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);

    if (!buckets.has(key)) {
      buckets.set(key, new TokenBucket(capacity, refillRate));
    }

    const bucket = buckets.get(key);

    if (bucket.tryConsume(cost)) {
      res.setHeader("X-Throttle-Limit", capacity);
      res.setHeader("X-Throttle-Remaining", Math.floor(bucket.tokens));
      next();
    } else {
      res.setHeader("Retry-After", 1);
      res.setHeader("X-Throttle-Limit", capacity);
      res.setHeader("X-Throttle-Remaining", 0);

      res.status(429).json({
        error: "Request throttled. Please slow down.",
        retryAfter: 1,
      });
    }
  };
};

// Clean up old buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > 3600000) {
      // 1 hour
      buckets.delete(key);
    }
  }
}, 300000);

// Pre-configured throttles
const standardThrottle = throttle({
  capacity: 20,
  refillRate: 2,
  cost: 1,
});

const heavyThrottle = throttle({
  capacity: 5,
  refillRate: 1,
  cost: 2,
});

const searchThrottle = throttle({
  capacity: 10,
  refillRate: 3,
  cost: 1,
});

module.exports = {
  standardThrottle,
  heavyThrottle,
  searchThrottle,
  throttle,
};
