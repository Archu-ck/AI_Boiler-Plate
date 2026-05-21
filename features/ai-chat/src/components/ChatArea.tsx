"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Sparkles, Terminal, FileText, Lightbulb, Copy, Check, CornerUpLeft, X, ChevronDown } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';

interface Message {
  _id?: string;
  role: 'user' | 'model';
  content: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  streamError: boolean;
  model: string;
  setModel: (model: string) => void;
}

const ACTION_CARDS = [
  {
    icon: <Terminal className="text-blue-500 shrink-0" size={18} />,
    title: "Write a python script",
    prompt: "Write a clean Python script to fetch the current weather using a free public API."
  },
  {
    icon: <Sparkles className="text-purple-500 shrink-0" size={18} />,
    title: "Explain a concept",
    prompt: "Explain quantum computing in simple terms suitable for a 10-year-old."
  },
  {
    icon: <FileText className="text-green-500 shrink-0" size={18} />,
    title: "Draft a professional email",
    prompt: "Draft a professional email asking for constructive feedback on a recent project presentation."
  },
  {
    icon: <Lightbulb className="text-amber-500 shrink-0" size={18} />,
    title: "Brainstorm app ideas",
    prompt: "Brainstorm 5 unique web application ideas that solve daily productivity bottlenecks."
  }
];

const MODELS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    desc: 'Latest flagship speed & multi-turn reasoning.',
    color: 'from-blue-500 to-indigo-500',
    badge: 'Latest'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Stable and responsive for core chat operations.',
    color: 'from-cyan-500 to-teal-500',
  },
];

