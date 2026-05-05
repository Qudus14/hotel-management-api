const express = require("express");
const router = express.Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const validateSchema = require("../../middleware/validate");
const {
  flightBookingSchema,
  updateFlightBookingSchema,
} = require("../../model/flight.model/bookingModel");
const {
  createFlightBooking,
  getAllFlightBookings,
  getFlightBookingById,
  updateFlightBookingByStatus,
  cancelFlightBookingById,
  deleteFlightBookingById,
} = require("../../controllers/flight.controller/bookingController");
const {
  getAllAddOns,
  createAddOn,
} = require("../../controllers/flight.controller/addOnController");

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     FlightSegmentInput:
 *       type: object
 *       required: [flightId, seatId]
 *       properties:
 *         flightId:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         seatId:
 *           type: string
 *           format: uuid
 *           example: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *
 *     FlightBookingResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [BOOKED, PAID, CANCELLED, BOARDED]
 *         totalPrice:
 *           type: number
 *           example: 185000
 *         qrCode:
 *           type: string
 *           nullable: true
 *           description: Base64 QR boarding pass (generated when status becomes PAID)
 *         segments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               flight:
 *                 type: object
 *                 properties:
 *                   flightNumber:
 *                     type: string
 *                   departureAirport:
 *                     type: string
 *                   arrivalAirport:
 *                     type: string
 *                   departureTime:
 *                     type: string
 *                     format: date-time
 *                   arrivalTime:
 *                     type: string
 *                     format: date-time
 *               seat:
 *                 type: object
 *                 properties:
 *                   seatNumber:
 *                     type: string
 *                   class:
 *                     type: string
 *                   price:
 *                     type: number
 *         addOns:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               addOn:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   price:
 *                     type: number
 *
 *     FlightUnifiedSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         referenceCode:
 *           type: string
 *           example: FLT-M5X3K-AB12
 *         bookingStatus:
 *           type: string
 *           example: PENDING_PAYMENT
 *         pricing:
 *           type: object
 *           properties:
 *             subtotal:
 *               type: number
 *             tax:
 *               type: number
 *               description: 7.5% VAT
 *             serviceFee:
 *               type: number
 *               description: 2% service fee
 *             totalPrice:
 *               type: number
 *             currency:
 *               type: string
 *               example: NGN
 */

// ─────────────────────────────────────────────
// FLIGHT BOOKING ROUTES
// ─────────────────────────────────────────────

/**
 * @openapi
 * /flight/bookings:
 *   get:
 *     tags: [Flight Bookings]
 *     summary: Get all flight bookings (admin sees all, customers see own)
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
router.get("/", getAllFlightBookings);

/**
 * @openapi
 * /flight/bookings:
 *   post:
 *     tags: [Flight Bookings]
 *     summary: Book a flight (single or multi-city with add-ons)
 *     description: |
 *       Books one or more flight legs in a single atomic transaction.
 *       - Seats are validated and locked immediately
 *       - A **UnifiedBooking** entry is created automatically for payment and cancellation tracking
 *       - Pricing = seat prices + add-ons + 7.5% VAT + 2% service fee
 *       - `userId` is taken from the JWT token — do **not** send it in the body
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [segments]
 *             properties:
 *               segments:
 *                 type: array
 *                 minItems: 1
 *                 description: Each item is one flight leg. Send 2 for a return trip.
 *                 items:
 *                   $ref: '#/components/schemas/FlightSegmentInput'
 *               addOnIds:
 *                 type: array
 *                 description: Optional add-on UUIDs (baggage, meals, etc.)
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: []
 *               cartId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Include if booking came from cart checkout
 *           examples:
 *             one_way:
 *               summary: One-way flight
 *               value:
 *                 segments:
 *                   - flightId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     seatId: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                 addOnIds: []
 *             return_trip:
 *               summary: Return trip with baggage
 *               value:
 *                 segments:
 *                   - flightId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     seatId: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                   - flightId: "c3d4e5f6-a7b8-9012-cdef-123456789012"
 *                     seatId: "d4e5f6a7-b8c9-0123-defa-234567890123"
 *                 addOnIds:
 *                   - "e5f6a7b8-c9d0-1234-efab-345678901234"
 *     responses:
 *       201:
 *         description: Flight booked successfully
 *       400:
 *         description: Seat taken, flight cancelled, or add-on not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", validateSchema(flightBookingSchema), createFlightBooking);

/**
 * @openapi
 * /flight/bookings/{bookingId}:
 *   get:
 *     tags: [Flight Bookings]
 *     summary: Get flight booking by ID
 *     description: Returns full booking with segments, seat details, and add-ons. Customers can only view their own bookings.
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
 *         description: Booking retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:bookingId", getFlightBookingById);

/**
 * @openapi
 * /flight/bookings/{bookingId}/status:
 *   patch:
 *     tags: [Flight Bookings]
 *     summary: Update flight booking status (admin only)
 *     description: |
 *       Valid transitions:
 *       - `BOOKED` → `PAID` (generates QR boarding pass), `CANCELLED`
 *       - `PAID` → `BOARDED`, `CANCELLED`
 *       - `BOARDED` and `CANCELLED` are terminal states
 *
 *       When status becomes **PAID**, a Base64 QR code boarding pass is auto-generated and stored.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [BOOKED, PAID, CANCELLED, BOARDED]
 *                 example: PAID
 *     responses:
 *       200:
 *         description: Status updated. QR code included if status is PAID.
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:bookingId/status",
  restrictTo("admin"),
  validateSchema(updateFlightBookingSchema),
  updateFlightBookingByStatus,
);

/**
 * @openapi
 * /flight/bookings/{bookingId}/cancel:
 *   patch:
 *     tags: [Flight Bookings]
 *     summary: Cancel a flight booking and release all seats
 *     description: |
 *       Cancels the booking and releases all locked seats back to available.
 *       - Customers can only cancel their own bookings
 *       - Cannot cancel already-cancelled or boarded flights
 *       - For refunds, use the unified cancel endpoint (`/hotel/bookings/unified/:id/cancel`)
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
 *         description: Booking cancelled and seats released
 *       400:
 *         description: Already cancelled or boarded
 *       403:
 *         description: Access denied
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:bookingId/cancel", cancelFlightBookingById);

/**
 * @openapi
 * /flight/bookings/{bookingId}:
 *   delete:
 *     tags: [Flight Bookings]
 *     summary: Hard delete a flight booking (admin only)
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
 *         description: Booking deleted
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Unauthorized
 */
router.delete("/:bookingId", restrictTo("admin"), deleteFlightBookingById);

// ─────────────────────────────────────────────
// ADD-ON ROUTES
// ─────────────────────────────────────────────

/**
 * @openapi
 * /flight/bookings/add-ons:
 *   get:
 *     tags: [Flight Add-Ons]
 *     summary: Get all available flight add-ons
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of add-ons
 */
router.get("/add-ons", getAllAddOns);

/**
 * @openapi
 * /flight/bookings/add-ons:
 *   post:
 *     tags: [Flight Add-Ons]
 *     summary: Create a new add-on (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, name, price]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [BAGGAGE, MEAL, WIFI, PRIORITY_BOARDING]
 *               name:
 *                 type: string
 *                 example: "Extra 23kg Baggage"
 *               price:
 *                 type: number
 *                 example: 15000
 *     responses:
 *       201:
 *         description: Add-on created
 *       403:
 *         description: Admin access required
 */
router.post("/add-ons", restrictTo("admin"), createAddOn);

module.exports = router;
