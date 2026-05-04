const { number } = require("zod");

const airplaneSchema = {
  id: "number",
  model: "string",
  tailNumber: "string",
  totalSeats: "number",
  capacity: "number",
  airline: "string",
  createdAt: "Date",
  updatedAt: "Date",
};

const updateAirplaneSchema = {
  model: "string",
  tailNumber: "string",
  totalSeats: "number",
  capacity: "number",
  airline: "string",
};

module.exports = { airplaneSchema, updateAirplaneSchema };
