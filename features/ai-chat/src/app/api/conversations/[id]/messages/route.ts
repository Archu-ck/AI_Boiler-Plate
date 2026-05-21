import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Message } from '@/models/Message';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
