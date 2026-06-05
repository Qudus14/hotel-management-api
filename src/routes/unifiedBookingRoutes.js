const express = require("express");
const router = express.Router();
const { authenticate: protect, restrictTo } = require("../middleware/auth");
const validateSchema = require("../middleware/validate");
const {
  getMyUnifiedBookings,
  cancelUnifiedBooking,
  getAdminUnifiedBookings,
} = require("../controllers/UnifiedBookingController");

// All routes below require authentication
router.use(protect);

/**
 * @openapi
 * /unifiedBookings/my-bookings:
 *   get:
 *     tags: [Unified Bookings]
 *     summary: Get all my bookings across all services (hotel, flight, attraction, car)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [HOTEL, FLIGHT, ATTRACTION, CAR]
 *         description: Filter by service type
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum: [PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, REFUNDED, NO_SHOW]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/my-bookings", getMyUnifiedBookings);

/**
 * @openapi
 * /unifiedBookings/cancelBooking/{unifiedBookingId}:
 *   patch:
 *     tags: [Unified Bookings]
 *     summary: Cancel any booking (hotel, flight, attraction, car) with automatic refund
 *     description: |
 *       Cancels a booking through the unified system. Refund policy:
 *       - **Hotel**: 100% refund if cancelled 48h+ before check-in, 50% within 24–48h, 0% under 24h
 *       - **Car**: 100% refund if cancelled 48h+ before pickup, 50% within 24–48h, 0% under 24h
 *       - **Attraction**: 90% refund
 *       - **Flight**: No refund
 *
 *       Refund is automatically credited to the user's wallet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unifiedBookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unified booking ID from the `unified.id` field in any booking response
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Change of plans"
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Already cancelled or cancellation window expired
 *       403:
 *         description: Access denied — not your booking
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.patch("/cancelBooking/:unifiedBookingId", cancelUnifiedBooking);

/**
 * @openapi
 * /unifiedBookings/getBooking:
 *   get:
 *     tags: [Unified Bookings - Admin]
 *     summary: Get all bookings across all users and services (admin only)
 *     description: |
 *       Returns a paginated list of all unified bookings in the system.
 *       Supports filtering by service type, booking status, payment status,
 *       and full-text search on reference code or customer name.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Results per page
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [HOTEL, FLIGHT, ATTRACTION, CAR]
 *         description: Filter by service type
 *       - in: query
 *         name: bookingStatus
 *         schema:
 *           type: string
 *           enum: [PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, REFUNDED, NO_SHOW]
 *         description: Filter by booking status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESSFUL, FAILED, REFUNDED]
 *         description: Filter by payment status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by reference code or customer name
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/getBooking", restrictTo("admin"), getAdminUnifiedBookings);

module.exports = router;
