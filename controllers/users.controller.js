import User from '../models/user.js';

// Get user profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Upload KYC documents
export const uploadKYC = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const documents = req.files.map(file => ({
      type: file.fieldname,
      url: `/uploads/${file.filename}`,
    }));

    const user = await User.findById(req.user._id);
    user.kyc.documents.push(...documents);
    user.kyc.status = 'pending';
    await user.save();

    res.json({ message: 'KYC documents uploaded successfully', kyc: user.kyc });
  } catch (error) {
    next(error);
  }
};

// Get KYC status
export const getKYC = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.kyc);
  } catch (error) {
    next(error);
  }
};

// Update user settings
export const updateSettings = async (req, res, next) => {
  try {
    const { language, theme, notifications } = req.body;
    const updates = {};

    if (language) updates['settings.language'] = language;
    if (theme) updates['settings.theme'] = theme;
    if (notifications) updates['settings.notifications'] = notifications;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    next(error);
  }
};

// Register FCM token for push notifications
export const registerFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findById(req.user._id);
    user.fcmToken = token;
    await user.save();

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    next(error);
  }
};

// Follow a user
export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    await currentUser.followUser(userId);

    res.json({
      message: 'User followed successfully',
      followingCount: currentUser.followingCount,
    });
  } catch (error) {
    next(error);
  }
};

// Unfollow a user
export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user._id);
    await currentUser.unfollowUser(userId);

    res.json({
      message: 'User unfollowed successfully',
      followingCount: currentUser.followingCount,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's followers
export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId || req.user._id)
      .populate('followers', 'name email avatar followersCount followingCount');

    res.json({
      followers: user.followers,
      count: user.followersCount,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's following
export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId || req.user._id)
      .populate('following', 'name email avatar followersCount followingCount');

    res.json({
      following: user.following,
      count: user.followingCount,
    });
  } catch (error) {
    next(error);
  }
};

// Check if current user follows another user
export const checkFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user._id);

    const isFollowing = currentUser.following.includes(userId);

    res.json({ isFollowing });
  } catch (error) {
    next(error);
  }
};

// Submit account upgrade request
export const upgradeAccount = async (req, res, next) => {
  try {
    const { targetRole, businessInfo } = req.body;

    // Validate target role
    if (!targetRole || !['retailer', 'wholesaler'].includes(targetRole)) {
      return res.status(400).json({
        message: 'Invalid target role. Must be either retailer or wholesaler'
      });
    }

    // Validate business information
    if (!businessInfo || !businessInfo.businessName || !businessInfo.businessAddress || !businessInfo.businessPhone) {
      return res.status(400).json({
        message: 'Business name, address, and phone are required'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if user already has the target role or higher
    if (user.role === targetRole || user.role === 'admin') {
      return res.status(400).json({
        message: 'You already have this role or higher'
      });
    }

    // Allow resubmission - previous pending requests will be overwritten

    // Update user with business information
    user.businessInfo = {
      businessName: businessInfo.businessName,
      businessAddress: businessInfo.businessAddress,
      businessPhone: businessInfo.businessPhone,
      businessDescription: businessInfo.businessDescription || '',
      taxId: businessInfo.taxId || '',
    };

    // Auto-approve and change role immediately
    user.role = targetRole;
    user.upgradeRequest = {
      targetRole,
      status: 'approved',
      requestedAt: new Date(),
      reviewedAt: new Date(),
    };

    await user.save();

    res.json({
      message: 'Account upgraded successfully! You can now start selling products.',
      user: user.toJSON(),
      upgradeRequest: user.upgradeRequest,
      businessInfo: user.businessInfo,
    });
  } catch (error) {
    next(error);
  }
};
