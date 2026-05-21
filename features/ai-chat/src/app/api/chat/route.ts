import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/mongoose';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { conversationId, content } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json({ error: 'Missing conversationId or content' }, { status: 400 });
    }

    await connectDB();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save user message
    await Message.create({
      conversationId,
      role: 'user',
      content,
    });

    // Check if it's the first message
    const messageCount = await Message.countDocuments({ conversationId });
    if (messageCount === 1) {
      // Auto-title from first 6 words
      const title = content.split(/\s+/).slice(0, 6).join(' ') + '...';
      await Conversation.findByIdAndUpdate(conversationId, { title, updatedAt: new Date() });
    } else {
      await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
    }

    // Read system instructions
    let systemInstruction = 'You are a helpful assistant.';
    try {
      const instructionsPath = path.join(process.cwd(), 'instructions.md');
      systemInstruction = fs.readFileSync(instructionsPath, 'utf8');
    } catch (e) {
      console.warn('Could not read instructions.md, using default system prompt.');
    }

    // Fetch history
    const previousMessages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(50); // Get up to last 50 messages to avoid token limits

    const history = previousMessages.slice(0, -1).map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Ensure we map any legacy or unsupported models to a working one
    let targetModel = conversation.model || 'gemini-3.5-flash';
    const legacyModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
    if (legacyModels.includes(targetModel)) {
      targetModel = 'gemini-3.5-flash';
    }

    const responseStream = await ai.models.generateContentStream({
      model: targetModel,
      contents: [...history, { role: 'user', parts: [{ text: content }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Stream the response back and save to DB
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullResponse += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          // Save model message
          await Message.create({
            conversationId,
            role: 'model',
            content: fullResponse,
          });
        } catch (error) {
          console.error('Error in streaming:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
