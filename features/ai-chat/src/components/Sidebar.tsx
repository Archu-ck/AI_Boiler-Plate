"use client";

import { useState, useRef, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Search, X, ArrowRight } from 'lucide-react';

interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messages: { role: string; content: string }[];
}

interface SidebarProps {
  conversations: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  isLoading: boolean;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  isLoading
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const handleOpenSearch = () => {
    setShowSearch(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="w-66 bg-[#f0f4f9] dark:bg-[#1e1f20] h-full flex flex-col border-r border-[#d3e3fd] dark:border-[#3c4043] transition-colors duration-200">
      {/* Top Buttons */}
      <div className="p-4 space-y-2">
        <button
          onClick={onNewChat}
          style={{ cursor: 'pointer' }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-[#1a1b1c] text-[#0b57d0] dark:text-[#a8c7fa] border border-[#d3e3fd] dark:border-[#3c4043] hover:bg-[#e9f0fe] dark:hover:bg-[#2d2f31] active:scale-[0.98] transition-all duration-200 font-semibold text-sm shadow-sm"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>New Chat</span>
        </button>

        <button
          onClick={handleOpenSearch}
          style={{ cursor: 'pointer' }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-gray-600 dark:text-[#c4c7c5] border border-[#d3e3fd] dark:border-[#3c4043] hover:bg-[#e9eef6] dark:hover:bg-[#2d2f31] transition-all duration-200 text-sm"
        >
          <Search size={15} className="stroke-[2]" />
          <span>Search past chats</span>
        </button>
      </div>

      {/* Search Overlay / Conversation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
        {showSearch ? (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative px-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2]" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-white dark:bg-[#1a1b1c] border border-[#d3e3fd] dark:border-[#3c4043] rounded-full py-2 pl-9 pr-9 text-sm text-gray-800 dark:text-[#e3e3e3] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#0b57d0] dark:focus:ring-[#a8c7fa] transition-all"
              />
              <button
                onClick={handleCloseSearch}
                style={{ cursor: 'pointer' }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition-colors"
              >
                <X size={14} className="stroke-[2.5]" />
              </button>
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-1.5 p-3 rounded-xl bg-white/50 dark:bg-[#2d2f31]/50">
                    <div className="h-3 bg-gray-200 dark:bg-[#3c4043] rounded w-3/4"></div>
                    <div className="h-2.5 bg-gray-200 dark:bg-[#3c4043] rounded w-full"></div>
                    <div className="h-2.5 bg-gray-200 dark:bg-[#3c4043] rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-6 text-center italic">
                No results found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400 px-3 uppercase">
                  {searchResults.length} conversation{searchResults.length > 1 ? 's' : ''} found
                </div>
                {searchResults.map((result) => (
                  <div
                    key={result.conversationId}
                    onClick={() => {
                      onSelect(result.conversationId);
                      handleCloseSearch();
                    }}
                    style={{ cursor: 'pointer' }}
                    className="p-3 rounded-xl bg-white dark:bg-[#1a1b1c] border border-[#d3e3fd] dark:border-[#3c4043] hover:bg-[#e3eafd] dark:hover:bg-[#2d2f31] transition-all group"
                  >
                    {/* Conversation title */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-800 dark:text-[#e3e3e3] truncate">
                        {result.conversationTitle}
                      </span>
                      <ArrowRight size={12} className="text-gray-400 group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors shrink-0" />
                    </div>
                    {/* Message previews */}
                    <div className="space-y-1">
                      {result.messages.slice(0, 3).map((msg, i) => (
                        <div key={i} className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {msg.role === 'user' ? 'You' : 'Gemini'}:
                          </span>{' '}
                          {msg.content.slice(0, 80)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchQuery.trim() && (
              <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-6 text-center italic">
                Type to search across all past conversations.
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-2.5 px-3 uppercase">
              Recent Conversations
            </div>

            {isLoading ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 py-2.5">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-[#2d2f31] rounded-full shrink-0"></div>
                    <div className="h-3.5 bg-gray-200 dark:bg-[#2d2f31] rounded w-4/5"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv._id}
                    onClick={() => onSelect(conv._id)}
                    style={{ cursor: 'pointer' }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-full transition-all duration-150 ${
                      activeId === conv._id
                        ? 'bg-[#d3e3fd] dark:bg-[#004a77] text-[#041e49] dark:text-[#c2e7ff] font-medium'
                        : 'text-gray-700 dark:text-[#c4c7c5] hover:bg-[#e9eef6] dark:hover:bg-[#2d2f31]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <MessageSquare size={16} className="shrink-0 opacity-80 stroke-[2]" />
                      <span className="truncate text-sm">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv._id);
                      }}
                      style={{ cursor: 'pointer' }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-white/20 transition-all duration-150"
                    >
                      <Trash2 size={14} className="stroke-[2]" />
                    </button>
                  </div>
                ))}
                {conversations.length === 0 && !isLoading && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center italic">
                    Your chat list is empty.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
