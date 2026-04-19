const express = require("express");
const router = express.Router();
const { authenticate: protect } = require("../middleware/auth");
const {
  getBookings,
  getBookingById,
  createBookings,
  updateBookingById,
  deleteBooking,
  cancelBooking,
} = require("../controllers/bookingController");

// Apply protection to ALL routes in this file
router.use(protect);

// Use :bookingId consistently
router.get("/getBookings", getBookings);
router.get("/:bookingId/getBookingsById", getBookingById); // Changed
router.post("/createBookings", createBookings);
router.patch("/:bookingId/cancel", cancelBooking); // Changed
router.patch("/:bookingId/update", updateBookingById); // Changed
router.delete("/:bookingId/removeBooking", deleteBooking); // Changed

module.exports = router;
