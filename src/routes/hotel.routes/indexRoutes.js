const express = require("express");
const {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  checkAvailability,
  createRoomCategory,
  getRoomCategories,
  updateRoomCategory,
} = require("../../controllers/hotel.controller/index.controller");

const router = express.Router();

/**
 * @openapi
 * /hotel/createHotel:
 *   post:
 *     tags:
 *       - Hotel
 *     summary: Create a new hotel
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               starRating:
 *                 type: number
 *               checkInTime:
 *                 type: string
 *               checkOutTime:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               googlePlaceId:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *       500:
 *         description: Internal server error
 */
router.post("/createHotel", createHotel);

/**
 * @openapi
 * /hotel/getAllHotels:
 *   get:
 *     tags:
 *       - Hotel
 *     summary: Get all hotels
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotels retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/getAllHotels", getAllHotels);

/**
 * @openapi
 * /hotel/getHotelById/{hotelId}:
 *   get:
 *     tags:
 *       - Hotel
 *     summary: Get a hotel by ID or Slug
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel retrieved successfully
 *       404:
 *         description: Hotel not found
 */
router.get("/getHotelById/:hotelId", getHotelById);

/**
 * @openapi
 * /hotel/updateHotel/{hotelId}:
 *   put:
 *     tags:
 *       - Hotel
 *     summary: Update a hotel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               starRating:
 *                 type: number
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               amenities:
 *                 type: array
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *       404:
 *         description: Hotel not found
 */
router.put("/updateHotel/:hotelId", updateHotel);

/**
 * @openapi
 * /hotel/deleteHotel/{hotelId}:
 *   delete:
 *     tags:
 *       - Hotel
 *     summary: Delete a hotel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel deactivated successfully
 *       404:
 *         description: Hotel not found
 */
router.delete("/deleteHotel/:hotelId", deleteHotel);

/**
 * @openapi
 * /hotel/checkAvailability/{hotelId}:
 *   get:
 *     tags:
 *       - Hotel
 *     summary: Check availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: checkIn
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOut
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Availability checked successfully
 */
router.get("/checkAvailability/:hotelId", checkAvailability);

/**
 * @openapi
 * /hotel/createRoomCategory/{hotelId}:
 *   post:
 *     tags:
 *       - Room Category
 *     summary: Create a new room category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               bedType:
 *                 type: string
 *               maxOccupancy:
 *                 type: number
 *               basePricePerNight:
 *                 type: number
 *               amenities:
 *                 type: array
 *     responses:
 *       201:
 *         description: Room category created successfully
 */
router.post("/createRoomCategory/:hotelId", createRoomCategory);

/**
 * @openapi
 * /hotel/getRoomCategories/{hotelId}:
 *   get:
 *     tags:
 *       - Room Category
 *     summary: Get all room categories for a hotel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room categories retrieved successfully
 */
router.get("/getRoomCategories/:hotelId", getRoomCategories);

/**
 * @openapi
 * /hotel/updateRoomCategory/{categoryId}:
 *   put:
 *     tags:
 *       - Room Category
 *     summary: Update a room category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               basePricePerNight:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room category updated successfully
 *       404:
 *         description: Category not found
 */
router.put("/updateRoomCategory/:categoryId", updateRoomCategory);

module.exports = router;
