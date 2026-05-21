import mongoose from 'mongoose';
import { Message } from '@/models/Message';
import { Conversation } from '@/models/Conversation';

/**
 * Two-phase cross-session search algorithm.
 *
 * Phase 1 — NARROW (fast):
 *   Searches BOTH conversation titles AND message content.
 *   First tries MongoDB $text index, then falls back to case-insensitive
 *   regex. The exclude filter is only applied when a valid conversationId
 *   is provided.
 *
 * Phase 2 — EXPAND (targeted):
 *   For each unique conversation that produced a hit, fetch a small
 *   window of surrounding messages (± windowRadius) for context.
 */

interface SearchHit {
  conversationId: string;
  conversationTitle: string;
  messages: { role: string; content: string }[];
}

// ── Configurable knobs ──────────────────────────────────────────────
const CANDIDATE_LIMIT = 10;
const WINDOW_RADIUS = 2;
const MAX_CONVERSATIONS = 5;
const SNIPPET_MAX_CHARS = 600;

/**
 * Escape special regex characters in a string so it's safe for new RegExp().
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract meaningful search keywords from a user query.
 */
function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'between',
    'through', 'after', 'before', 'above', 'below', 'and', 'but', 'or',
    'not', 'so', 'if', 'then', 'than', 'that', 'this', 'it', 'its',
    'my', 'your', 'his', 'her', 'our', 'their', 'what', 'which', 'who',
    'whom', 'how', 'when', 'where', 'why', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'only', 'same', 'just', 'also', 'very', 'too', 'i', 'me',
    'we', 'you', 'he', 'she', 'they', 'them', 'us', 'him',
    'tell', 'told', 'said', 'say', 'know', 'get', 'got', 'go',
    'went', 'come', 'came', 'make', 'made', 'take', 'took',
    'give', 'gave', 'think', 'thought', 'let', 'keep', 'kept',
    'remember', 'recall', 'earlier', 'previous', 'last',
    'again', 'already', 'please', 'thanks', 'thank',
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  return words;
}

/**
 * Check if a string is a valid MongoDB ObjectId.
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}

/**
 * Build the exclude filter conditionally.
 */
function buildExcludeFilter(excludeId: string): Record<string, any> {
  if (excludeId && isValidObjectId(excludeId)) {
    return { conversationId: { $ne: new mongoose.Types.ObjectId(excludeId) } };
  }
  return {};
}

/**
 * Run the two-phase search. Returns an array of SearchHit objects.
 */
