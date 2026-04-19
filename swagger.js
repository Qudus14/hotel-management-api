const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Hotel Management API",
    description: "Auto-generated API Documentation",
    version: "1.0.0",
  },
  host: "hotel-management-api-px8z.onrender.com",
  basePath: "/api/v1",
  schemes: ["https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter your bearer token in the format: Bearer {token}",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  //   "./src/routes/authRoutes.js",
  //   "./src/routes/userRoutes.js",
  //   "./src/routes/bookingRoutes.js",
  "./src/routes/index.js",
];

// Generate swagger-output.json
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ Swagger documentation generated successfully!");
  console.log("📚 View docs at: http://localhost:5000/api-docs");
});
