import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['customer', 'retailer', 'wholesaler', 'admin', 'delivery'],
    default: 'customer',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  fcmToken: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  kyc: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    documents: [{
      type: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  businessInfo: {
    businessName: String,
    businessAddress: String,
    businessPhone: String,
    businessDescription: String,
    taxId: String,
  },
  upgradeRequest: {
    targetRole: {
      type: String,
      enum: ['retailer', 'wholesaler'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
    },
    requestedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  settings: {
    language: {
      type: String,
      enum: ['en', 'sw'],
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followingCount: {
    type: Number,
    default: 0,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Follow user method
userSchema.methods.followUser = async function(userIdToFollow) {
  if (!this.following.includes(userIdToFollow)) {
    this.following.push(userIdToFollow);
    this.followingCount = this.following.length;
    await this.save();

    // Update the followed user's followers
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(userIdToFollow, {
      $addToSet: { followers: this._id },
      $inc: { followersCount: 1 },
    });
  }
};

// Unfollow user method
userSchema.methods.unfollowUser = async function(userIdToUnfollow) {
  const index = this.following.indexOf(userIdToUnfollow);
  if (index > -1) {
    this.following.splice(index, 1);
    this.followingCount = this.following.length;
    await this.save();

    // Update the unfollowed user's followers
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(userIdToUnfollow, {
      $pull: { followers: this._id },
      $inc: { followersCount: -1 },
    });
  }
};

// Remove sensitive data from JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.otp;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export default mongoose.model('User', userSchema);
