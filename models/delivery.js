import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
    default: 'assigned',
  },
  pickupLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  deliveryLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  estimatedDeliveryTime: {
    type: Date,
  },
  actualDeliveryTime: {
    type: Date,
  },
  notes: {
    type: String,
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    note: String,
  }],
  signature: {
    type: String,
  },
  photo: {
    type: String,
  },
}, {
  timestamps: true,
});

// Generate tracking number before saving
deliverySchema.pre('save', async function(next) {
  if (!this.trackingNumber) {
    const count = await mongoose.model('Delivery').countDocuments();
    this.trackingNumber = `DL${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model('Delivery', deliverySchema);
