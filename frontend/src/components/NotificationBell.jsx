import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './NotificationBell.css';

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Khóa học mới', message: 'Khóa học React nâng cao vừa được ra mắt.', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 2, title: 'Báo cáo tiến độ', message: 'Bạn đã hoàn thành 50% khóa học Node.js.', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 3, title: 'Cập nhật hệ thống', message: 'Hệ thống sẽ bảo trì vào 12h đêm nay.', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

const NotificationBell = ({ iconSize = 24, buttonClassName = "bell-btn" }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && Array.isArray(res.data)) {
            setNotifications(res.data);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleToggleNotifications = async () => {
    const newShowStatus = !showNotifications;
    setShowNotifications(newShowStatus);

    if (newShowStatus && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClick = async (id, isRead) => {
    if (!isRead) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    }
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className={buttonClassName} 
        aria-label="Notifications"
        onClick={handleToggleNotifications}
      >
        <Bell size={iconSize} />
        {unreadCount > 0 && <span className="unread-dot"></span>}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Thông báo</h4>
            {unreadCount > 0 && (
              <span className="mark-all-btn" onClick={markAllAsRead}>Đánh dấu đã đọc</span>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                >
                  {!notif.isRead && <div className="unread-indicator"></div>}
                  <div className="notification-content">
                    <h5 className="notification-title">{notif.title}</h5>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <CheckCircle size={32} className="no-notif-icon" />
                <p>Không có thông báo</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
