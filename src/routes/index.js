const router = require("express").Router();
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const roomRoutes = require("./roomRoutes");
const adminRoutes = require("./adminRoutes");
const bookingRoutes = require("./bookingRoutes");
const walletRoutes = require("./walletRoutes");
const { authenticate: protect } = require("../middleware/auth");

router.use("/auth", authRoutes);
router.use("/users", protect, userRoutes);
router.use("/rooms", roomRoutes);
router.use("/wallet", walletRoutes);
router.use("/bookings", protect, bookingRoutes);
router.use("/admin", protect, adminRoutes);

router.use("/admin", authRoutes);

module.exports = router;
