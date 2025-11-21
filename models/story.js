import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false, // Optional - can be a product story or general story
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String, // For video thumbnails
    },
    caption: {
      type: String,
      maxlength: 500,
    },
    duration: {
      type: Number,
      default: 5000, // 5 seconds for images, actual duration for videos (in milliseconds)
    },
    views: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // For efficient querying of expired stories
    },
    ctaButton: {
      // Call-to-action button (for e-commerce)
      text: String,
      link: String, // Can link to product page
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ isActive: 1, expiresAt: 1 });

// Virtual for checking if story is expired
storySchema.virtual('isExpired').get(function () {
  return new Date() > this.expiresAt;
});

// Method to check if story has been viewed by a user
storySchema.methods.hasBeenViewedBy = function (userId) {
  return this.views.some((view) => view.user.toString() === userId.toString());
};

// Method to add a view
storySchema.methods.addView = async function (userId) {
  if (!this.hasBeenViewedBy(userId)) {
    this.views.push({ user: userId });
    this.viewCount = this.views.length;
    await this.save();
  }
};

// Method to toggle like
storySchema.methods.toggleLike = async function (userId) {
  const likeIndex = this.likes.findIndex(
    (id) => id.toString() === userId.toString()
  );

  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
  } else {
    this.likes.push(userId);
  }

  this.likeCount = this.likes.length;
  await this.save();
  return this.likeCount;
};

// Static method to get active stories
storySchema.statics.getActiveStories = function () {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .populate('user', 'name email')
    .populate('product', 'title price image')
    .sort({ createdAt: -1 });
};

// Static method to get user's active stories
storySchema.statics.getUserStories = function (userId) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .populate('product', 'title price image')
    .sort({ createdAt: -1 });
};

// Static method to clean up expired stories
storySchema.statics.cleanupExpiredStories = async function () {
  return this.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isActive: true,
    },
    {
      isActive: false,
    }
  );
};

// Pre-save middleware to set expiration (24 hours from creation)
storySchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

const Story = mongoose.model('Story', storySchema);

export default Story;
