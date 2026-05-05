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
 *     Airplane:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         model:
 *           type: string
 *           example: Boeing 737-800
 *         tailNumber:
 *           type: string
 *           example: 5N-ABC
 *         airline:
 *           type: string
 *           example: Air Peace
 *         capacity:
 *           type: integer
 *           example: 189
 *         totalSeats:
 *           type: integer
 *           example: 189
 */

/**
 * @openapi
 * /flight/airplanes:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get all airplanes (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of airplanes
 */
router.get("/", restrictTo("admin"), getAllAirplanes);

/**
 * @openapi
 * /flight/airplanes:
 *   post:
 *     tags: [Airplanes]
 *     summary: Create airplane (admin only)
 *     description: |
 *       Creates an airplane. When you create a **Flight** using this airplane's ID,
 *       seats are auto-generated based on `capacity`.
 *       Seat layout: 10% First Class (3x price), 20% Business (1.5x), 70% Economy (base price).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [model, capacity, airline, tailNumber]
 *             properties:
 *               model:
 *                 type: string
 *                 example: Boeing 737-800
 *               capacity:
 *                 type: integer
 *                 example: 189
 *                 description: Total seats — auto-used when flight is created
 *               airline:
 *                 type: string
 *                 example: Air Peace
 *               tailNumber:
 *                 type: string
 *                 example: 5N-ABC
 *                 description: Must be unique
 *     responses:
 *       201:
 *         description: Airplane created
 *       409:
 *         description: Tail number already exists
 *       403:
 *         description: Admin access required
 */
router.post("/", restrictTo("admin"), createAirplane);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get airplane by ID (admin only)
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
 *         description: Airplane found
 *       404:
 *         description: Airplane not found
 */
router.get("/:airplaneId", restrictTo("admin"), getAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   patch:
 *     tags: [Airplanes]
 *     summary: Update airplane (admin only)
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
 *               model:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               airline:
 *                 type: string
 *               tailNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 *       404:
 *         description: Not found
 */
router.patch("/:airplaneId", restrictTo("admin"), updateAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{airplaneId}:
 *   delete:
 *     tags: [Airplanes]
 *     summary: Delete airplane (admin only)
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
 *         description: Deleted successfully
 *       404:
 *         description: Not found
 */
router.delete("/:airplaneId", restrictTo("admin"), deleteAirplaneById);

/**
 * @openapi
 * /flight/airplanes/{flightId}/seats:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get seats for a flight (users call this before booking)
 *     description: |
 *       Returns all seats grouped by class (First, Business, Economy).
 *       Use the seat `id` as `seatId` when calling `POST /flight/bookings`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *           enum: [First, Business, Economy]
 *         description: Filter by seat class
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: Seats grouped by class
 *       404:
 *         description: Flight not found
 */
router.get("/:flightId/seats", getSeatsByFlight);

module.exports = router;
