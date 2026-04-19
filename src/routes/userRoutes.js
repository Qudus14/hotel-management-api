const express = require("express");
const router = express.Router();
const { authenticate: protect } = require("../middleware/auth");
const {
  updateUser,
  deleteUser,
  deleteProfileImage,
  uploadProfileImage,
} = require("../controllers/userController");
const upload = require("../middleware/uploadMiddleware");

router.use(protect);

router.get("/getAllUser", (req, res) => {
  res.send("Get all user items");
});

router.patch("/updateUser", updateUser);

router.delete("/removerUser", deleteUser);

// Update user profile (with optional image)
router.put(
  "/updateUserProfileImage",
  upload.single("profileImage"),
  updateUser
);

// Upload profile image only
router.post(
  "/UploadProfileImage",
  upload.single("profileImage"),
  uploadProfileImage
);

// Delete profile image
router.delete("/removeProfileImage", deleteProfileImage);

// Delete account
router.delete("/deleteUserAccount", deleteUser);

module.exports = router;
