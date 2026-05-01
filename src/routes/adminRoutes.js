// adminRoutes.js
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

router.use(authenticate, restrictTo("admin"));

/**
 * @openapi
 * /admin/dashboard/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/stats", getDashboardStats);

/**
 * @openapi
 * /admin/reports/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get revenue report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get("/reports/revenue", getRevenueReport);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get("/users", getAllUsers);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 *   patch:
 *     tags: [Admin]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, staff, customer]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Email already in use
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete the last admin user
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get("/users/:userId", getUserById);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     tags: [Admin]
 *     summary: Get all bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, checked_in, checked_out, cancelled]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.get("/bookings", getAllBookings);

/**
 * @openapi
 * /admin/bookings/{bookingId}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update booking status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, checked_in, checked_out, cancelled]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *               actualCheckIn:
 *                 type: string
 *                 format: date-time
 *               actualCheckOut:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Internal server error
 */
router.patch("/bookings/:bookingId", updateBookingStatus);

module.exports = router;
