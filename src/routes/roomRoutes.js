const express = require("express");
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoomById,
  deleteRoomById,
} = require("../controllers/roomController");
const validateSchema = require("../middleware/validate");
const roomSchema = require("../model/roomsModel");
const router = express.Router();

router.get("/getAllRoom", getAllRooms);
router.get("/getAllRoom/:id", getRoomById);
router.post("/createRoom", validateSchema(roomSchema), createRoom);
router.patch("/updateRoom/:id", validateSchema(roomSchema), updateRoomById);
router.delete("/removeRoom/:id", deleteRoomById);

module.exports = router;
