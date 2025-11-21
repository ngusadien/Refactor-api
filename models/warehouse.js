import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  capacity: {
    type: Number,
    required: true,
    min: 0,
  },
  occupied: {
    type: Number,
    default: 0,
    min: 0,
  },
  inventory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: String, // e.g., "Aisle 3, Shelf B"
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Generate warehouse code before saving
warehouseSchema.pre('save', async function(next) {
  if (!this.code) {
    const count = await mongoose.model('Warehouse').countDocuments();
    this.code = `WH${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Warehouse', warehouseSchema);
