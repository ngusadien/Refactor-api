import Notification from '../models/notification.js';

// Get all notifications for user
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, unreadOnly } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    res.json({
      notifications,
      page: Number(page),
      limit: Number(limit),
      total,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
export const getPreferences = async (req, res, next) => {
  try {
    // This would be stored in user settings
    res.json(req.user.settings.notifications);
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
export const updatePreferences = async (req, res, next) => {
  try {
    const { email, push, sms } = req.body;

    req.user.settings.notifications = {
      email: email !== undefined ? email : req.user.settings.notifications.email,
      push: push !== undefined ? push : req.user.settings.notifications.push,
      sms: sms !== undefined ? sms : req.user.settings.notifications.sms,
    };

    await req.user.save();

    res.json({
      message: 'Notification preferences updated',
      preferences: req.user.settings.notifications
    });
  } catch (error) {
    next(error);
  }
};
