const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Travel Safe API",
      version: "1.0.0",
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://hotel-management-api-px8z.onrender.com/api/v1"
            : "http://localhost:8000/api/v1",
        description:
          process.env.NODE_ENV === "production" ? "Production" : "Local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      // Define schemas ONCE here, reference with $ref everywhere
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["admin", "staff", "customer"] },
            phoneNumber: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "./src/routes/**/*.js")],
};

module.exports = swaggerJsdoc(options);
