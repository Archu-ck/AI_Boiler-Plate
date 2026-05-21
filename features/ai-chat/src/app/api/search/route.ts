import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import { searchPastConversations } from '@/lib/search';

/**
 * GET /api/search?q=<query>&exclude=<conversationId>
 *
 * Standalone search endpoint for the sidebar "Search past chats" feature.
 * The `exclude` param is optional — when omitted, searches across ALL conversations.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const exclude = searchParams.get('exclude') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
    }

    await connectDB();

    const hits = await searchPastConversations(query.trim(), exclude);

    return NextResponse.json({ query, results: hits });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
