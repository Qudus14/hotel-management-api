const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const processProfileImage = async (filePath, userId) => {
  try {
    const processedFilename = `profile-${userId}-${Date.now()}.webp`;
    const processedPath = path.join("uploads/profiles", processedFilename);

    // Process and optimize image
    await sharp(filePath)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(processedPath);

    // Delete original file
    await fs.unlink(filePath);

    // Return relative path for database
    return `/uploads/profiles/${processedFilename}`;
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error("Failed to process image");
  }
};

const deleteOldProfileImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const filePath = path.join(process.cwd(), imageUrl);
    await fs.unlink(filePath);
    console.log("Old profile image deleted:", filePath);
  } catch (error) {
    // File might not exist, that's okay
    console.log("No old image to delete or error deleting:", error.message);
  }
};

module.exports = { processProfileImage, deleteOldProfileImage };
