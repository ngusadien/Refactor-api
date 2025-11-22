import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
  },
  imagePublicId: {
    type: String,
  },
  images: [{
    type: String,
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
  specifications: {
    type: Map,
    of: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
