import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import './StaffLogin.css';

const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'instructor') navigate('/instructor-dashboard');
      else navigate('/');
    }
  }, [user, navigate]);
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password,
      });

      const data = response.data;
      
      if (data.role === 'student') {
         setError('Tài khoản này là tài khoản Học viên. Vui lòng đăng nhập tại trang chủ.');
         setIsLoading(false);
         return;
      }

      login(data);
      
      // Chuyển hướng theo role
      if (data.role === 'admin') {
         navigate('/admin-dashboard');
      } else if (data.role === 'instructor') {
         navigate('/instructor-dashboard');
      }

    } catch (err) {
      setError(
        err.response?.data?.message || 'Lỗi kết nối. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="staff-login-container">
      <div className="staff-login-box">
        <button className="btn-back-home" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Quay lại trang chủ
        </button>

        <div className="staff-login-header">
           <h2>Đăng nhập Cổng Nội Bộ</h2>
           <p>Dành riêng cho Giảng Viên và Quản Trị Viên</p>
        </div>

        {error && <div className="staff-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="staff-form">
          <div className="staff-input-group">
            <label>Email nội bộ</label>
            <div className="staff-input-wrapper">
              <Mail className="staff-input-icon" size={18} />
              <input
                type="email"
                placeholder="Ví dụ: thu@educore.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="staff-input-group">
            <label>Mật khẩu</label>
            <div className="staff-input-wrapper">
              <Lock className="staff-input-icon" size={18} />
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="staff-login-btn" disabled={isLoading}>
            {isLoading ? 'Đang xác thực...' : (
               <>
                 <LogIn size={18} /> Đăng Nhập Hệ Thống
               </>
            )}
          </button>
        </form>

        <div className="staff-login-footer">
          Chỉ các tài khoản được công ty cấp mới có quyền truy cập.<br/>
          Nếu bạn quên mật khẩu, vui lòng liên hệ Admin.
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
