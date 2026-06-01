// ==================== CREATE PLANE SCHEMA ====================
const createAirplaneSchema = {
  type: "object",
  required: [
    "airlineId",
    "registration",
    "model",
    "manufacturer",
    "totalSeats",
  ],
  properties: {
    airlineId: {
      type: "string",
      format: "uuid",
      description: "Must reference an approved airline",
    },
    registration: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      description: "Unique aircraft registration/tail number (e.g. 5N-BVE)",
    },
    model: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      description: "Aircraft model name (e.g. Boeing 737-800)",
    },
    manufacturer: {
      type: "string",
      minLength: 2,
      maxLength: 100,
      description: "Aircraft manufacturer (e.g. Boeing, Airbus)",
    },
    totalSeats: {
      type: "integer",
      minimum: 1,
      maximum: 1000,
      description:
        "Total seat capacity — used to auto-generate seats when a flight is created",
    },
    status: {
      type: "string",
      enum: ["ACTIVE", "MAINTENANCE", "RETIRED"],
      default: "ACTIVE",
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE PLANE SCHEMA ====================
const updateAirplaneSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    registration: {
      type: "string",
      minLength: 2,
      maxLength: 20,
    },
    model: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    manufacturer: {
      type: "string",
      minLength: 2,
      maxLength: 100,
    },
    totalSeats: {
      type: "integer",
      minimum: 1,
      maximum: 1000,
    },
    status: {
      type: "string",
      enum: ["ACTIVE", "MAINTENANCE", "RETIRED"],
    },
  },
  additionalProperties: false,
};

module.exports = {
  createAirplaneSchema,
  updateAirplaneSchema,
};
