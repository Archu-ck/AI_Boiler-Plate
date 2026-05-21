import mongoose, { Model, Schema } from 'mongoose';

export interface IMessage {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'model';
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Full-text index on content for cross-session search.
// MongoDB text indexes use an inverted-index structure under the hood,
// so $text queries are O(log n) lookups — not collection scans.
MessageSchema.index({ content: 'text' });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
