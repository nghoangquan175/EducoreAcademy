import React, { useState, useRef, useEffect } from 'react';
import { sendMessageAPI } from '../services/chatService';
import { X, Send, Bot } from 'lucide-react';
import './ChatInbox.css';

const ChatInbox = ({ onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! 👋 Tôi là trợ lý AI của EducoreAcademy. Tôi có thể giúp bạn tìm khóa học, bài viết hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessageAPI(text, conversationId);
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
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
    <div className="chat-inbox">
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
      <div className="chat-inbox-body">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chat-bubble-avatar">
                <Bot size={14} />
              </div>
            )}
            <div className="chat-bubble-content">
              {msg.content}
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
