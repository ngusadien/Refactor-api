import Conversation from '../models/conversation.js';
import Message from '../models/message.js';

// Get all conversations for user
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email')
      .sort({ lastMessageAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// Get conversation by ID with messages
export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'name email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({
      conversation: req.params.id,
      isDeleted: false,
    })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json({ conversation, messages });
  } catch (error) {
    next(error);
  }
};

// Send message
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, receiverId, content, type, attachments } = req.body;

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else if (receiverId) {
      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [req.user._id, receiverId],
        });
      }
    } else {
      return res.status(400).json({ message: 'conversationId or receiverId is required' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content,
      type: type || 'text',
      attachments: attachments || [],
    });

    // Update conversation
    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name');

    res.status(201).json({ message: 'Message sent successfully', data: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// Mark message as read
export const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read by user
    const alreadyRead = message.readBy.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
};
