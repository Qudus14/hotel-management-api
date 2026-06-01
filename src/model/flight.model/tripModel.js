// ==================== CREATE FLIGHT SCHEMA ====================
const createTripSchema = {
  type: "object",
  required: [
    "flightNumber",
    "planeId",
    "departureAirport",
    "arrivalAirport",
    "departureTime",
    "arrivalTime",
    "price",
  ],
  properties: {
    flightNumber: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      description: "Unique flight number (e.g. P4-401)",
    },
    airlineId: {
      type: "string",
      format: "uuid",
      nullable: true,
      description: "Optional — links flight to an approved airline",
    },
    planeId: {
      type: "string",
      format: "uuid",
      description:
        "Must reference an ACTIVE plane — determines total seats auto-generated",
    },
    departureAirport: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      description: "IATA airport code (e.g. LOS)",
    },
    arrivalAirport: {
      type: "string",
      minLength: 3,
      maxLength: 3,
      description: "IATA airport code (e.g. ABV)",
    },
    originCity: {
      type: "string",
      maxLength: 100,
      nullable: true,
    },
    destinationCity: {
      type: "string",
      maxLength: 100,
      nullable: true,
    },
    departureTime: {
      type: "string",
      format: "date-time",
    },
    arrivalTime: {
      type: "string",
      format: "date-time",
      description: "Must be after departureTime",
    },
    price: {
      type: "number",
      minimum: 0,
      description:
        "Base economy price in NGN — used as fallback if class prices are not set",
    },
    status: {
      type: "string",
      enum: [
        "SCHEDULED",
        "DELAYED",
        "BOARDING",
        "DEPARTED",
        "ARRIVED",
        "CANCELLED",
      ],
      default: "SCHEDULED",
    },
    gateNumber: {
      type: "string",
      maxLength: 10,
      nullable: true,
    },
    terminal: {
      type: "string",
      maxLength: 10,
      nullable: true,
    },
    // Per-class overrides (optional — auto-calculated from price if omitted)
    economyPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
    economySeats: {
      type: "integer",
      minimum: 0,
      nullable: true,
    },
    businessPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
    businessSeats: {
      type: "integer",
      minimum: 0,
      nullable: true,
    },
    firstClassPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
    firstClassSeats: {
      type: "integer",
      minimum: 0,
      nullable: true,
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE FLIGHT SCHEMA ====================
const updateTripSchema = {
  type: "object",
  minProperties: 1,
  properties: {
    flightNumber: {
      type: "string",
      minLength: 2,
      maxLength: 20,
    },
    departureAirport: {
      type: "string",
      minLength: 3,
      maxLength: 3,
    },
    arrivalAirport: {
      type: "string",
      minLength: 3,
      maxLength: 3,
    },
    originCity: {
      type: "string",
      maxLength: 100,
      nullable: true,
    },
    destinationCity: {
      type: "string",
      maxLength: 100,
      nullable: true,
    },
    departureTime: {
      type: "string",
      format: "date-time",
    },
    arrivalTime: {
      type: "string",
      format: "date-time",
    },
    price: {
      type: "number",
      minimum: 0,
    },
    gateNumber: {
      type: "string",
      maxLength: 10,
      nullable: true,
    },
    terminal: {
      type: "string",
      maxLength: 10,
      nullable: true,
    },
    delayMinutes: {
      type: "integer",
      minimum: 0,
    },
    delayReason: {
      type: "string",
      maxLength: 500,
      nullable: true,
    },
    economyPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
    businessPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
    firstClassPrice: {
      type: "number",
      minimum: 0,
      nullable: true,
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE FLIGHT STATUS SCHEMA ====================
const updateTripStatusSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: [
        "SCHEDULED",
        "DELAYED",
        "BOARDING",
        "DEPARTED",
        "ARRIVED",
        "CANCELLED",
      ],
    },
    delayMinutes: {
      type: "integer",
      minimum: 1,
      description: "Required when status is DELAYED",
    },
    delayReason: {
      type: "string",
      maxLength: 500,
      nullable: true,
    },
  },
  additionalProperties: false,
};

module.exports = {
  createTripSchema,
  updateTripSchema,
  updateTripStatusSchema,
};
