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
 *           example: P4-401
 *         airlineId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         planeId:
 *           type: string
 *           format: uuid
 *         departureAirport:
 *           type: string
 *           example: LOS
 *           description: IATA airport code
 *         arrivalAirport:
 *           type: string
 *           example: ABV
 *         originCity:
 *           type: string
 *           example: Lagos
 *           nullable: true
 *         destinationCity:
 *           type: string
 *           example: Abuja
 *           nullable: true
 *         departureTime:
 *           type: string
 *           format: date-time
 *         arrivalTime:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: integer
 *           example: 70
 *           description: Auto-calculated from departure and arrival times
 *         price:
 *           type: number
 *           example: 45000
 *           description: Base economy price in NGN
 *         status:
 *           type: string
 *           enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *         gateNumber:
 *           type: string
 *           nullable: true
 *           example: B12
 *         terminal:
 *           type: string
 *           nullable: true
 *           example: "2"
 *         delayMinutes:
 *           type: integer
 *           example: 0
 *         delayReason:
 *           type: string
 *           nullable: true
 *         economyPrice:
 *           type: number
 *           example: 45000
 *         economySeats:
 *           type: integer
 *           example: 132
 *         economySold:
 *           type: integer
 *           example: 0
 *         businessPrice:
 *           type: number
 *           example: 67500
 *         businessSeats:
 *           type: integer
 *           example: 38
 *         businessSold:
 *           type: integer
 *         firstClassPrice:
 *           type: number
 *           example: 135000
 *         firstClassSeats:
 *           type: integer
 *           example: 19
 *         firstClassSold:
 *           type: integer
 *         availableSeats:
 *           type: integer
 *           description: Count of currently available seats (computed)
 *         airline:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             iataCode:
 *               type: string
 *             logoUrl:
 *               type: string
 *               nullable: true
 *         plane:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             model:
 *               type: string
 *             registration:
 *               type: string
 */

/**
 * @openapi
 * /flight/trip:
 *   get:
 *     tags: [Flights]
 *     summary: Search and list all flights
 *     description: |
 *       Returns paginated flights with available seat count.
 *       Supports filtering by route, date, airline, and city.
 *
 *       **Typical booking flow:**
 *       1. `GET /flight/trip?from=LOS&to=ABV&date=2026-08-01` ← search here
 *       2. `GET /flight/airplanes/{flightId}/seats?available=true` → pick a seat
 *       3. `POST /flight/bookings` → book with `flightId` + `seatId`
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Departure IATA airport code
 *         example: LOS
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Arrival IATA airport code
 *         example: ABV
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Travel date (YYYY-MM-DD) — filters entire day
 *         example: "2026-08-01"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *       - in: query
 *         name: airlineId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific airline
 *       - in: query
 *         name: originCity
 *         schema:
 *           type: string
 *         description: Filter by origin city name (partial match)
 *         example: Lagos
 *       - in: query
 *         name: destinationCity
 *         schema:
 *           type: string
 *         description: Filter by destination city name (partial match)
 *         example: Abuja
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
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAllFlights);

/**
 * @openapi
 * /flight/trip:
 *   post:
 *     tags: [Flights]
 *     summary: Create a flight with auto-generated seats (vendor only)
 *     description: |
 *       **Admin only.** Requires an existing, ACTIVE `planeId`.
 *       Seats are automatically created based on the plane's `totalSeats`.
 *       `durationMinutes` is auto-calculated from departure/arrival times.
 *
 *       **Seat auto-generation rules:**
 *       - First 10% of seats → First Class (3× base price, unless `firstClassPrice` is provided)
 *       - Next 20% of seats → Business Class (1.5× base price, unless `businessPrice` is provided)
 *       - Remaining 70% → Economy (base `price`, unless `economyPrice` is provided)
 *
 *       **Full creation order:**
 *       1. `POST /flight/airlines` → create airline
 *       2. `PATCH /flight/airlines/{id}/review` → admin approves
 *       3. `POST /flight/airplanes` → add plane (get `planeId`)
 *       4. `POST /flight/trip` → create flight ← you are here
 *       5. `GET /flight/airplanes/{flightId}/seats` → user views seats
 *       6. `POST /flight/bookings` → user books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightNumber, planeId, departureAirport, arrivalAirport, departureTime, arrivalTime, price]
 *             properties:
 *               flightNumber:
 *                 type: string
 *                 example: P4-401
 *               airlineId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Optional — link to an approved airline
 *               planeId:
 *                 type: string
 *                 format: uuid
 *                 description: Must exist and have status ACTIVE — determines total seats
 *               departureAirport:
 *                 type: string
 *                 example: LOS
 *                 description: IATA airport code (auto-uppercased)
 *               arrivalAirport:
 *                 type: string
 *                 example: ABV
 *               originCity:
 *                 type: string
 *                 example: Lagos
 *                 nullable: true
 *               destinationCity:
 *                 type: string
 *                 example: Abuja
 *                 nullable: true
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
 *                 description: Base price in NGN — used as economy price if economyPrice not set
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, DELAYED, BOARDING, DEPARTED, ARRIVED, CANCELLED]
 *                 default: SCHEDULED
 *               gateNumber:
 *                 type: string
 *                 nullable: true
 *                 example: B12
 *               terminal:
 *                 type: string
 *                 nullable: true
 *                 example: "2"
 *               economyPrice:
 *                 type: number
 *                 nullable: true
 *                 description: Overrides auto-calculated economy price
 *               economySeats:
 *                 type: integer
 *                 nullable: true
 *                 description: Overrides auto-calculated economy seat count
 *               businessPrice:
 *                 type: number
 *                 nullable: true
 *               businessSeats:
 *                 type: integer
 *                 nullable: true
 *               firstClassPrice:
 *                 type: number
 *                 nullable: true
 *               firstClassSeats:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Flight and seats created
 *       400:
 *         description: Plane not ACTIVE or arrival before departure
 *       404:
 *         description: Plane or airline not found
 *       409:
 *         description: Flight number already exists
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Unauthorized
 */
