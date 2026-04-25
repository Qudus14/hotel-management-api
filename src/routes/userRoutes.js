// userRoutes.js
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

/**
 * @openapi
 * /users/updateUser:
 *   patch:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully, returns new token
 *       400:
 *         description: Email already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch("/updateUser", updateUser);

/**
 * @openapi
 * /users/updateUserProfileImage:
 *   put:
 *     tags: [Users]
 *     summary: Update profile with image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Failed to process image
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/updateUserProfileImage",
  upload.single("profileImage"),
  updateUser
);

/**
 * @openapi
 * /users/UploadProfileImage:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile image only
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [profileImage]
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No image file provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/UploadProfileImage",
  upload.single("profileImage"),
  uploadProfileImage
);

/**
 * @openapi
 * /users/removeProfileImage:
 *   delete:
 *     tags: [Users]
 *     summary: Delete profile image
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image removed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/removeProfileImage", deleteProfileImage);

/**
 * @openapi
 * /users/deleteUserAccount:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user account permanently
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete("/deleteUserAccount", deleteUser);

module.exports = router;
