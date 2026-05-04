const express = require("express");
const router = express.Router();

const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  updateFlightBookingByStatus,
  deleteFlightBookingById,
  getFlightBookingById,
  getAllFlightBookings,
  createFlightBooking,
  cancelFlightBookingById,
} = require("../../controllers/flight.controller/bookingController");
const {
  getAllAddOns,
  createAddOn,
} = require("../../controllers/flight.controller/addOnController");

// Global middleware for these routes
router.use(authenticate);

/**
 * @openapi
 * /flight/bookings/createFlightBooking:
 *   post:
 *     tags: [Flight Bookings]
 *     summary: Create a new flight booking (Supports Multi-City & Add-Ons)
 *     description: |
 *       Allows a user to book multiple flight legs (segments) in one transaction.
 *       Includes optional add-ons like baggage and meals.
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
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the user making the booking.
 *               segments:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of flight legs (e.g., Outbound and Return).
 *                 items:
 *                   type: object
 *                   properties:
 *                     flightId:
 *                       type: string
 *                       format: uuid
 *                     seatId:
 *                       type: string
 *                       format: uuid
 *               addOnIds:
 *                 type: array
 *                 description: List of UUIDs from the AddOn table (Baggage, Meals, etc.).
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Trip booked successfully.
 *       400:
 *         description: Invalid input or seat already taken.
 */
router.post("/createFlightBooking", createFlightBooking);

/**
 * @openapi
 * /flight/bookings/getAllFlightBookings:
 *   get:
 *     tags: [Flight Bookings]
 *     summary: Get all flight bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all flight bookings.
 */
router.get("/getAllFlightBookings", getAllFlightBookings);

/**
 * @openapi
 * /flight/bookings/getFlightBookingById/{bookingId}:
 *   get:
 *     tags: [Flight Bookings]
 *     summary: Get detailed booking info
 *     description: Returns a booking with its segments, flight details, and selected add-ons.
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
 *         description: Booking details retrieved successfully.
 *       404:
 *         description: Booking not found.
 */
router.get("/getFlightBookingById/:bookingId", getFlightBookingById);

/**
 * @openapi
 * /flight/bookings/updateFlightBookingStatus/{bookingId}:
 *   patch:
 *     tags: [Flight Bookings]
 *     summary: Update booking status (Admin/Payment Gateway)
 *     description: Updates the status. If updated to 'PAID' or 'BOARDED', a QR boarding pass is generated.
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
 *         description: Status updated. QR code generated if applicable.
 */
router.patch(
  "/updateFlightBookingStatus/:bookingId",
  restrictTo("admin"),
  updateFlightBookingByStatus,
);

/**
 * @openapi
 * /flight/bookings/cancelFlightBooking/{bookingId}:
 *   put:
 *     tags: [Flight Bookings]
 *     summary: Cancel a flight booking
 *     description: Cancels the entire trip and releases all associated seats back to 'available'.
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
 *         description: Booking cancelled and seats released.
 */
router.put("/cancelFlightBooking/:bookingId", cancelFlightBookingById);

/**
 * @openapi
 * /flight/bookings/deleteFlightBooking/{bookingId}:
 *   delete:
 *     tags: [Flight Bookings]
 *     summary: Hard delete a booking record
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
 *         description: Booking deleted successfully.
 */
router.delete(
  "/deleteFlightBooking/:bookingId",
  restrictTo("admin"),
  deleteFlightBookingById,
);

/**
 * @openapi
 * /flight/bookings/addOns:
 *   post:
 *     tags: [Flight Bookings]
 *     summary: Create a new Add-On (Baggage/Meal)
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
 *                 enum: [BAGGAGE, MEAL, WIFI, LOUNGE]
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Add-On created
 */
router.post("/addOns", restrictTo("admin"), createAddOn);

/**
 * @openapi
 * /flight/bookings/getAllAddOns:
 *   get:
 *     tags: [Flight Bookings]
 *     summary: Get all available add-ons
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of add-ons
 */
router.get("/getAllAddOns", getAllAddOns);

module.exports = router;
