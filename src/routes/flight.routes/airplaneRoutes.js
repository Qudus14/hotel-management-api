const router = require("express").Router();
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createAirplane,
  getAllAirplanes,
  getAirplaneById,
  updateAirplaneById,
  deleteAirplaneById,
} = require("../../controllers/flight.controller/airplaneController");
const {
  getSeatsByFlight,
} = require("../../controllers/flight.controller/seatController");

router.use(authenticate);

/**
 * @openapi
 * components:
 *   schemas:
 *     Plane:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         airlineId:
 *           type: string
 *           format: uuid
 *         registration:
 *           type: string
 *           example: 5N-BVE
 *           description: Unique aircraft registration/tail number
 *         model:
 *           type: string
 *           example: Boeing 737-800
 *         manufacturer:
 *           type: string
 *           example: Boeing
 *         totalSeats:
 *           type: integer
 *           example: 189
 *           description: Used to auto-generate seats when a flight is created
 *         status:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, RETIRED]
 *           default: ACTIVE
 *         airline:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             iataCode:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /flight/airplanes:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get all planes (vendor only)
 *     description: Returns all planes. Optionally filter by airline or status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: airlineId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter planes by airline
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, MAINTENANCE, RETIRED]
 *         description: Filter by plane status
 *     responses:
 *       200:
 *         description: Planes retrieved successfully
 *       403:
 *         description: vendor access required
 *       401:
 *         description: Unauthorized
 */
router.get("/", restrictTo("vendor"), getAllAirplanes);

/**
 * @openapi
 * /flight/airplanes:
 *   post:
 *     tags: [Airplanes]
 *     summary: Add a plane to an airline (vendor only)
 *     description: |
 *       Creates a plane linked to an approved airline.
 *       When you later create a **Flight** using this plane's `id` (as `planeId`),
 *       seats are auto-generated based on `totalSeats`.
 *
 *       **Seat auto-generation rules (applied at flight creation):**
 *       - First 10% → First Class (3× base price)
 *       - Next 20% → Business Class (1.5× base price)
 *       - Remaining 70% → Economy Class (base price)
 *
 *       **Full creation order:**
 *       1. `POST /flight/airlines` → create airline
 *       2. `PATCH /flight/airlines/{id}/review` → vendor approves airline
 *       3. `POST /flight/airplanes` → add plane to airline ← you are here
 *       4. `POST /flight/trip` → create flight using `planeId`
 *       5. `GET /flight/airplanes/{flightId}/seats` → user views available seats
 *       6. `POST /flight/bookings` → user books with `flightId` + `seatId`
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [airlineId, registration, model, manufacturer, totalSeats]
 *             properties:
 *               airlineId:
 *                 type: string
 *                 format: uuid
 *                 description: Must be an approved airline
 *               registration:
 *                 type: string
 *                 example: 5N-BVE
 *                 description: Unique aircraft registration number
 *               model:
 *                 type: string
 *                 example: Boeing 737-800
 *               manufacturer:
 *                 type: string
 *                 example: Boeing
 *               totalSeats:
 *                 type: integer
 *                 example: 189
 *                 description: Total capacity — determines seats auto-generated per flight
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MAINTENANCE, RETIRED]
 *                 default: ACTIVE
 *     responses:
 *       201:
 *         description: Plane created successfully
 *       400:
 *         description: Airline not found or not yet approved
 *       403:
 *         description: vendor access required
 *       404:
 *         description: Airline not found
 *       409:
 *         description: Registration number already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/", restrictTo("vendor"), createAirplane);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get plane by ID (vendor only)
 *     description: Returns plane details including airline info, seat map, and flight count.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airplaneId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plane found
 *       403:
 *         description: vendor access required
 *       404:
 *         description: Plane not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:airplaneId", restrictTo("vendor"), getAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   patch:
 *     tags: [Airplanes]
 *     summary: Update plane details (vendor only)
 *     description: |
 *       Update any plane field. Note: changing `totalSeats` does **not**
 *       retroactively update seats on existing flights.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airplaneId
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
 *               registration:
 *                 type: string
 *               model:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               totalSeats:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, MAINTENANCE, RETIRED]
 *           example:
 *             status: MAINTENANCE
 *     responses:
 *       200:
 *         description: Plane updated successfully
 *       403:
 *         description: vendor access required
 *       404:
 *         description: Plane not found
 *       409:
 *         description: Registration number already exists
 *       401:
 *         description: Unauthorized
 */
router.patch("/:airplaneId", restrictTo("vendor"), updateAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   delete:
 *     tags: [Airplanes]
 *     summary: Delete a plane (vendor only)
 *     description: |
 *       Permanently deletes a plane.
 *       **Blocked** if the plane has any associated flights.
 *       Use `PATCH /{airplaneId}` with `status: RETIRED` to decommission instead.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: airplaneId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Plane deleted successfully
 *       400:
 *         description: Cannot delete — plane has associated flights
 *       403:
 *         description: vendor access required
 *       404:
 *         description: Plane not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:airplaneId", restrictTo("vendor"), deleteAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{flightId}/seats:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get seats for a flight (all authenticated users)
 *     description: |
 *       Returns all seats for a given flight, grouped by class (First, Business, Economy).
 *       Use the seat `id` as `seatId` when calling `POST /flight/bookings`.
 *
 *       **Typical flow:**
 *       1. `GET /flight/trip?from=LOS&to=ABV&date=2026-08-01` → find a flight
 *       2. `GET /flight/airplanes/{flightId}/seats?available=true` → pick a seat ← you are here
 *       3. `POST /flight/bookings` → book with `flightId` + `seatId`
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Flight ID (not airplane ID)
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *           enum: [First, Business, Economy]
 *         description: Filter by seat class
 *         example: Economy
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by availability — pass `false` to see all seats
 *     responses:
 *       200:
 *         description: Seats grouped by class
 *       404:
 *         description: Flight not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:flightId/seats", getSeatsByFlight);

module.exports = router;
