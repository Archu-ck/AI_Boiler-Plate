"use client";

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';

export default function Home() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [model, setModel] = useState('gemini-3.5-flash');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setConversations(data);
      setDbError(false);
    } catch (e) {
      setDbError(true);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelectConversation = async (id: string) => {
    if (activeId === id || isStreaming) return;
    setActiveId(id);
    
    const conv = conversations.find(c => c._id === id);
    if (conv) setModel(conv.model);

    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    setActiveId(null);
    setMessages([]);
  };

  const handleDelete = async (id: string) => {
    if (isStreaming && activeId === id) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (activeId === id) handleNewChat();
      fetchConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return;
    
    setStreamError(false);
    setIsStreaming(true);
    
    let currentActiveId = activeId;
    
    setMessages(prev => [...prev, { role: 'user', content }]);
    
    if (!currentActiveId) {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model })
        });
        const conv = await res.json();
        currentActiveId = conv._id;
        setActiveId(currentActiveId);
      } catch (e) {
        console.error(e);
        setStreamError(true);
        setIsStreaming(false);
        return;
      }
    }

    abortControllerRef.current = new AbortController();
    
    setMessages(prev => [...prev, { role: 'model', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentActiveId, content }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error('Stream failed');
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'model') {
              lastMessage.content += text;
            }
            return newMessages;
          });
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        console.error(e);
        setStreamError(true);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
      fetchConversations();
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => { handleSelectConversation(id); setIsSidebarOpen(false); }}
        onDelete={handleDelete}
        onNewChat={() => { handleNewChat(); setIsSidebarOpen(false); }}
        isLoading={isLoadingConversations}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col relative min-w-0">
        {dbError && (
          <div className="bg-red-500 text-white text-center text-sm py-1.5 font-medium shadow-sm">
            Database unavailable
          </div>
        )}
        <ChatArea
          messages={messages}
          isLoading={isLoadingConversations && !activeId}
          onSendMessage={handleSendMessage}
          onStop={handleStop}
          isStreaming={isStreaming}
          streamError={streamError}
          model={model}
          setModel={setModel}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </div>
  );
}
