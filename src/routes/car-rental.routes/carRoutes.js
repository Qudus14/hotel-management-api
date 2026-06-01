const express = require("express");
const router = express.Router();
const {
  createCar,
  getAllCars,
  getCarById,
  getMyCars,
  updateCar,
  deleteCar,
} = require("../../controllers/car-rental.controller/carController");
const { restrictTo } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car listing and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Car:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         carStoreId:
 *           type: string
 *         categoryId:
 *           type: string
 *           nullable: true
 *         pickupLocationId:
 *           type: string
 *           nullable: true
 *         make:
 *           type: string
 *           example: Toyota
 *         model:
 *           type: string
 *           example: Camry
 *         year:
 *           type: integer
 *           example: 2022
 *         color:
 *           type: string
 *           example: Black
 *         plateNumber:
 *           type: string
 *           example: ABC-1234
 *         transmission:
 *           type: string
 *           enum: [AUTOMATIC, MANUAL]
 *         seats:
 *           type: integer
 *           example: 5
 *         status:
 *           type: string
 *           enum: [AVAILABLE, RENTED, UNAVAILABLE, MAINTENANCE]
 *           default: AVAILABLE
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example: ["AC", "GPS", "Bluetooth"]
 *         depositRequired:
 *           type: number
 *           example: 50000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCarInput:
 *       type: object
 *       required:
 *         - make
 *         - model
 *         - plateNumber
 *       properties:
 *         categoryId:
 *           type: string
 *         pickupLocationId:
 *           type: string
 *         make:
 *           type: string
 *           example: Toyota
 *         model:
 *           type: string
 *           example: Camry
 *         year:
 *           type: integer
 *           example: 2022
 *         color:
 *           type: string
 *           example: Black
 *         plateNumber:
 *           type: string
 *           example: ABC-1234
 *         transmission:
 *           type: string
 *           enum: [AUTOMATIC, MANUAL]
 *         seats:
 *           type: integer
 *           example: 5
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         depositRequired:
 *           type: number
 *           example: 50000
 *
 *     UpdateCarInput:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: string
 *         pickupLocationId:
 *           type: string
 *         make:
 *           type: string
 *         model:
 *           type: string
 *         year:
 *           type: integer
 *         color:
 *           type: string
 *         plateNumber:
 *           type: string
 *         transmission:
 *           type: string
 *           enum: [AUTOMATIC, MANUAL]
 *         seats:
 *           type: integer
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         depositRequired:
 *           type: number
 *         status:
 *           type: string
 *           enum: [AVAILABLE, RENTED, UNAVAILABLE, MAINTENANCE]
 */

// ─────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /car-store/cars:
 *   get:
 *     summary: Get all available cars (public)
 *     tags: [Cars]
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
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by car make (partial match)
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by car model (partial match)
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [AUTOMATIC, MANUAL]
 *       - in: query
 *         name: seats
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per day
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per day
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter cars by a specific store
 *     responses:
 *       200:
 *         description: List of available cars
 *       500:
 *         description: Internal Server Error
 */
router.get("/", getAllCars);

/**
 * @swagger
 * /car-store/cars/{carId}:
 *   get:
 *     summary: Get a single car by ID (public)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *         description: Car UUID
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 */
router.get("/:carId", getCarById);

// ─────────────────────────────────────────────
// VENDOR ROUTES (authenticated)
// ─────────────────────────────────────────────

/**
 * @swagger
 * /car-store/cars/vendor/my-cars:
 *   get:
 *     summary: Get all cars belonging to the authenticated vendor's store
 *     tags: [Cars]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RENTED, UNAVAILABLE, MAINTENANCE]
 *     responses:
 *       200:
 *         description: Vendor's cars
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor or store not found
 */
router.get("/vendor/my-cars", restrictTo("vendor"), getMyCars);

/**
 * @swagger
 * /car-store/cars:
 *   post:
 *     summary: Add a new car to the vendor's store
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarInput'
 *     responses:
 *       201:
 *         description: Car created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Store not approved or wrong vendor type
 *       404:
 *         description: Vendor or store not found
 *       409:
 *         description: Plate number already exists
 */
router.post("/", restrictTo("vendor"), createCar);

/**
 * @swagger
 * /car-store/cars/{carId}:
 *   patch:
 *     summary: Update a car (vendor must own the car)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCarInput'
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car not found
 *       409:
 *         description: Plate number already in use
 */
router.patch("/:carId", restrictTo("vendor"), updateCar);

/**
 * @swagger
 * /car-store/cars/{carId}:
 *   delete:
 *     summary: Soft-delete a car (vendor must own the car)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Car not found
 *       409:
 *         description: Car has active rentals
 */
router.delete("/:carId", restrictTo("vendor"), deleteCar);

module.exports = router;
