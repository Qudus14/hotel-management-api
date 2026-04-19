const rateLimit = require("express-rate-limit");

// Helper function to safely get IP (handles IPv6)
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    "unknown"
  );
};

// ==================== General API Limiter ====================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP safely
    if (req.user?.id) {
      return req.user.id;
    }
    // Safe IP handling for both IPv4 and IPv6
    return getClientIp(req);
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === "admin";
  },
});

// ==================== Strict Auth Limiter ====================
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 failed attempts per hour
  message: {
    error: "Too many authentication attempts. Account temporarily locked.",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  keyGenerator: (req) => {
    // Track by email + IP combination safely
    const email = req.body.email || "unknown";
    const ip = getClientIp(req);
    return `${email}_${ip}`;
  },
});

// ==================== Booking Creation Limiter ====================
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 booking attempts per minute
  message: {
    error: "Too many booking attempts. Please wait a moment.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user?.id) {
      return req.user.id;
    }
    return getClientIp(req);
  },
});

// ==================== Admin API Limiter (Higher Limits) ====================
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Higher limit for admin
  message: {
    error: "Admin rate limit exceeded.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || getClientIp(req);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  adminLimiter,
};
