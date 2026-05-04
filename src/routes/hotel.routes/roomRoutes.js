// roomRoutes.js
const express = require("express");
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoomById,
  deleteRoomById,
} = require("../../controllers/hotel.controller/roomController");
const validateSchema = require("../../middleware/validate");
const {
  roomSchema,
  updateRoomSchema,
} = require("../../model/hotel.model/roomsModel");
const router = express.Router();

/**
 * @openapi
 * /hotel/rooms/getAllRoom:
 *   get:
 *     tags: [Rooms]
 *     summary: Get all rooms
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
 *         description: Rooms retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/getAllRoom", getAllRooms);

/**
 * @openapi
 * /hotel/rooms/getAllRoom/{roomId}:
 *   get:
 *     tags: [Rooms]
 *     summary: Get room by ID
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room retrieved successfully
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
router.get("/getAllRoom/:roomId", getRoomById);

/**
 * @openapi
 * /hotel/rooms/createRoom:
 *   post:
 *     tags: [Rooms]
 *     summary: Create a new room
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomNumber, type, price, status, capacity]
 *             properties:
 *               roomNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [single, double, suite, deluxe, family, presidential, standard, economy, luxury]
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [available, occupied, maintenance, reserved, cleaning, out_of_service]
 *               capacity:
 *                 type: integer
 *               floor:
 *                 type: integer
 *               bedType:
 *                 type: string
 *               description:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Room number already exists or validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/createRoom", validateSchema(roomSchema), createRoom);

/**
 * @openapi
 * /hotel/rooms/updateRoom/{roomId}:
 *   patch:
 *     tags: [Rooms]
 *     summary: Update a room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomNumber:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [single, double, suite, deluxe, family, presidential, standard, economy, luxury]
 *               price:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [available, occupied, maintenance, reserved, cleaning, out_of_service]
 *               capacity:
 *                 type: integer
 *               floor:
 *                 type: integer
 *               bedType:
 *                 type: string
 *               description:
 *                 type: string
 *               amenities:
 *                 type: [string]
 *               images:
 *                 type: [string]
 *     responses:
 *       200:
 *         description: Room updated successfully
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch(
  "/updateRoom/:roomId",
  validateSchema(updateRoomSchema),
  updateRoomById,
);
/**
 * @openapi
 * /hotel/rooms/removeRoom/{roomId}:
 *   delete:
 *     tags: [Rooms]
 *     summary: Delete a room
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/removeRoom/:roomId", deleteRoomById);

module.exports = router;
