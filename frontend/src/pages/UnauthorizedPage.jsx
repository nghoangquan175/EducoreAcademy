import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import './UnauthorizedPage.css';

const UnauthorizedPage = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <ShieldAlert size={80} className="unauthorized-icon" />
        <h1>Từ Chối Truy Cập</h1>
        <p>
          Bạn không có quyền hạn phân hệ để truy cập vào trang này.<br/>
          Nếu đây là sự nhầm lẫn, vui lòng liên hệ Ban quản trị để được hỗ trợ cấp quyền.
        </p>
        <Link to="/" className="btn-back-home">
          <Home size={18} /> Quay Cửa Hàng Khóa Học
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
