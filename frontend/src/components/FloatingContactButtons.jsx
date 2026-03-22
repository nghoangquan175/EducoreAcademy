import React, { useState } from 'react';
import './FloatingContactButtons.css';
import { FaFacebookF } from 'react-icons/fa';
import { MessageCircle } from 'lucide-react';
import ChatInbox from './ChatInbox';

const FloatingContactButtons = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const zaloPhone = import.meta.env.VITE_ZALO_PHONE || "your_phone_number"; 
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/your_page";
  
  const zaloUrl = `https://zalo.me/${zaloPhone}`;

  return (
    <>
      {/* Chat Inbox Popup */}
      {isChatOpen && <ChatInbox onClose={() => setIsChatOpen(false)} />}

      <div className="floating-contact-container">
        {/* AI Chat Button */}
        <button 
          className={`floating-btn chatbot-btn ${isChatOpen ? 'chatbot-btn--active' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Chat với AI"
        >
          {isChatOpen ? (
            <span className="chatbot-icon-close">✕</span>
          ) : (
            <MessageCircle size={22} />
          )}
        </button>

        {/* Zalo Button */}
        <a 
          href={zaloUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="floating-btn zalo-btn"
          title="Chat qua Zalo"
        >
          <img 
            src="https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Zalo-Arc.png" 
            alt="Zalo" 
            className="zalo-icon"
          />
        </a>

        {/* Facebook Button */}
        <a 
          href={facebookUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="floating-btn facebook-btn"
          title="Gửi tin nhắn Facebook"
        >
          <FaFacebookF />
        </a>
      </div>
    </>
  );
};

export default FloatingContactButtons;