export default function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  isStreaming,
  streamError,
  model,
  setModel,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectionQuote, setSelectionQuote] = useState<{
    text: string;
    x: number;
    y: number;
    role: 'user' | 'model';
  } | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }
      setSelectionQuote(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleMouseUp = useCallback((role: 'user' | 'model') => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length === 0) return;
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      if (!rect) return;
      setSelectionQuote({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY,
        role,
      });
    }, 10);
  }, []);

  const handleReplyToSelection = useCallback(() => {
    if (!selectionQuote) return;
    setReplyingTo({ role: selectionQuote.role, content: selectionQuote.text });
    setSelectionQuote(null);
    window.getSelection()?.removeAllRanges();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [selectionQuote]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    let finalContent = input.trim();
    if (replyingTo) {
      const cleanContent = replyingTo.content.replace(/^> /gm, '');
      const quoted = `> **Replying to ${replyingTo.role === 'user' ? 'User' : 'Gemini'}:**\n> ${cleanContent.split('\n').join('\n> ')}\n\n`;
      finalContent = quoted + finalContent;
      setReplyingTo(null);
    }
    onSendMessage(finalContent);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleCopyResponse = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#131314] transition-colors duration-200 relative">



      {/* Floating "Reply to selection" popup */}
      {selectionQuote && (
        <div
          ref={popupRef}
          className="fixed z-[9999] pointer-events-auto"
          style={{
            left: selectionQuote.x,
            top: selectionQuote.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReplyToSelection();
            }}
            style={{ cursor: 'pointer' }}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 select-none whitespace-nowrap"
          >
            <CornerUpLeft size={13} className="stroke-[2.5]" />
            Reply to selection
          </button>
          <div className="flex justify-center mt-0.5">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 dark:border-t-white" />
          </div>
        </div>
      )}

      {/* Messages / Welcome View */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && !isLoading ? (
          <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center space-y-8 px-4">
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-800 dark:text-[#e3e3e3]">
                How can I assist you today?
              </h1>
              <p className="text-sm text-gray-500 dark:text-[#9e9e9e] max-w-md mx-auto">
                Ask a question, write some code, or explore ideas with Gemini's high-speed intelligence.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {ACTION_CARDS.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => onSendMessage(card.prompt)}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e3eafd] dark:hover:bg-[#2d2f31] border border-transparent dark:border-[#3c4043] cursor-pointer transition-all duration-200 active:scale-[0.99] group"
                >
                  {card.icon}
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-800 dark:text-[#e3e3e3] group-hover:text-[#0b57d0] dark:group-hover:text-[#a8c7fa] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-[#9e9e9e] line-clamp-2">
                      {card.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative`}
              >
                {msg.role === 'user' ? (
                  <div className="flex items-center gap-2 max-w-[85%]">
                    <button
                      onClick={() => setReplyingTo(msg)}
                      style={{ cursor: 'pointer' }}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-[#e3e3e3] rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0 self-center"
                      title="Quote and reply"
                    >
                      <CornerUpLeft size={14} className="stroke-[2.5]" />
                    </button>
                    <div
                      className="bg-[#f0f4f9] dark:bg-[#2f2f2f] text-gray-900 dark:text-white px-5 py-3.5 rounded-2xl whitespace-pre-wrap shadow-sm border border-gray-100 dark:border-transparent text-sm"
                      onMouseUp={() => handleMouseUp('user')}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="w-full relative pr-4 flex flex-col">
                    <div className="w-full" onMouseUp={() => handleMouseUp('model')}>
                      <MarkdownMessage content={msg.content} />
                      {isStreaming && idx === messages.length - 1 && (
                        <span className="inline-block w-2 h-4 ml-1 bg-[#0b57d0] dark:bg-[#a8c7fa] animate-pulse align-middle rounded-sm" />
                      )}
                    </div>
                    {(!isStreaming || idx < messages.length - 1) && (
                      <div className="flex items-center gap-2 mt-3 text-gray-400 dark:text-gray-500">
                        <button
                          onClick={() => handleCopyResponse(msg.content, idx)}
                          style={{ cursor: 'pointer' }}
                          className="flex items-center gap-1.5 p-1.5 px-2.5 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2f31] hover:text-gray-700 dark:hover:text-[#e3e3e3] transition-colors border border-gray-200 dark:border-[#3c4043]"
                          title="Copy full response"
                        >
                          {copiedIndex === idx
                            ? <Check size={13} className="text-green-500 stroke-[2.5]" />
                            : <Copy size={13} className="stroke-[2.5]" />}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => setReplyingTo(msg)}
                          style={{ cursor: 'pointer' }}
                          className="flex items-center gap-1.5 p-1.5 px-2.5 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2f31] hover:text-gray-700 dark:hover:text-[#e3e3e3] transition-colors border border-gray-200 dark:border-[#3c4043]"
                          title="Reply to message"
                        >
                          <CornerUpLeft size={13} className="stroke-[2.5]" />
                          <span>Reply</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {streamError && (
              <div className="text-red-500 dark:text-red-400 text-sm font-medium py-3 px-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                Response interrupted. Please check your network and try again.
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        )}
      </div>

      {/* Input / Control Panel */}
      <div className="p-4 bg-white dark:bg-[#131314] border-t border-gray-100 dark:border-[#2d2f31]">
        <div className="max-w-3xl mx-auto relative flex flex-col items-center">

          {isStreaming && (
            <button
              onClick={onStop}
              style={{ cursor: 'pointer' }}
              className="absolute -top-14 flex items-center gap-2 bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e3eafd] dark:hover:bg-[#2d2f31] text-gray-700 dark:text-[#c4c7c5] px-4 py-2.5 rounded-full text-xs font-semibold border border-[#d3e3fd] dark:border-[#3c4043] shadow-md transition-all active:scale-95"
            >
              <Square size={12} className="fill-current text-red-500" />
              Stop Generating
            </button>
          )}

          {/* Input Bar */}
          <div className={`relative w-full bg-[#f0f4f9] dark:bg-[#1e1f20] border border-transparent focus-within:border-[#d3e3fd] dark:focus-within:border-[#3c4043] focus-within:bg-white dark:focus-within:bg-[#1a1b1c] shadow-sm transition-all duration-200 flex flex-col ${replyingTo ? 'rounded-2xl' : 'rounded-3xl'}`}>

            {/* Reply Context Banner */}
            {replyingTo && (
              <div className="w-full px-5 py-2.5 bg-[#e3eafd] dark:bg-[#2d2f31] border-b border-[#d3e3fd] dark:border-[#3c4043] rounded-t-2xl flex items-center justify-between text-xs text-[#041e49] dark:text-[#c2e7ff]">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <CornerUpLeft size={13} className="shrink-0 text-[#0b57d0] dark:text-[#a8c7fa] stroke-[2.5]" />
                  <span className="font-semibold shrink-0">
                    Replying to {replyingTo.role === 'user' ? 'User' : 'Gemini'}:
                  </span>
                  <span className="truncate opacity-80 italic">
                    &ldquo;{replyingTo.content.split('\n')[0]}&rdquo;
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  style={{ cursor: 'pointer' }}
                  className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-[#d3e3fd] dark:hover:bg-[#3c4043] transition-colors"
                >
                  <X size={14} className="stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* Textarea + Send */}
            <div className="relative w-full flex items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={replyingTo ? 'Add context to your reply...' : 'Message Gemini...'}
                className="w-full bg-transparent max-h-[180px] py-4 pl-6 pr-14 outline-none resize-none text-gray-900 dark:text-[#e3e3e3] placeholder-gray-500 text-sm leading-relaxed"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                style={{ cursor: input.trim() && !isStreaming ? 'pointer' : 'default' }}
                className="absolute right-3.5 bottom-3 p-2 bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#131314] rounded-full disabled:opacity-40 disabled:bg-gray-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>

            {/* Model Selector Row — bottom of input bar */}
            <div className="flex items-center px-4 pb-2.5 pt-0.5">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ cursor: 'pointer' }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-[#c4c7c5] hover:text-gray-800 dark:hover:text-white pr-2 pl-1 py-0.5 outline-none transition-colors select-none rounded hover:bg-gray-200/40 dark:hover:bg-[#2d2f31]/40"
                >
                  <span>{MODELS.find(m => m.id === model)?.name || 'Select Model'}</span>
                  <ChevronDown size={10} className={`text-gray-400 dark:text-[#9e9e9e] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''} stroke-[2.5]`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-44 rounded-xl bg-white dark:bg-[#1e1f20] border border-gray-200 dark:border-[#3c4043] shadow-lg p-1.5 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="space-y-0.5">
                      {MODELS.map((m) => {
                        const isActive = m.id === model;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setModel(m.id);
                              setDropdownOpen(false);
                            }}
                            style={{ cursor: 'pointer' }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                              isActive
                                ? 'bg-[#e3eafd] dark:bg-[#004a77]/35 text-[#0b57d0] dark:text-[#a8c7fa]'
                                : 'text-gray-600 dark:text-[#c4c7c5] hover:bg-[#e9eef6] dark:hover:bg-[#2d2f31] hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
