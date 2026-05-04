const router = require("express").Router();
const {
  createFlight,
  getAllFlights,
  getFlightById,
  updateFlightById,
  updateFlightByStatus,
  deleteFlightById,
  updateFlightStatus,
} = require("../../controllers/flight.controller/tripController");
const validateSchema = require("../../middleware/validate");
const { authenticate, restrictTo } = require("../../middleware/auth");
const {
  createAddOn,
  getAllAddOns,
} = require("../../controllers/flight.controller/addOnController");

// All routes in this file are protected and restricted to admins
router.use(authenticate);

/**
 * @openapi
 * /flight/trip/createFlight:
 *   post:
 *     tags: [Flights]
 *     summary: Create a new flight trip
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, price]
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
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED,DELAYED,BOARDING,DEPARTED,ARRIVED,CANCELLED]
 *               airplaneId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Flight created successfully
 */

/**
 * @openapi
 * /flight/trip/getAllFlights:
 *   get:
 *     tags: [Flights]
 *     summary: Get all flights
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flights retrieved successfully
 */

/**
 * @openapi
 * /flight/trip/getFlightById/{flightId}:
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
 *     responses:
 *       200:
 *         description: Flight retrieved successfully
 */

/**
 * @openapi
 * /flight/trip/updateFlightStatus/{flightId}:
 *   patch:
 *     tags: [Flights]
 *     summary: Update flight status (Delayed, Arrived, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum: [SCHEDULED,DELAYED,BOARDING,DEPARTED,ARRIVED,CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 */

router.post("/createFlight", createFlight);
router.get("/getAllFlights", getAllFlights);
router.get("/getFlightById/:flightId", getFlightById);
router.put("/updateFlightById/:flightId", updateFlightById);
router.patch("/updateFlightStatus/:flightId", updateFlightStatus);

router.delete(
  "/deleteFlightById/:flightId",
  restrictTo("admin"),
  deleteFlightById,
);

module.exports = router;
