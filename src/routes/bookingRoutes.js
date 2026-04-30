// bookingRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate: protect } = require("../middleware/auth");
const validateSchema = require("../middleware/validate"); // ✅ Add this
const { bookingSchema } = require("../model/bookingModel");
const {
  getBookings,
  getBookingById,
  createBookings,
  updateBookingById,
  deleteBooking,
  cancelBooking,
} = require("../controllers/bookingController");

router.use(protect);

/**
 * @openapi
 * /bookings/getBookings:
 *   get:
 *     tags: [Bookings]
 *     summary: Get all bookings for logged-in user
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
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/getBookings", getBookings);

/**
 * @openapi
 * /bookings/createBookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     description: Total price is automatically calculated from room price and number of nights
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
 *                 description: ID of the room being booked
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-25"
 *                 description: Check-in date (YYYY-MM-DD)
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-30"
 *                 description: Check-out date (YYYY-MM-DD)
 *               numberOfGuests:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 2
 *                 description: Number of guests staying
 *               specialRequests:
 *                 type: string
 *                 example: "Extra pillows, high floor"
 *                 description: Any special requests for the booking
 *             example:
 *               roomId: 1
 *               checkInDate: "2024-12-25"
 *               checkOutDate: "2024-12-30"
 *               numberOfGuests: 2
 *               specialRequests: "Ocean view room if possible"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Booking created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     totalPrice:
 *                       type: number
 *                       example: 500
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         roomPrice:
 *                           type: number
 *                           example: 100
 *                         numberOfNights:
 *                           type: integer
 *                           example: 5
 *                         roomNumber:
 *                           type: string
 *                           example: "101"
 *       400:
 *         description: Validation error or room not available
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       409:
 *         description: Room already booked for these dates
 *       500:
 *         description: Internal server error
 */
router.post("/createBookings", validateSchema(bookingSchema), createBookings);

/**
 * @openapi
 * /bookings/{bookingId}/getBookingsById:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/:bookingId/getBookingsById", getBookingById);

/**
 * @openapi
 * /bookings/{bookingId}/update:
 *   patch:
 *     tags: [Bookings]
 *     summary: Update a booking
 *     description: Total price is automatically recalculated if dates change
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
 *                 enum: [pending, confirmed, checked_in, checked_out, cancelled, no_show]
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               numberOfGuests:
 *                 type: integer
 *                 minimum: 1
 *               specialRequests:
 *                 type: string
 *             example:
 *               status: "confirmed"
 *               checkInDate: "2024-12-26"
 *               checkOutDate: "2024-12-31"
 *               numberOfGuests: 3
 *               specialRequests: "Late check-in requested"
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid status transition or validation error
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Room already booked for these dates
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/:bookingId/update", updateBookingById);

/**
 * @openapi
 * /bookings/{bookingId}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Cannot cancel booking with current status
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/:bookingId/cancel", cancelBooking);

/**
 * @openapi
 * /bookings/{bookingId}/removeBooking:
 *   delete:
 *     tags: [Bookings]
 *     summary: Delete a booking (admin only)
 *     description: Permanently removes a booking from the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
router.delete("/:bookingId/removeBooking", deleteBooking);

module.exports = router;
