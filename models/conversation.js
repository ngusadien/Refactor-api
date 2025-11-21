import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: String,
  },
  lastMessageAt: {
    type: Date,
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  },
}, {
  timestamps: true,
});

// Ensure a conversation exists between two users only once
conversationSchema.index({ participants: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
