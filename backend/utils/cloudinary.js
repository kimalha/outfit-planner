const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/**
 * Uploads a local file to Cloudinary and deletes the local file on success.
 * If credentials are not set or upload fails, returns null.
 * 
 * @param {string} filePath - Absolute path to the local file
 * @param {string} folder - Target folder name on Cloudinary
 * @returns {Promise<string|null>} - Secure URL from Cloudinary or null
 */
const uploadToCloudinary = async (filePath, folder = 'outfit-app') => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log("[Cloudinary] Credentials not set, using local disk fallback.");
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder
    });
    console.log("[Cloudinary] Upload success:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("[Cloudinary] Upload failed:", error);
    return null;
  } finally {
    // Clean up local temp file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("[Cloudinary] Failed to delete local temp file:", err);
    }
  }
};

module.exports = { uploadToCloudinary };
