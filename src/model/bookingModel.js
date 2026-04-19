const bookingSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    roomId: { type: "integer" }, // Match Prisma Int

    checkInDate: { type: "string", format: "date-time" },
    checkOutDate: { type: "string", format: "date-time" },

    totalPrice: { type: "number", minimum: 0 },
    depositAmount: { type: "number", default: 0 },
    paymentStatus: {
      type: "string",
      enum: ["unpaid", "partially_paid", "paid", "refunded"],
      default: "unpaid",
    },

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

    actualCheckIn: { type: "string", format: "date-time", nullable: true },
    actualCheckOut: { type: "string", format: "date-time", nullable: true },
  },
  required: [
    "userId",
    "roomId",
    "checkInDate",
    "checkOutDate",
    "totalPrice",
    "status",
  ],
};

module.exports = bookingSchema;
