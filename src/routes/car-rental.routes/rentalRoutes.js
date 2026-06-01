const express = require("express");
const router = express.Router();
const {
  createRental,
  getAllRentals,
  getMyRentals,
  getStoreRentals,
  getRentalById,
  updateRental,
  cancelRental,
} = require("../../controllers/car-rental.controller/rentalController");
const { restrictTo } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Rentals
 *   description: Car rental bookings
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Rental:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         carId:
 *           type: string
 *         userId:
 *           type: string
 *         pickupDate:
 *           type: string
 *           format: date-time
 *         returnDate:
 *           type: string
 *           format: date-time
 *         actualReturn:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, ACTIVE, RETURNED, COMPLETED, CANCELLED]
 *           default: PENDING
 *         totalPrice:
 *           type: number
 *           example: 75000
 *         depositPaid:
 *           type: number
 *           example: 50000
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, REFUNDED, PARTIAL]
 *           default: PENDING
 *         notes:
 *           type: string
 *           nullable: true
 *         unifiedBookingId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateRentalInput:
 *       type: object
 *       required:
 *         - carId
 *         - pickupDate
 *         - returnDate
 *       properties:
 *         carId:
 *           type: string
 *           description: ID of the car to rent
 *         pickupDate:
 *           type: string
 *           format: date-time
 *           example: "2025-08-01T09:00:00Z"
 *         returnDate:
 *           type: string
 *           format: date-time
 *           example: "2025-08-05T09:00:00Z"
 *         notes:
 *           type: string
 *           example: Please park at the airport terminal
 *         unifiedBookingId:
 *           type: string
 *           description: Optional ID linking this to a unified trip booking
 *
 *     UpdateRentalInput:
 *       type: object
 *       properties:
 *         pickupDate:
 *           type: string
 *           format: date-time
 *         returnDate:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, ACTIVE, RETURNED, COMPLETED, CANCELLED]
 *           description: Admin only
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, PAID, REFUNDED, PARTIAL]
 *           description: Admin only
 *         totalPrice:
 *           type: number
 *           description: Admin only
 *         depositPaid:
 *           type: number
 *           description: Admin only
 */

// ─────────────────────────────────────────────
// USER ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /car-store/rental:
 *   post:
 *     summary: Book a car rental
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRentalInput'
 *     responses:
 *       201:
 *         description: Rental booked successfully
 *       400:
 *         description: Validation error (missing fields, invalid dates)
 *       404:
 *         description: Car not found or not available
 *       409:
 *         description: Car already booked for selected dates
 */
router.post("/", createRental);

/**
 * @swagger
 * /car-store/rental/my-rentals:
 *   get:
 *     summary: Get the authenticated user's rental history
 *     tags: [Rentals]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, ACTIVE, RETURNED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: User's rentals
 *       401:
 *         description: Unauthorized
 */
router.get("/my-rentals", getMyRentals);

/**
 * @swagger
 * /car-store/rental{rentalId}:
 *   get:
 *     summary: Get a single rental by ID (owner or admin)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Rental not found
 */
router.get("/:rentalId", getRentalById);

/**
 * @swagger
 * /car-store/rental/{rentalId}:
 *   patch:
 *     summary: Update a rental (user can update PENDING rentals; admin can update any)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRentalInput'
 *     responses:
 *       200:
 *         description: Rental updated successfully
 *       400:
 *         description: Cannot modify non-pending rental (for regular users)
 *       403:
 *         description: Access denied
 *       404:
 *         description: Rental not found
 */
router.patch("/:rentalId", updateRental);

/**
 * @swagger
 * /car-store/rental/{rentalId}/cancel:
 *   patch:
 *     summary: Cancel a rental (owner or admin)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rental cancelled successfully
 *       400:
 *         description: Rental cannot be cancelled (wrong status)
 *       403:
 *         description: Access denied
 *       404:
 *         description: Rental not found
 */
router.patch("/:rentalId/cancel", cancelRental);

// ─────────────────────────────────────────────
// VENDOR ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /car-store/rental/store/bookings:
 *   get:
 *     summary: Get all rentals for the vendor's car store
 *     tags: [Rentals]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, ACTIVE, RETURNED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Store rental bookings
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor or store not found
 */
router.get("/store/bookings", restrictTo("vendor"), getStoreRentals);

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /car-store/rental:
 *   get:
 *     summary: Get all rentals (admin only)
 *     tags: [Rentals]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, ACTIVE, RETURNED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, REFUNDED, PARTIAL]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user
 *       - in: query
 *         name: carId
 *         schema:
 *           type: string
 *         description: Filter by specific car
 *     responses:
 *       200:
 *         description: All rentals
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin only
 */
router.get("/", restrictTo("admin"), getAllRentals);

module.exports = router;
