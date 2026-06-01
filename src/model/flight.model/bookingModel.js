// ==================== CREATE FLIGHT BOOKING SCHEMA ====================
const flightBookingSchema = {
  type: "object",
  required: ["segments"],
  properties: {
    segments: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      description: "Each item is one flight leg. Send 2 for a return trip.",
      items: {
        type: "object",
        required: ["flightId", "seatId"],
        properties: {
          flightId: {
            type: "string",
            format: "uuid",
            description: "Get from GET /flight/trip",
          },
          seatId: {
            type: "string",
            format: "uuid",
            description: "Get from GET /flight/airplanes/{flightId}/seats",
          },
        },
        additionalProperties: false,
      },
    },
    addOnIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
      default: [],
      description: "Optional add-on UUIDs from GET /flight/bookings/add-ons",
    },
    cartId: {
      type: "string",
      format: "uuid",
      nullable: true,
      description: "Include if booking originated from cart checkout",
    },
  },
  additionalProperties: false,
};

// ==================== UPDATE FLIGHT BOOKING STATUS SCHEMA ====================
const updateFlightBookingSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: ["BOOKED", "PAID", "CANCELLED", "BOARDED"],
      description:
        "Valid transitions: BOOKED→PAID|CANCELLED, PAID→BOARDED|CANCELLED",
    },
  },
  additionalProperties: false,
};

module.exports = {
  flightBookingSchema,
  updateFlightBookingSchema,
};
