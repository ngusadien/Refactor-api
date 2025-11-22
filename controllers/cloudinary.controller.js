import { uploadToCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary } from '../config/cloudinary.js';

/**
 * Upload single image to Cloudinary
 */
export const uploadImageToCloud = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get optional parameters from request body
    const folder = req.body.folder || 'sokoni';
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (parseError) {
        return res.status(400).json({
          message: 'Invalid tags format. Tags must be valid JSON array.'
        });
      }
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      tags,
      resourceType: 'auto'
    });

    res.json({
      message: 'Image uploaded successfully to Cloudinary',
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resourceType
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    next(error);
  }
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleToCloud = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get optional parameters from request body
    const folder = req.body.folder || 'sokoni';
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (parseError) {
        return res.status(400).json({
          message: 'Invalid tags format. Tags must be valid JSON array.'
        });
      }
    }

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, {
        folder,
        tags,
        resourceType: 'auto'
      })
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      message: 'Files uploaded successfully to Cloudinary',
      files: results.map(result => ({
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height,
        resourceType: result.resourceType
      }))
    });
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    next(error);
  }
};

/**
 * Upload product image to Cloudinary
 * Specifically for product uploads with additional validation
 */
export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No product image uploaded' });
    }

    // Get category from request body for tagging
    const category = req.body.category || 'general';

    // Upload to Cloudinary with product-specific settings
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'sokoni/products',
      tags: ['product', category],
      resourceType: 'image'
    });

    res.json({
      message: 'Product image uploaded successfully',
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    next(error);
  }
};

/**
 * Upload story media (image or video) to Cloudinary
 */
export const uploadStoryMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No media file uploaded' });
    }

    // Upload to Cloudinary with story-specific settings
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'sokoni/stories',
      tags: ['story'],
      resourceType: 'auto' // auto-detect image or video
    });

    res.json({
      message: 'Story media uploaded successfully',
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      resourceType: result.resourceType,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Story media upload error:', error);
    next(error);
  }
};

/**
 * Delete single file from Cloudinary
 */
export const deleteCloudinaryFile = async (req, res, next) => {
  try {
    const { publicId, resourceType = 'image' } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const result = await deleteFromCloudinary(publicId, resourceType);

    res.json({
      message: 'File deleted successfully from Cloudinary',
      result
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    next(error);
  }
};

/**
 * Delete multiple files from Cloudinary
 */
export const deleteMultipleCloudinaryFiles = async (req, res, next) => {
  try {
    const { publicIds, resourceType = 'image' } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({ message: 'Public IDs array is required' });
    }

    const result = await deleteMultipleFromCloudinary(publicIds, resourceType);

    res.json({
      message: 'Files deleted successfully from Cloudinary',
      result
    });
  } catch (error) {
    console.error('Cloudinary multiple delete error:', error);
    next(error);
  }
};
