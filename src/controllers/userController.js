const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const {
  processProfileImage,
  deleteOldProfileImage,
} = require("../utils/imageProcessor");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();

const updateUser = async (req, res) => {
  const { name, email, address, phoneNumber } = req.body;
  const userId = req.user?.id || req.user?.sub;
  const password = req.body.password;

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    // Get current user to check for old profile image
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    let profileImageUrl = currentUser?.profileImage;

    // Handle profile image upload
    if (req.file) {
      try {
        // Process and optimize the uploaded image
        profileImageUrl = await processProfileImage(req.file.path, userId);

        // Delete old profile image if it exists
        if (currentUser?.profileImage) {
          await deleteOldProfileImage(currentUser.profileImage);
        }
      } catch (imageError) {
        // If image processing fails, delete the uploaded file
        if (req.file.path) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(400).json({
          error: "Failed to process profile image",
          details: imageError.message,
        });
      }
    }

    // Prepare update payload
    let updatePayload = {
      name,
      email,
      phoneNumber,
      address,
      profileImage: profileImageUrl,
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key] === undefined && delete updatePayload[key]
    );

    // Only hash and update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(password, salt);
    }

    // Perform the update
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });

    // Strip password for response
    const { password: _, ...userResponse } = updatedUser;

    // Generate new token with updated info
    const token = jwt.sign(
      {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        profileImage: updatedUser.profileImage,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      token: token,
      user: {
        ...userResponse,
        profileImageUrl: updatedUser.profileImage
          ? `${process.env.BASE_URL || req.protocol + "://" + req.get("host")}${
              updatedUser.profileImage
            }`
          : null,
      },
    });
  } catch (error) {
    console.error("Update User Error:", error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Email already exists. Please use a different email.",
      });
    }

    return res.status(500).json({
      error: "Failed to update user",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    // Get user to delete their profile image
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    // Delete profile image if it exists
    if (user?.profileImage) {
      await deleteOldProfileImage(user.profileImage);
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res.status(500).json({
      error: "Failed to delete account",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Add a dedicated endpoint for profile image upload
const uploadProfileImage = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  try {
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    // Process and optimize the image
    const profileImageUrl = await processProfileImage(req.file.path, userId);

    // Delete old profile image
    if (currentUser?.profileImage) {
      await deleteOldProfileImage(currentUser.profileImage);
    }

    // Update user with new profile image
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: profileImageUrl },
    });

    res.status(200).json({
      message: "Profile image uploaded successfully",
      profileImageUrl: `${
        process.env.BASE_URL || req.protocol + "://" + req.get("host")
      }${profileImageUrl}`,
    });
  } catch (error) {
    console.error("Profile Image Upload Error:", error);

    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      error: "Failed to upload profile image",
    });
  }
};

const deleteProfileImage = async (req, res) => {
  const userId = req.user?.id || req.user?.sub;

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      await deleteOldProfileImage(user.profileImage);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
    });

    res.status(200).json({
      message: "Profile image removed successfully",
    });
  } catch (error) {
    console.error("Delete Profile Image Error:", error);
    return res.status(500).json({
      error: "Failed to remove profile image",
    });
  }
};

module.exports = {
  updateUser,
  deleteUser,
  uploadProfileImage,
  deleteProfileImage,
};
