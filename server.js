const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const routes = require("./src/routes/index");
const { connectDB, disconnectDB } = require("./src/config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
require("dotenv").config();

// Import rate limiters and throttles
const {
  apiLimiter,
  authLimiter,
  bookingLimiter,
  adminLimiter,
} = require("./src/middleware/rateLimiter");

const {
  standardThrottle,
  heavyThrottle,
  searchThrottle,
} = require("./src/middleware/throttle");

connectDB();

// ==================== Security Middleware ====================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Compression
app.use(compression());

// CORS with strict options
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "https://yourdomain.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Trust proxy (required for rate limiting behind Nginx)
app.set("trust proxy", 1);

// ==================== Swagger UI Setup ====================
const swaggerUiOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Hotel Management API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "list",
    filter: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
  },
};

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions) // Use swaggerSpec, not swaggerDocument
);

// Optional: Serve raw swagger.json
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ==================== Apply Rate Limiting ====================
// Global API rate limit
app.use("/api/v1", apiLimiter);

// Apply throttling to all routes
app.use("/api/v1", standardThrottle);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    instance: process.env.INSTANCE_ID || "default",
  });
});

// ==================== Apply Route-Specific Rate Limits ====================
// Auth routes have stricter limits
app.use("/api/v1/auth", authLimiter);

// Booking routes have specific limits
app.use("/api/v1/bookings", bookingLimiter);

// Admin routes have higher limits
app.use("/api/v1/admin", adminLimiter);

// Apply heavy throttle to expensive operations
app.use("/api/v1/admin/reports", heavyThrottle);
app.use("/api/v1/rooms/search", searchThrottle);

// ==================== API Routes ====================
app.use("/api/v1", routes);
app.use("/public", express.static(path.join(__dirname, "public")));

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Root endpoint
 *     description: Welcome message and API information
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 version:
 *                   type: string
 *                 status:
 *                   type: string
 */
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Hotel Management API",
    documentation: "/api-docs",
    version: "1.0.0",
    status: "running",
    instance: process.env.INSTANCE_ID || "default",
  });
});

// ==================== Error Handlers ====================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ==================== Start Server ====================
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(
    `\n🚀 Server ${
      process.env.INSTANCE_ID || "default"
    } running on port ${PORT}`
  );
  console.log(`📊 Rate limiting enabled`);
  console.log(`🔄 Throttling enabled`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
  console.log(`📄 Swagger JSON: http://localhost:${PORT}/swagger.json\n`);
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log("HTTP server closed");
    await disconnectDB();
    console.log("Database disconnected");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = server;
