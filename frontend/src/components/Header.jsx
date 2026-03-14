import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, BookOpen, CheckCircle, FileText, PlayCircle, LayoutDashboard } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

// Mock data to demonstrate UI before real auth is fully wired
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

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!user;
  
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  
  // Notification states
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        try {
          let url = `http://localhost:5000/api/search?q=${encodeURIComponent(searchTerm)}`;
          if (isInstructorRoute && user) {
            url += `&instructorId=${user.id}`;
          }
          const res = await axios.get(url);
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    // Attempt to fetch real notifications if token exists
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get('http://localhost:5000/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setNotifications(res.data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, []);

  // Handle outside click for notification and search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotifications = async () => {
    const newShowStatus = !showNotifications;
    setShowNotifications(newShowStatus);

    // If opening the dropdown and there are unread notifications
    if (newShowStatus && unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        // Optimistically update UI
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
        // Fallback for mock data without backend
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
        console.error('Error marking exactly one as read', error);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    }
  };

  return (
    <header className="header-container">
      {/* Left: Logo */}
      <div className="header-left">
        <Link to="/" className="logo">
          <BookOpen className="logo-icon" size={28} />
          <span>EducoreAcademy</span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="header-center">
        <div className="search-container" ref={searchContainerRef}>
          <div className={`search-bar ${showSearchDropdown ? 'active' : ''}`}>
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm khóa học, bài viết..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.length >= 2 && searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
              onFocus={() => {
                if (searchTerm.length >= 2) setShowSearchDropdown(true);
              }}
            />
            {isSearching && <div className="search-loader"></div>}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchTerm.length >= 2 && (
            <div className="search-dropdown">
              {searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map((item) => (
                    <Link 
                      key={`${item.type}-${item.id}`} 
                      to={item.type === 'course' ? `/course/${item.id}` : `/article/${item.id}`}
                      className="search-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchTerm('');
                      }}
                    >
                      <div className="search-item-icon">
                        {item.type === 'course' ? <PlayCircle size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-title">{item.title}</div>
                        <div className="search-item-type">
                          {item.type === 'course' ? 'Khóa học' : 'Bài viết'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                !isSearching && (
                  <div className="search-no-results">
                    Không tìm thấy kết quả cho "{searchTerm}"
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="header-right">
        {!isLoggedIn ? (
          <div className="auth-buttons">
            <Link to="/login" className="btn-login">Đăng nhập</Link>
            <Link to="/register" className="btn-register">Đăng ký</Link>
          </div>
        ) : (
          <div className="user-actions">
            {!isInstructorRoute && (
              <Link to="/student-dashboard" className="my-courses-link">Khóa học của tôi</Link>
            )}
            
            {/* Notifications */}
            <div className="notification-container" ref={dropdownRef}>
              <button 
                className="bell-btn" 
                aria-label="Notifications"
                onClick={handleToggleNotifications}
              >
                <Bell size={24} />
                {unreadCount > 0 && <span className="unread-dot"></span>}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Thông báo</h4>
                    {unreadCount > 0 && (
                      <span className="mark-all-btn">Đánh dấu đã đọc</span>
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

            {/* User Avatar */}
            <div className="avatar-container">
              <div className="avatar">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="avatar-img" />
                  : <span className="avatar-initial">{user?.name?.charAt(0).toUpperCase() || <User size={22} />}</span>
                }
              </div>
              <div className="avatar-dropdown">
                <Link to="/student-dashboard" className="dropdown-item">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/profile" className="dropdown-item">
                  <User size={18} />
                  <span>Trang cá nhân</span>
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <Settings size={18} />
                  <span>Cài đặt</span>
                </Link>
                <button 
                  className="dropdown-item btn-logout" 
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
