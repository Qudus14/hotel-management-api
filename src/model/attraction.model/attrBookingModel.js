const createBookingSchema = {
  type: "object",
  required: [
    "unifiedBookingId",
    "attractionId",
    "timeSlotId",
    "numberOfPeople",
    "visitorNames",
    "pricePerPerson",
  ],
  properties: {
    unifiedBookingId: { type: "string", format: "uuid" },
    attractionId: { type: "string", format: "uuid" },
    timeSlotId: { type: "string", format: "uuid" },
    numberOfPeople: { type: "integer", minimum: 1 },
    visitorNames: {
      type: "array",
      minItems: 1,
      items: { type: "string", minLength: 2 },
    },
    pricePerPerson: { type: "number", minimum: 0 },
  },
  additionalProperties: false,
};

const updateBookingStatusSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: ["BOOKED", "CONFIRMED", "CANCELLED", "NO_SHOW", "REFUNDED"],
    },
    entryScanned: { type: "boolean" },
  },
  additionalProperties: false,
};

module.exports = { createBookingSchema, updateBookingStatusSchema };
