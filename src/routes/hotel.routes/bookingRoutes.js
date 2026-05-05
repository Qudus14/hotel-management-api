const express = require("express");
const router = express.Router();
const { authenticate: protect } = require("../../middleware/auth");
const validateSchema = require("../../middleware/validate");
const {
  bookingSchema,
  updateBookingSchema,
} = require("../../model/hotel.model/bookingModel");
const {
  getBookings,
  getBookingById,
  createBookings,
  updateBookingById,
  deleteBooking,
  cancelBooking,
  getMyUnifiedBookings,
  cancelUnifiedBooking,
} = require("../../controllers/hotel.controller/bookingController");

router.use(protect);

// ─────────────────────────────────────────────
// SWAGGER COMPONENTS
// ─────────────────────────────────────────────
/**
 * @openapi
 * components:
 *   schemas:
 *     PricingBreakdown:
 *       type: object
 *       properties:
 *         subtotal:
 *           type: number
 *           example: 150000
 *         tax:
 *           type: number
 *           example: 11250
 *         serviceFee:
 *           type: number
 *           example: 3000
 *         totalPrice:
 *           type: number
 *           example: 164250
 *         currency:
 *           type: string
 *           example: NGN
 *         breakdown:
 *           type: object
 *           properties:
 *             pricePerNight:
 *               type: number
 *               example: 50000
 *             numberOfNights:
 *               type: integer
 *               example: 3
 *
 *     UnifiedBookingSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         referenceCode:
 *           type: string
 *           example: HTL-M5X3K-AB12
 *         bookingStatus:
 *           type: string
 *           example: PENDING_PAYMENT
 *         cancellationDeadline:
 *           type: string
 *           format: date-time
 *         pricing:
 *           $ref: '#/components/schemas/PricingBreakdown'
 *
 *     BookingResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, SUCCESSFUL, FAILED, REFUNDED, CANCELLED]
 *         checkInDate:
 *           type: string
 *           format: date-time
 *         checkOutDate:
 *           type: string
 *           format: date-time
 *         numberOfGuests:
 *           type: integer
 *         specialRequests:
 *           type: string
 *           nullable: true
 *         room:
 *           type: object
 *           properties:
 *             roomNumber:
 *               type: string
 *             type:
 *               type: string
 *             price:
 *               type: number
 */

// ─────────────────────────────────────────────
// STEP 1: EXACT STATIC ROUTES FIRST
// These must come before ANY /:param routes
// ─────────────────────────────────────────────

/**
 * @openapi
 * /hotel/bookings/my-bookings:
 *   get:
 *     tags: [Unified Bookings]
 *     summary: Get all my bookings across all services (hotel, flight, attraction)
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
router.get("/my-bookings", getMyUnifiedBookings); // ✅ GET static — safe before /:bookingId

/**
 * @openapi
 * /hotel/bookings:
 *   get:
 *     tags: [Hotel Bookings]
 *     summary: Get all hotel bookings (admin sees all, customers see own)
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
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", getBookings);

/**
 * @openapi
 * /hotel/bookings:
 *   post:
 *     tags: [Hotel Bookings]
 *     summary: Create a new hotel booking
 *     description: |
 *       Creates a hotel booking + a unified booking entry automatically.
 *       Pricing is calculated server-side: subtotal + 7.5% VAT + 2% service fee.
 *       The `referenceCode` in the response is what you use to track or cancel this booking.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - checkInDate
 *               - checkOutDate
 *             properties:
 *               roomId:
 *                 type: integer
 *                 example: 1
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-01"
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-05"
 *               numberOfGuests:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 2
 *               specialRequests:
 *                 type: string
 *                 nullable: true
 *                 example: "High floor, extra towels"
 *               cartId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Include if booking came from a cart checkout
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error, past date, or room not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       409:
 *         description: Room already booked for these dates
 *       500:
 *         description: Internal server error
 */
router.post("/", validateSchema(bookingSchema), createBookings);

// ─────────────────────────────────────────────
// STEP 2: NESTED STATIC SEGMENT ROUTES NEXT
// /unified/:param must come before /:bookingId
// because Express would match "unified" as bookingId
// ─────────────────────────────────────────────

/**
 * @openapi
 * /hotel/bookings/unified/{unifiedBookingId}/cancel:
 *   patch:
 *     tags: [Unified Bookings]
 *     summary: Cancel any booking (hotel, flight, or attraction) with automatic refund
 *     description: |
 *       Cancels a booking through the unified system. Refund policy:
 *       - **Hotel**: 100% refund if cancelled 48h+ before check-in, 50% within 24–48h, 0% under 24h
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
router.patch("/unified/:unifiedBookingId/cancel", cancelUnifiedBooking); // ✅ before /:bookingId

// ─────────────────────────────────────────────
// STEP 3: PARAMETERIZED ROUTES LAST
// /:bookingId will now only match after all
// static routes above have had first chance
// ─────────────────────────────────────────────

/**
 * @openapi
 * /hotel/bookings/{bookingId}:
 *   get:
 *     tags: [Hotel Bookings]
 *     summary: Get hotel booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking retrieved
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:bookingId", getBookingById);

/**
 * @openapi
 * /hotel/bookings/{bookingId}/cancel:
 *   patch:
 *     tags: [Hotel Bookings]
 *     summary: Cancel a hotel booking (no refund — use unified cancel for paid bookings)
 *     description: |
 *       Simple cancel for `pending` or `confirmed` bookings only.
 *       If the booking has been paid, use `PATCH /hotel/bookings/unified/{unifiedBookingId}/cancel` instead to get a refund.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Cannot cancel with current status
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 */
router.patch("/:bookingId/cancel", cancelBooking); // ✅ /cancel suffix makes this more specific than /:bookingId alone

/**
 * @openapi
 * /hotel/bookings/{bookingId}:
 *   patch:
 *     tags: [Hotel Bookings]
 *     summary: Update booking status or payment status (admin)
 *     description: |
 *       Valid status transitions:
 *       - `pending` → `confirmed`, `cancelled`
 *       - `confirmed` → `checked_in`, `cancelled`, `no_show`
 *       - `checked_in` → `checked_out`
 *       - Terminal states (`checked_out`, `cancelled`, `no_show`) are final
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed, refunded]
 *             example:
 *               status: confirmed
 *     responses:
 *       200:
 *         description: Updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Booking not found
 */
router.patch(
  "/:bookingId",
  validateSchema(updateBookingSchema),
  updateBookingById,
);

/**
 * @openapi
 * /hotel/bookings/{bookingId}:
 *   delete:
 *     tags: [Hotel Bookings]
 *     summary: Permanently delete a booking (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 *       403:
 *         description: Admin access required
 */
router.delete("/:bookingId", deleteBooking);

module.exports = router;
