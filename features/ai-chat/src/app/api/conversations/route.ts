import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { Conversation } from '@/models/Conversation';

export async function GET() {
  try {
    await connectDB();
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { model = 'gemini-3.5-flash' } = await req.json().catch(() => ({}));
    await connectDB();
    
    const conversation = await Conversation.create({
      title: 'New Chat',
      model,
    });
    
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
