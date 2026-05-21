import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import connectDB from '@/lib/mongoose';
import { Conversation } from '@/models/Conversation';
import { Message } from '@/models/Message';
import { searchPastConversations, formatSearchContext } from '@/lib/search';
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
      // Fire-and-forget AI auto-title generation so it doesn't block the stream
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create a very short, descriptive 3-5 word title for a chat session starting with this prompt: "${content}". Respond with ONLY the title, no quotes, no labels or extra text. Do not name it the prompt itself, name it what the session is ABOUT.`
      }).then(async (result) => {
        const titleText = result.text?.trim().replace(/^["']|["']$/g, '') || 'New Chat';
        await Conversation.findByIdAndUpdate(conversationId, { title: titleText, updatedAt: new Date() });
      }).catch(err => console.error('Failed to auto-title', err));
      
      // Set a temporary placeholder while AI thinks
      await Conversation.findByIdAndUpdate(conversationId, { title: "New Chat...", updatedAt: new Date() });
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

    // ── Cross-session memory search ──────────────────────────────────
    // Run the two-phase search in parallel with fetching current history.
    const [previousMessages, searchHits] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(50),
      searchPastConversations(content, conversationId).catch((err) => {
        // Search is best-effort — never let it block the response
        console.warn('Cross-session search failed, continuing without:', err);
        return [];
      }),
    ]);

    // Inject past-conversation context into the system instruction
    const pastContext = formatSearchContext(searchHits);
    if (pastContext) {
      systemInstruction += '\n\n' + pastContext;
    }

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