router.post("/", restrictTo("vendor"), createFlight);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   get:
 *     tags: [Flights]
 *     summary: Get flight by ID
 *     description: Returns full flight details including airline, plane, add-ons, and available seat count.
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
 *       401:
 *         description: Unauthorized
 */
router.get("/:flightId", getFlightById);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   patch:
 *     tags: [Flights]
 *     summary: Update flight details (admin only)
 *     description: |
 *       Update any flight detail except `planeId`.
 *       `durationMinutes` is auto-recalculated if departure or arrival times change.
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
 *               originCity:
 *                 type: string
 *               destinationCity:
 *                 type: string
 *               departureTime:
 *                 type: string
 *                 format: date-time
 *               arrivalTime:
 *                 type: string
 *                 format: date-time
 *               price:
 *                 type: number
 *               gateNumber:
 *                 type: string
 *               terminal:
 *                 type: string
 *               delayMinutes:
 *                 type: integer
 *               delayReason:
 *                 type: string
 *               economyPrice:
 *                 type: number
 *               businessPrice:
 *                 type: number
 *               firstClassPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Flight updated successfully
 *       400:
 *         description: Arrival time before departure time
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Flight not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:flightId", restrictTo("admin"), updateFlightById);

/**
 * @openapi
 * /flight/trip/{flightId}/status:
 *   patch:
 *     tags: [Flights]
 *     summary: Update flight status only (admin only)
 *     description: |
 *       Use this for real-time operational updates (delays, boarding calls, departures).
 *       When setting status to `DELAYED`, also provide `delayMinutes` and optionally `delayReason`.
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
 *               delayMinutes:
 *                 type: integer
 *                 description: Required when status is DELAYED
 *                 example: 45
 *               delayReason:
 *                 type: string
 *                 description: Optional reason for the delay
 *                 example: Air traffic congestion
 *           examples:
 *             delay:
 *               summary: Mark as delayed
 *               value:
 *                 status: DELAYED
 *                 delayMinutes: 45
 *                 delayReason: Air traffic congestion
 *             boarding:
 *               summary: Open boarding
 *               value:
 *                 status: BOARDING
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status value
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Flight not found
 *       401:
 *         description: Unauthorized
 */
router.patch("/:flightId/status", restrictTo("admin"), updateFlightStatus);

/**
 * @openapi
 * /flight/trip/{flightId}:
 *   delete:
 *     tags: [Flights]
 *     summary: Soft-delete a flight (admin only)
 *     description: |
 *       Soft-deletes the flight by setting `deletedAt`.
 *       **Blocked** if the flight has active (non-cancelled) bookings.
 *       Soft-deleted flights are excluded from all listings and seat queries.
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
 *         description: Flight deleted successfully
 *       400:
 *         description: Cannot delete — active bookings exist
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Flight not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:flightId", restrictTo("admin"), deleteFlightById);

module.exports = router;
