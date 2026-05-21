"use client";

import { Plus, MessageSquare, Trash2, ChevronDown } from 'lucide-react';

interface SidebarProps {
  conversations: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  model: string;
  setModel: (model: string) => void;
  isLoading: boolean;
}

const MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
];

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  model,
  setModel,
  isLoading
}: SidebarProps) {
  return (
    <div className="w-66 bg-[#f0f4f9] dark:bg-[#1e1f20] h-full flex flex-col border-r border-[#d3e3fd] dark:border-[#3c4043] transition-colors duration-200">
      {/* New Chat Button Area */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-[#1a1b1c] text-[#0b57d0] dark:text-[#a8c7fa] border border-[#d3e3fd] dark:border-[#3c4043] hover:bg-[#e9f0fe] dark:hover:bg-[#2d2f31] active:scale-[0.98] transition-all duration-200 font-semibold text-sm shadow-sm"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Model Selector Area */}
      <div className="px-4 pb-4">
        <div className="relative">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-[#1a1b1c] border border-[#d3e3fd] dark:border-[#3c4043] text-gray-700 dark:text-[#e3e3e3] py-2.5 pl-4 pr-10 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0b57d0] dark:focus:ring-[#a8c7fa] shadow-sm cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} className="dark:bg-[#1e1f20] font-sans py-2">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none stroke-[2]" />
        </div>
      </div>

      {/* Conversation History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
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
                className={`group flex items-center justify-between px-3 py-2.5 rounded-full cursor-pointer transition-all duration-150 ${
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
      </div>
    </div>
  );
}
