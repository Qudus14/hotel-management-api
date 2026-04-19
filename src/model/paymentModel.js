const paymentSchema = {
  type: "object",
  properties: {
    amount: {
      type: "number",
      minimum: 0.01,
    },
    currency: {
      type: "string",
      default: "NGN",
      minLength: 3,
      maxLength: 3,
    },
    paymentMethod: {
      type: "string",
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash"],
    },
    status: {
      type: "string",
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: "string", nullable: true },
    reference: { type: "string" },
    bookingId: { type: "string" },
  },
  // 'reference' is now required because you should generate it on your end
  required: [
    "amount",
    "currency",
    "paymentMethod",
    "status",
    "bookingId",
    "reference",
  ],
};

module.exports = paymentSchema;
