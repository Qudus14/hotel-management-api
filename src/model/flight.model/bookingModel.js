const flightBookingSchema = {
  type: "object",
  properties: {
    segments: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["flightId", "seatId"],
        properties: {
          flightId: { type: "string", format: "uuid" },
          seatId: { type: "string", format: "uuid" },
        },
        additionalProperties: false,
      },
    },
    addOnIds: {
      type: "array",
      items: { type: "string", format: "uuid" },
      default: [],
    },
    cartId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
  required: ["segments"],
  additionalProperties: false,
};

const updateFlightBookingSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: ["BOOKED", "PAID", "CANCELLED", "BOARDED"],
    },
  },
  required: ["status"],
  additionalProperties: false,
};

module.exports = { flightBookingSchema, updateFlightBookingSchema };
