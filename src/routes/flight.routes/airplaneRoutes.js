const router = require("express").Router();
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
const validateSchema = require("../../middleware/validate");
const { authenticate, restrictTo } = require("../../middleware/auth");

// All routes in this file are protected and restricted to admins
router.use(authenticate);
router.use(restrictTo("admin"));

/**
 * @openapi
 * /flight/airplanes/createAirplane:
 *   post:
 *     tags: [Airplanes]
 *     summary: Create a new airplane
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [model, capacity]
 *             properties:
 *               model:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               airline:
 *                 type: string
 *               tailNumber:
 *                 type: string
 *               totalSeats:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Airplane created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/createAirplane", createAirplane);

/**
 * @openapi
 * /flight/airplanes/getAllAirplanes:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get all airplanes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of airplanes retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/getAllAirplanes", getAllAirplanes);

/**
 * @openapi
 * /flight/airplanes/getAirplaneById/{id}:
 *   get:
 *     tags: [Airplanes]
 *     summary: Get airplane by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Airplane retrieved successfully
 *       404:
 *         description: Airplane not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/getAirplaneById/:id", getAirplaneById);

/**
 * @openapi
 * /flight/airplanes/updateAirplaneById/{id}:
 *   patch:
 *     tags: [Airplanes]
 *     summary: Update airplane by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
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
 *               totalSeats:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Airplane updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Airplane not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/updateAirplaneById/:airplaneId", updateAirplaneById);

/**
 * @openapi
 * /flight/airplanes/deleteAirplaneById/{id}:
 *   delete:
 *     tags: [Airplanes]
 *     summary: Delete airplane by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Airplane deleted successfully
 *       404:
 *         description: Airplane not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/deleteAirplaneById/:id", deleteAirplaneById);

/**
 * @openapi
 * /flight/airplanes/getSeatsByFlight/{flightId}:  # Added {flightId} here
 *   get:
 *     tags: [Airplanes]
 *     summary: Get seats by flight
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId   # Must match the name in the curly braces and route
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of seats retrieved successfully
 *       400:
 *         description: Invalid flightId
 */
router.get("/getSeatsByFlight/:flightId", getSeatsByFlight);

module.exports = router;
