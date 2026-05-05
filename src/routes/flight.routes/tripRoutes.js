const router = require("express").Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createFlight,
  getAllFlights,
  getFlightById,
  updateFlightById,
  updateFlightStatus,
  deleteFlightById,
} = require("../../controllers/flight.controller/tripController");

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Flight:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         flightNumber:
 *           type: string
 *           example: NG401
 *         departureAirport:
 *           type: string
 *           example: LOS
 *         arrivalAirport:
 *           type: string
 *           example: ABV
 *         departureTime:
 *           type: string
 *           format: date-time
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *         price:
 *           type: number
 *           example: 45000
 *         status:
 *           type: string
 *           enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *         availableSeats:
 *           type: integer
 *           description: Count of seats still available
 */

/**
 * @openapi
 * /flight/trip:
 *   get:
 *     tags: [Flights]
 *     summary: Search and list all flights
 *     description: |
 *       Supports filtering by route and date.
 *       Results include `availableSeats` count.
 *       After finding a flight, call `GET /flight/airplanes/{flightId}/seats` to see bookable seats.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Departure airport code (e.g. LOS)
 *         example: LOS
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Arrival airport code (e.g. ABV)
 *         example: ABV
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Travel date (YYYY-MM-DD)
 *         example: "2026-08-01"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Flights retrieved successfully
 */
router.get("/", getAllFlights);

/**
 * @openapi
 * /flight/trip:
 *   post:
 *     tags: [Flights]
 *     summary: Create a flight with auto-generated seats (admin only)
 *     description: |
 *       **Admin only.** Requires an existing `airplaneId`.
 *       Seats are automatically created based on airplane capacity.
 *
 *       **Seat auto-generation rules:**
 *       - First 10% of seats → First Class (3x base price)
 *       - Next 20% of seats → Business Class (1.5x base price)
 *       - Remaining 70% → Economy Class (base price)
 *
 *       **Correct creation order:**
 *       1. `POST /flight/airplanes` → get airplaneId
 *       2. `POST /flight/trip` → creates flight + all seats automatically
 *       3. `GET /flight/airplanes/{flightId}/seats` → user picks a seat
 *       4. `POST /flight/bookings` → user books with flightId + seatId
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, price, airplaneId]
 *             properties:
 *               flightNumber:
 *                 type: string
 *                 example: NG401
 *               departureAirport:
 *                 type: string
 *                 example: LOS
 *                 description: IATA airport code
 *               arrivalAirport:
 *                 type: string
 *                 example: ABV
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-01T08:00:00.000Z"
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-01T09:10:00.000Z"
 *               price:
 *                 type: number
 *                 example: 45000
 *                 description: Base economy price in NGN
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *                 default: SCHEDULED
 *               airplaneId:
 *                 type: string
 *                 format: uuid
 *                 description: Must exist — determines total seats and layout
 *     responses:
 *       201:
 *         description: Flight and seats created
 *       409:
 *         description: Flight number already exists
 *       404:
 *         description: Airplane not found
 */
router.post("/", restrictTo("admin"), createFlight);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   get:
 *     tags: [Flights]
 *     summary: Get flight by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Flight found
 *       404:
 *         description: Flight not found
 */
router.get("/:flightId", getFlightById);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   patch:
 *     tags: [Flights]
 *     summary: Update flight details (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
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
 *               flightNumber:
 *                 type: string
 *               departureAirport:
 *                 type: string
 *               arrivalAirport:
 *                 type: string
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Flight updated
 *       404:
 *         description: Not found
 */
router.patch("/:flightId", restrictTo("admin"), updateFlightById);

/**
 * @openapi
 * /flight/trip/{flightId}/status:
 *   patch:
 *     tags: [Flights]
 *     summary: Update flight status only (admin only)
 *     description: Use this for real-time updates like delays, boarding calls, etc.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
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
 *                 enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *                 example: DELAYED
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Flight not found
 */
router.patch("/:flightId/status", restrictTo("admin"), updateFlightStatus);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   delete:
 *     tags: [Flights]
 *     summary: Delete flight (admin only)
 *     description: Blocked if the flight has active (non-cancelled) bookings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       400:
 *         description: Cannot delete — active bookings exist
 *       404:
 *         description: Not found
 */
router.delete("/:flightId", restrictTo("admin"), deleteFlightById);

module.exports = router;
