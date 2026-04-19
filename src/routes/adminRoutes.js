const express = require("express");
const router = express.Router();
const { authenticate, restrictTo } = require("../middleware/auth");
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  updateBookingStatus,
  getRevenueReport,
} = require("../controllers/adminController");

// Apply authentication and admin restriction to all admin routes
router.use(authenticate, restrictTo("admin"));

// ==================== Dashboard & Reports ====================
router.get("/dashboard/stats", getDashboardStats);
router.get("/reports/revenue", getRevenueReport);

// ==================== User Management ====================
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

// ==================== Booking Management ====================
router.get("/bookings", getAllBookings);
router.patch("/bookings/:bookingId", updateBookingStatus);

module.exports = router;
