import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    await Message.deleteMany({ conversationId: id });
    const deleted = await Conversation.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
