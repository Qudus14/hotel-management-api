const bookingSchema = {
  type: "object",
  properties: {
    roomId: { type: "integer" },
    checkInDate: { type: "string", format: "date" },
    checkOutDate: { type: "string", format: "date" },
    numberOfGuests: { type: "integer", minimum: 1, default: 1 },
    specialRequests: { type: "string", nullable: true },
  },
  required: ["roomId", "checkInDate", "checkOutDate"],
  additionalProperties: false,
};

// For update operations
const updateBookingSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
    },
    paymentStatus: {
      type: "string",
      enum: ["pending", "completed", "failed", "refunded"],
    },
    checkInDate: { type: "string", format: "date" },
    checkOutDate: { type: "string", format: "date" },
    numberOfGuests: { type: "integer", minimum: 1 },
    specialRequests: { type: "string", nullable: true },
    actualCheckIn: { type: "string", format: "date-time", nullable: true },
    actualCheckOut: { type: "string", format: "date-time", nullable: true },
  },
  additionalProperties: false,
};

// Complete booking schema (for response and internal use)
const fullBookingSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    roomId: { type: "integer" },
    room: { type: "object" }, // Populated from relation
    checkInDate: { type: "string", format: "date" },
    checkOutDate: { type: "string", format: "date" },
    totalPrice: { type: "number", minimum: 0 },
    depositAmount: { type: "number", default: 0 },
    numberOfGuests: { type: "integer", minimum: 1 },
    specialRequests: { type: "string", nullable: true },
    status: {
      type: "string",
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: "string",
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    actualCheckIn: { type: "string", format: "date-time", nullable: true },
    actualCheckOut: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    cancelledAt: { type: "string", format: "date-time", nullable: true },
  },
  required: ["roomId", "checkInDate", "checkOutDate", "userId"],
};

module.exports = {
  bookingSchema,
  updateBookingSchema,
  fullBookingSchema,
};
