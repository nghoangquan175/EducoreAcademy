import React, { useState, useEffect } from 'react';
import { Monitor, Home, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DesktopOnlyGuard.css';

const DesktopOnlyGuard = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      // Ngưỡng chặn 1024px theo plan
      setIsMobile(window.innerWidth < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  if (isMobile) {
    return (
      <div className="desktop-guard-overlay">
        <div className="desktop-guard-content">
          <div className="desktop-guard-icon">
            <Monitor size={48} />
          </div>
          <h1 className="desktop-guard-title">Yêu cầu màn hình lớn</h1>
          <p className="desktop-guard-desc">
            Trang quản trị này được tối ưu hóa cho máy tính để bàn. 
            Vui lòng sử dụng thiết bị có màn hình lớn hơn (≥ 1024px) để tiếp tục.
          </p>
          <Link to="/" className="desktop-guard-btn">
            <Home size={18} />
            <span>Về trang chủ</span>
          </Link>
          <div className="desktop-guard-badge">
            <Lock size={12} />
            <span>Khu vực hạn chế truy cập</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default DesktopOnlyGuard;
