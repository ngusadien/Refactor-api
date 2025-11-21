import Story from '../models/story.js';
import Product from '../models/product.js';
import User from '../models/user.js';

// @desc    Get all active stories grouped by user (only from followed users)
// @route   GET /api/stories
// @access  Private
const getAllStories = async (req, res) => {
  try {
    // Clean up expired stories first
    await Story.cleanupExpiredStories();

    // Get user's following list
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following || [];

    // Include the current user's own stories + stories from users they follow
    const userIdsToShow = [req.user._id, ...followingIds];

    // Get active stories from followed users and own stories
    const stories = await Story.find({
      isActive: true,
      expiresAt: { $gt: new Date() },
      user: { $in: userIdsToShow },
    })
      .populate('user', 'name email')
      .populate('product', 'title price image')
      .sort({ createdAt: -1 });

    // Group stories by user (one circle per user)
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
          hasUnviewed: false,
        };
      }
      acc[userId].stories.push(story);

      // Check if user has unviewed stories
      if (!story.hasBeenViewedBy(req.user._id)) {
        acc[userId].hasUnviewed = true;
      }

      return acc;
    }, {});

    const formattedStories = Object.values(groupedStories);

    res.json({
      success: true,
      count: formattedStories.length,
      data: formattedStories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stories',
      error: error.message,
    });
  }
};

// @desc    Get user's own stories
// @route   GET /api/stories/my-stories
// @access  Private
const getMyStories = async (req, res) => {
  try {
    const stories = await Story.getUserStories(req.user._id);

    res.json({
      success: true,
      count: stories.length,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your stories',
      error: error.message,
    });
  }
};

// @desc    Get stories by user ID
// @route   GET /api/stories/user/:userId
// @access  Public
const getUserStories = async (req, res) => {
  try {
    const stories = await Story.getUserStories(req.params.userId);

    res.json({
      success: true,
      count: stories.length,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user stories',
      error: error.message,
    });
  }
};

// @desc    Get single story by ID
// @route   GET /api/stories/:id
// @access  Public
const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('user', 'name email')
      .populate('product', 'title price image');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if expired
    if (story.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Story has expired',
      });
    }

    res.json({
      success: true,
      data: story,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching story',
      error: error.message,
    });
  }
};

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No media file uploaded',
      });
    }

    const { product, caption, duration, ctaButton } = req.body;

    // Determine media type from file mimetype
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Construct media URL with forward slashes for cross-platform compatibility
    const mediaUrl = `/uploads/${req.file.filename}`.replace(/\\/g, '/');

    // Validate product if provided
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }
    }

    // Parse ctaButton if it's a JSON string
    let parsedCtaButton = ctaButton;
    if (typeof ctaButton === 'string') {
      try {
        parsedCtaButton = JSON.parse(ctaButton);
      } catch (e) {
        parsedCtaButton = undefined;
      }
    }

    // Set expiration time (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      product: product || undefined,
      mediaType,
      mediaUrl,
      caption: caption || '',
      duration: duration ? parseInt(duration) : (mediaType === 'image' ? 5000 : 15000),
      ctaButton: parsedCtaButton,
      expiresAt,
    });

    const populatedStory = await Story.findById(story._id)
      .populate('user', 'name email')
      .populate('product', 'title price image');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: populatedStory,
    });
  } catch (error) {
    console.error('Error creating story:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating story',
      error: error.message,
    });
  }
};

// @desc    Add view to story
// @route   POST /api/stories/:id/view
// @access  Private
const addViewToStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Story has expired',
      });
    }

    await story.addView(req.user._id);

    res.json({
      success: true,
      message: 'View added',
      viewCount: story.viewCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding view',
      error: error.message,
    });
  }
};

// @desc    Toggle like on story
// @route   POST /api/stories/:id/like
// @access  Private
const toggleLikeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.isExpired) {
      return res.status(410).json({
        success: false,
        message: 'Story has expired',
      });
    }

    const likeCount = await story.toggleLike(req.user._id);
    const isLiked = story.likes.includes(req.user._id);

    res.json({
      success: true,
      message: isLiked ? 'Story liked' : 'Story unliked',
      likeCount,
      isLiked,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling like',
      error: error.message,
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if user owns the story
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this story',
      });
    }

    // Soft delete by marking as inactive
    story.isActive = false;
    await story.save();

    res.json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting story',
      error: error.message,
    });
  }
};

// @desc    Get story views (for story owner)
// @route   GET /api/stories/:id/views
// @access  Private
const getStoryViews = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate(
      'views.user',
      'name email'
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if user owns the story
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this data',
      });
    }

    res.json({
      success: true,
      viewCount: story.viewCount,
      views: story.views,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching views',
      error: error.message,
    });
  }
};

export {
  getAllStories,
  getMyStories,
  getUserStories,
  getStoryById,
  createStory,
  addViewToStory,
  toggleLikeStory,
  deleteStory,
  getStoryViews,
};