export async function searchPastConversations(
  userQuery: string,
  currentConversationId: string,
): Promise<SearchHit[]> {
  const keywords = extractKeywords(userQuery);
  const excludeFilter = buildExcludeFilter(currentConversationId);

  // Build a safe regex pattern from keywords (OR match)
  const safeKeywords = keywords.length > 0
    ? keywords.map(escapeRegex)
    : [escapeRegex(userQuery.trim())];
  const regexPattern = safeKeywords.filter(k => k.length > 0).join('|');

  if (!regexPattern) return [];

  const regex = new RegExp(regexPattern, 'i');

  // ── Search conversations by TITLE ─────────────────────────────────
  const titleExclude = (currentConversationId && isValidObjectId(currentConversationId))
    ? { _id: { $ne: new mongoose.Types.ObjectId(currentConversationId) } }
    : {};

  const titleMatches = await Conversation.find({
    title: { $regex: regex },
    ...titleExclude,
  })
    .sort({ updatedAt: -1 })
    .limit(MAX_CONVERSATIONS)
    .lean();

  // ── Search messages by CONTENT ────────────────────────────────────
  // First try MongoDB text index for ranked results
  let messageCandidates: any[] = [];

  if (keywords.length > 0) {
    try {
      messageCandidates = await Message.find(
        {
          $text: { $search: keywords.join(' ') },
          ...excludeFilter,
        },
        { score: { $meta: 'textScore' } },
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(CANDIDATE_LIMIT)
        .lean();
    } catch {
      // Text index might not exist yet — fall through to regex
    }
  }

  // Fallback / supplement with regex search
  if (messageCandidates.length < CANDIDATE_LIMIT) {
    try {
      const regexCandidates = await Message.find({
        content: { $regex: regex },
        ...excludeFilter,
      })
        .sort({ createdAt: -1 })
        .limit(CANDIDATE_LIMIT - messageCandidates.length)
        .lean();

      // Merge, avoiding duplicate _ids
      const existingIds = new Set(messageCandidates.map((m: any) => m._id.toString()));
      for (const c of regexCandidates) {
        if (!existingIds.has((c as any)._id.toString())) {
          messageCandidates.push(c);
        }
      }
    } catch (e) {
      console.warn('Regex search failed:', e);
    }
  }

  // ── Merge title matches and message matches into a conversation map ──
  const convMap = new Map<string, { title: string; hitMsgIds: Set<string> }>();

  // Add conversations matched by title
  for (const conv of titleMatches) {
    const cid = (conv as any)._id.toString();
    if (!convMap.has(cid)) {
      convMap.set(cid, { title: conv.title || 'Untitled', hitMsgIds: new Set() });
    }
  }

  // Add conversations matched by message content
  for (const hit of messageCandidates) {
    const cid = hit.conversationId.toString();
    if (!convMap.has(cid)) {
      if (convMap.size >= MAX_CONVERSATIONS) continue;
      convMap.set(cid, { title: '', hitMsgIds: new Set() });
    }
    convMap.get(cid)!.hitMsgIds.add(hit._id.toString());
  }

  if (convMap.size === 0) return [];

  // ── Phase 2: expand context windows ────────────────────────────────
  const results: SearchHit[] = [];

  for (const [convIdStr, { title: cachedTitle, hitMsgIds }] of convMap) {
    const convId = new mongoose.Types.ObjectId(convIdStr);

    // Resolve title if we don't have it from the title-match phase
    let title = cachedTitle;
    if (!title) {
      const conv = await Conversation.findById(convId).lean();
      title = conv?.title ?? 'Untitled';
    }

    // Get all messages in this conversation sorted chronologically
    const allMessages = await Message.find({ conversationId: convId })
      .sort({ createdAt: 1 })
      .lean();

    if (allMessages.length === 0) continue;

    if (hitMsgIds.size === 0) {
      // Title-only match — include the first few messages as preview
      const contextMessages = allMessages.slice(0, 4).map(m => {
        let content = m.content;
        if (content.length > SNIPPET_MAX_CHARS) {
          content = content.slice(0, SNIPPET_MAX_CHARS) + '… [truncated]';
        }
        return { role: m.role, content };
      });
      results.push({ conversationId: convIdStr, conversationTitle: title, messages: contextMessages });
    } else {
      // Build a set of indices we need (hit indices ± window radius)
      const neededIndices = new Set<number>();
      for (const msgId of hitMsgIds) {
        const hitIdx = allMessages.findIndex(
          m => (m as any)._id.toString() === msgId
        );
        if (hitIdx === -1) continue;
        for (
          let i = Math.max(0, hitIdx - WINDOW_RADIUS);
          i <= Math.min(allMessages.length - 1, hitIdx + WINDOW_RADIUS);
          i++
        ) {
          neededIndices.add(i);
        }
      }

      const sortedIndices = [...neededIndices].sort((a, b) => a - b);
      const contextMessages = sortedIndices.map(i => {
        const m = allMessages[i];
        let content = m.content;
        if (content.length > SNIPPET_MAX_CHARS) {
          content = content.slice(0, SNIPPET_MAX_CHARS) + '… [truncated]';
        }
        return { role: m.role, content };
      });

      results.push({ conversationId: convIdStr, conversationTitle: title, messages: contextMessages });
    }
  }

  return results;
}

/**
 * Format search results into a context block for injection into the system prompt.
 */
export function formatSearchContext(hits: SearchHit[]): string {
  if (hits.length === 0) return '';

  const sections = hits.map(hit => {
    const msgLines = hit.messages
      .map(m => `  [${m.role === 'user' ? 'User' : 'Gemini'}]: ${m.content}`)
      .join('\n');
    return `### Past conversation: "${hit.conversationTitle}"\n${msgLines}`;
  });

  return [
    '## Relevant context from past conversations',
    'The following excerpts were found in the user\'s previous chat sessions.',
    'Use them if they help answer the current question, but do not',
    'mention that you searched unless the user explicitly asks.',
    '',
    ...sections,
  ].join('\n');
}
