import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary configuration
let isConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (!isConfigured) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are missing. Please check your .env file.');
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    isConfigured = true;
  }
};

/**
 * Upload buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with url and public_id
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Ensure Cloudinary is configured before upload
    ensureCloudinaryConfigured();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'sokoni',
        resource_type: options.resourceType || 'auto',
        tags: options.tags || [],
        transformation: options.transformation || null
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Public ID of the file
 * @param {String} resourceType - Type of resource (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    // Ensure Cloudinary is configured before delete
    ensureCloudinaryConfigured();

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array<String>} publicIds - Array of public IDs
 * @param {String} resourceType - Type of resource
 * @returns {Promise<Object>} Deletion result
 */
const deleteMultipleFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    // Ensure Cloudinary is configured before delete
    ensureCloudinaryConfigured();

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw error;
  }
};

export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary
};
