const rentalSchema = {
  type: "object",
  properties: {
    id: "string",
    carId: "string",
    userId: "string",
    pickupDate: "Date",
    returnDate: "Date",
    status: "string",
    actualReturn: "Date",
    totalPrice: "number",
    depositPaid: "number",
    paymentStatus: "string",
    notes: "string",
    unifiedBookingId: "string",
  },
};

const updateRentalSchema = {
  type: "object",
  properties: {
    carId: "string",
    userId: "string",
    pickupDate: "Date",
    returnDate: "Date",
    status: "string",
    totalPrice: "number",
    depositPaid: "number",
    paymentStatus: "string",
    notes: "string",
    unifiedBookingId: "string",
  },
  additionalProperties: false,
  required: ["carId", "userId", "pickupDate", "returnDate"],
};

module.exports = { rentalSchema, updateRentalSchema };
