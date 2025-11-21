import mongoose from 'mongoose';
import Product from '../models/product.js';
import Category from '../models/category.js';

// Get all products with pagination and filters
export const fetchProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, featured } = req.query;

    const query = { isActive: true };

    // Handle category filtering - support both name and ObjectId
    if (category) {
      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
        query.category = category;
      } else {
        // Find category by name (case-insensitive)
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${category}$`, 'i') }
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // If category not found, return empty results
          return res.json({
            products: [],
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0,
          });
        }
      }
    }

    if (featured) query.isFeatured = featured === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// Get single product by ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email phone')
      .populate('category', 'name')
      .populate('warehouse', 'name location');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// Create new product
export const uploadProduct = async (req, res, next) => {
  try {
    const { title, description, price, category, stock, sku, tags } = req.body;

    const productData = {
      title,
      description,
      price,
      seller: req.user._id,
      stock: stock || 0,
    };

    // Handle category - find or create by name if it's a string
    if (category) {
      // Check if category is already an ObjectId or a string
      if (mongoose.Types.ObjectId.isValid(category) && category.length === 24) {
        productData.category = category;
      } else {
        // Find or create category by name
        let categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
          categoryDoc = await Category.create({ name: category });
        }
        productData.category = categoryDoc._id;
      }
    }

    if (sku) productData.sku = sku;
    if (tags) productData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const product = await Product.create(productData);

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

// Update product
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updates = { ...req.body };

    // Handle category - find or create by name if it's a string
    if (updates.category) {
      if (mongoose.Types.ObjectId.isValid(updates.category) && updates.category.length === 24) {
        // Already an ObjectId, keep as is
      } else {
        // Find or create category by name
        let categoryDoc = await Category.findOne({ name: updates.category });
        if (!categoryDoc) {
          categoryDoc = await Category.create({ name: updates.category });
        }
        updates.category = categoryDoc._id;
      }
    }

    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Search products
export const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const products = await Product.find({
      $text: { $search: q },
      isActive: true,
    })
      .populate('seller', 'name')
      .populate('category', 'name')
      .limit(50);

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

// Get all categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name')
      .sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};
