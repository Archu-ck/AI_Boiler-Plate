"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Terminal, FileText, Lightbulb, Copy, Check, CornerUpLeft, X } from 'lucide-react';
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

export default function ChatArea({
  messages,
  isLoading,
  onSendMessage,
  onStop,
  isStreaming,
  streamError,
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectionQuote, setSelectionQuote] = useState<{ text: string, x: number, y: number, role: 'user' | 'model' } | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        setSelectionQuote(null);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleSelection = (e: React.MouseEvent, role: 'user' | 'model') => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectionQuote({
            text,
            x: rect.left + rect.width / 2,
            y: rect.top,
            role
          });
        }
      }
    }, 10);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    
    let finalContent = input.trim();
    if (replyingTo) {
      // Create a clean blockquote to add to context
      const cleanContent = replyingTo.content.replace(/^> /gm, ''); // remove double blockquotes if replying to replies
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
      
      {/* Floating Reply to Selection Button */}
      {selectionQuote && (
        <div 
          className="fixed z-[100] transform -translate-x-1/2 -translate-y-[calc(100%+12px)] animate-fade-in"
          style={{ left: selectionQuote.x, top: selectionQuote.y }}
        >
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              setReplyingTo({ role: selectionQuote.role, content: selectionQuote.text });
              setSelectionQuote(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform"
          >
            <CornerUpLeft size={13} className="stroke-[2.5]" />
            <span>Reply to selection</span>
          </button>
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

            {/* Quick Action Cards Grid */}
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
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative`}>
                {msg.role === 'user' ? (
                  <div className="flex items-center gap-2 max-w-[85%]">
                    {/* User Reply Trigger (Always Visible) */}
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-[#e3e3e3] rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0 self-center"
                      title="Reply and Quote"
                    >
                      <CornerUpLeft size={14} className="stroke-[2.5]" />
                    </button>
                    
                    <div 
                      className="bg-[#f0f4f9] dark:bg-[#2f2f2f] text-gray-900 dark:text-white px-5 py-3.5 rounded-2xl whitespace-pre-wrap shadow-sm border border-gray-100 dark:border-transparent text-sm"
                      onMouseUp={(e) => handleSelection(e, 'user')}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="w-full relative pr-4 flex flex-col">
                    <div className="w-full" onMouseUp={(e) => handleSelection(e, 'model')}>
                      <MarkdownMessage content={msg.content} />
                      {isStreaming && idx === messages.length - 1 && (
                        <span className="inline-block w-2 h-4 ml-1 bg-[#0b57d0] dark:bg-[#a8c7fa] animate-pulse align-middle rounded-sm" />
                      )}
                    </div>
                    
                    {/* Model Message Actions Row (Always Visible) */}
                    {(!isStreaming || idx < messages.length - 1) && (
                      <div className="flex items-center gap-3 mt-3 text-gray-400 dark:text-gray-500 transition-opacity duration-150">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyResponse(msg.content, idx)}
                          
                          className="flex items-center gap-1.5 p-1.5 px-2.5 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2f31] hover:text-gray-700 dark:hover:text-[#e3e3e3] transition-colors border border-transparent dark:border-transparent hover:border-gray-200 dark:hover:border-[#3c4043] cursor-pointer"
                          title="Copy full response"
                        >
                          {copiedIndex === idx ? <Check size={13} className="text-green-500 stroke-[2.5]" /> : <Copy size={13} className="stroke-[2.5]" />}
                          <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                        
                        {/* Reply Button */}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="cursor-pointer flex items-center gap-1.5 p-1.5 px-2.5 text-xs rounded-full hover:bg-gray-100 dark:hover:bg-[#2d2f31] hover:text-gray-700 dark:hover:text-[#e3e3e3] transition-colors border border-transparent dark:border-transparent hover:border-gray-200 dark:hover:border-[#3c4043]"
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
          
          {/* Stop Generating Button */}
          {isStreaming && (
            <button
              onClick={onStop}
              className="absolute -top-14 flex items-center gap-2 bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e3eafd] dark:hover:bg-[#2d2f31] text-gray-700 dark:text-[#c4c7c5] px-4 py-2.5 rounded-full text-xs font-semibold border border-[#d3e3fd] dark:border-[#3c4043] shadow-md transition-all active:scale-95 animate-fade-in"
            >
              <Square size={12} className="fill-current text-red-500" />
              Stop Generating
            </button>
          )}
          
          {/* Floating Pill Input Bar */}
          <div className={`relative w-full bg-[#f0f4f9] dark:bg-[#1e1f20] border border-transparent focus-within:border-[#d3e3fd] dark:focus-within:border-[#3c4043] focus-within:bg-white dark:focus-within:bg-[#1a1b1c] shadow-sm transition-all duration-200 flex flex-col ${replyingTo ? 'rounded-2xl border-t-[#d3e3fd] dark:border-t-[#3c4043]' : 'rounded-3xl'}`}>
            
            {/* Replying Context Banner */}
            {replyingTo && (
              <div className="w-full px-5 py-2.5 bg-[#e3eafd] dark:bg-[#2d2f31]/90 border-b border-[#d3e3fd] dark:border-[#3c4043] rounded-t-2xl flex items-center justify-between text-xs text-[#041e49] dark:text-[#c2e7ff] transition-all animate-fade-in">
                <div className="flex items-center gap-2 overflow-hidden mr-4">
                  <CornerUpLeft size={13} className="shrink-0 text-[#0b57d0] dark:text-[#a8c7fa] stroke-[2.5]" />
                  <span className="font-semibold shrink-0">
                    Replying to {replyingTo.role === 'user' ? 'User' : 'Gemini'}:
                  </span>
                  <span className="truncate opacity-80 italic">
                    "{replyingTo.content.replace(/^>.*\n/gm, '')}"
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-white/20 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <X size={14} className="stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* Input Text Area and Send Button */}
            <div className="relative w-full flex items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={replyingTo ? "Add context to your reply..." : "Message Gemini..."}
                className="w-full bg-transparent max-h-[180px] py-4 pl-6 pr-14 outline-none resize-none text-gray-900 dark:text-[#e3e3e3] placeholder-gray-500 text-sm leading-relaxed"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="absolute right-3.5 bottom-3 p-2 bg-[#0b57d0] dark:bg-[#a8c7fa] text-white dark:text-[#131314] rounded-full disabled:opacity-40 disabled:bg-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </div>
          
          {/* Privacy Disclaimer */}
          <div className="text-[10px] text-gray-400 dark:text-[#9e9e9e] mt-2.5 text-center font-medium">
            Gemini may display inaccurate info, including about people, so double-check its responses.
          </div>
        </div>
      </div>
    </div>
  );
}
