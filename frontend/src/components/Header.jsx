import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, Settings, LogOut, BookOpen, CheckCircle, FileText, PlayCircle, LayoutDashboard, Menu, X, Home } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';
import NotificationBell from './NotificationBell';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!user;
  
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  
  const [hasEnrolledCourses, setHasEnrolledCourses] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = 'unset';
  }, [location.pathname]);


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
    const checkEnrollment = async () => {

      if (isLoggedIn) {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const res = await axios.get('http://localhost:5000/api/users/student/stats', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && res.data.totalCourses > 0) {
              setHasEnrolledCourses(true);
            }
          }
        } catch (error) {
          console.error('Error checking enrollment stats:', error);
        }
      }
    };
    checkEnrollment();
  }, [isLoggedIn]);

  // Handle outside click for notification and search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header-container">
      <div className="header-content">
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
                        <div className="search-item-thumbnail">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="search-item-img" />
                          ) : (
                            <div className="search-item-icon-fallback">
                              {item.type === 'course' ? <PlayCircle size={18} /> : <FileText size={18} />}
                            </div>
                          )}
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
            <div className="auth-buttons desktop-only">
              <Link to="/login" className="btn-login">Đăng nhập</Link>
              <Link to="/register" className="btn-register">Đăng ký</Link>
            </div>
          ) : (
            <div className="user-actions desktop-only">
              {!isInstructorRoute && hasEnrolledCourses && (
                <Link to="/student-dashboard" className="my-courses-link">Khóa học của tôi</Link>
              )}
              
              <NotificationBell />

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

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar/Drawer */}
      <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-content">
          <div className="mobile-search-section">
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <nav className="mobile-nav">
            <Link to="/" className="mobile-nav-item">
              <Home size={20} />
              <span>Trang chủ</span>
            </Link>
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="mobile-nav-item">
                  <LogOut size={20} />
                  <span>Đăng nhập</span>
                </Link>
                <Link to="/register" className="mobile-nav-item">
                  <User size={20} />
                  <span>Đăng ký</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/student-dashboard" className="mobile-nav-item">
                  <LayoutDashboard size={20} />
                  <span>Dashboard của tôi</span>
                </Link>
                <Link to="/profile" className="mobile-nav-item">
                  <User size={20} />
                  <span>Trang cá nhân</span>
                </Link>
                <Link to="/settings" className="mobile-nav-item">
                  <Settings size={20} />
                  <span>Cài đặt</span>
                </Link>
                <button onClick={handleLogout} className="mobile-nav-item mobile-logout">
                  <LogOut size={20} />
                  <span>Đăng xuất</span>
                </button>
              </>
            )}
          </nav>

          <footer className="mobile-drawer-footer">
            <div className="logo minified">
              <BookOpen size={24} />
              <span>EducoreAcademy</span>
            </div>
          </footer>
        </div>
        <div className="mobile-drawer-overlay" onClick={toggleMenu}></div>
      </div>
    </header>

  );
};

export default Header;
