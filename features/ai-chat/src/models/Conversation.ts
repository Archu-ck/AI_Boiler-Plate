import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IConversation {
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    title: { type: String, required: true },
    model: { type: String, required: true },
  },
  { timestamps: true }
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
