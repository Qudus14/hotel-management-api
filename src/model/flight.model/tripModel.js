const tripModel = {
  flightId: "string",
  userId: "string",
  flightNumber: "string",
  departureAirport: "string",
  arrivalAirport: "string",
  departureTime: "Date",
  arrivalTime: "Date",
  status: {
    type: "string",
    enum: ["booked", "cancelled", "paid", "no_show"],
    default: "booked",
  },
  price: "number",
  createdAt: "Date",
  updatedAt: "Date",
};

module.exports = { tripModel };
