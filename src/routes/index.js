const router = require("express").Router();
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const roomRoutes = require("../routes/hotel.routes/roomRoutes");
const adminRoutes = require("../routes/hotel.routes/adminRoutes");
const bookingRoutes = require("../routes/hotel.routes/bookingRoutes");
const walletRoutes = require("../routes/hotel.routes/walletRoutes");
const flightAirplaneRoutes = require("../routes/flight.routes/airplaneRoutes");
const flightBookingRoutes = require("../routes/flight.routes/bookingRoutes");
const flightTripRoutes = require("../routes/flight.routes/tripRoutes");
const { authenticate: protect } = require("../middleware/auth");

router.use("/auth", authRoutes);
router.use("/users", protect, userRoutes);
router.use("/hotel/rooms", protect, roomRoutes);
router.use("/hotel/wallet", protect, walletRoutes);
router.use("/hotel/bookings", protect, bookingRoutes);
router.use("/hotel/admin", protect, adminRoutes);
router.use("/flight/airplanes", protect, flightAirplaneRoutes);
router.use("/flight/bookings", protect, flightBookingRoutes);
router.use("/flight/trip", protect, flightTripRoutes);

module.exports = router;
