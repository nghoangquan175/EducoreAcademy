import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageAPI, getLatestConversationAPI, getMessagesAPI } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import './ChatInbox.css';

// Strip any leftover markdown from AI response
function stripMarkdown(text) {
  return text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

// Generate or retrieve guest session ID
function getGuestSessionId() {
  let sessionId = sessionStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Xin chào! 👋 Tôi là trợ lý AI của EducoreAcademy. Tôi có thể giúp bạn tìm khóa học, bài viết hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì?'
};

const ChatInbox = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesBodyRef = useRef(null);
  const inputRef = useRef(null);
  const prevUserRef = useRef(user);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load conversation for logged-in users on mount / when user changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!user) {
        // If user logged out, reset to welcome only if we had loaded a user conversation
        if (prevUserRef.current) {
          setMessages([WELCOME_MESSAGE]);
          setConversationId(null);
          setHasMore(false);
          setInitialLoaded(false);
        }
        prevUserRef.current = user;
        return;
      }

      prevUserRef.current = user;

      // Only load once per user session
      if (initialLoaded) return;

      try {
        const data = await getLatestConversationAPI();
        if (data.conversation && data.messages.length > 0) {
          setConversationId(data.conversation.id);
          setMessages([
            WELCOME_MESSAGE,
            ...data.messages.map(m => ({ role: m.role, content: m.content, id: m.id }))
          ]);
          setHasMore(data.hasMore);
        }
        setInitialLoaded(true);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        setInitialLoaded(true);
      }
    };

    loadConversation();
  }, [user, initialLoaded]);

  // Infinite scroll up — load older messages
  const handleScroll = useCallback(async () => {
    const el = messagesBodyRef.current;
    if (!el || !hasMore || isLoadingMore || !conversationId) return;

    if (el.scrollTop < 50) {
      setIsLoadingMore(true);
      const prevHeight = el.scrollHeight;

      try {
        // Find the oldest message id (skip the welcome message at index 0)
        const realMessages = messages.filter(m => m.id);
        const oldestId = realMessages.length > 0 ? realMessages[0].id : null;

        if (!oldestId) {
          setIsLoadingMore(false);
          return;
        }

        const data = await getMessagesAPI(conversationId, { before: oldestId, limit: 10 });
        if (data.messages.length > 0) {
          setMessages(prev => [
            prev[0], // keep welcome message
            ...data.messages.map(m => ({ role: m.role, content: m.content, id: m.id })),
            ...prev.slice(1)
          ]);
          setHasMore(data.hasMore);

          // Maintain scroll position
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight - prevHeight;
          });
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, conversationId, messages]);

  // Send message
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const sessionId = !user ? getGuestSessionId() : null;
      const data = await sendMessageAPI(text, conversationId, sessionId);
      setConversationId(data.conversationId);
      const cleanContent = stripMarkdown(data.message);
      setMessages(prev => [...prev, { role: 'assistant', content: cleanContent }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-inbox ${!isOpen ? 'chat-inbox--hidden' : ''}`}>
      {/* Header */}
      <div className="chat-inbox-header">
        <div className="chat-inbox-header-info">
          <div className="chat-inbox-avatar">
            <Bot size={20} />
          </div>
          <div>
            <div className="chat-inbox-name">AI Trợ lý</div>
            <div className="chat-inbox-status">
              <span className="chat-inbox-dot"></span>
              Trực tuyến
            </div>
          </div>
        </div>
        <button className="chat-inbox-close" onClick={onClose} title="Đóng">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div 
        className="chat-inbox-body" 
        ref={messagesBodyRef}
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="chat-load-more">
            <Loader2 size={18} className="chat-spinner" />
          </div>
        )}
        {hasMore && !isLoadingMore && (
          <div className="chat-load-more">
            <span className="chat-load-more-hint">Kéo lên để xem tin nhắn cũ</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || `msg-${i}`} className={`chat-bubble chat-bubble--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chat-bubble-avatar">
                <Bot size={14} />
              </div>
            )}
            <div className="chat-bubble-content">
              {stripMarkdown(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble chat-bubble--assistant">
            <div className="chat-bubble-avatar">
              <Bot size={14} />
            </div>
            <div className="chat-bubble-content chat-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-inbox-footer">
        <input
          ref={inputRef}
          className="chat-inbox-input"
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button 
          className="chat-inbox-send" 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          title="Gửi"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatInbox;
