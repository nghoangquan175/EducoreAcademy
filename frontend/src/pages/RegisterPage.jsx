import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, Eye, EyeOff, BookOpen } from 'lucide-react';
import { registerAPI, googleLoginAPI, facebookLoginAPI } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      const { data } = await registerAPI(name, email, password);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await googleLoginAPI(credentialResponse.credential);
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (typeof window.FB === 'undefined') {
      setError('Facebook SDK chưa được tải. Vui lòng thử lại.');
      return;
    }
    window.FB.login(async (response) => {
      if (response.authResponse) {
        setLoading(true);
        try {
          const { data } = await facebookLoginAPI(response.authResponse.accessToken);
          login(data);
          navigate('/');
        } catch (err) {
          setError(err.response?.data?.message || 'Đăng nhập Facebook thất bại');
        } finally {
          setLoading(false);
        }
      }
    }, { scope: 'public_profile,email' });
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel-left register-panel">
        <div className="auth-brand">
          <BookOpen size={36} />
          <span>EducoreAcademy</span>
        </div>
        <div className="auth-panel-content">
          <h2>Bắt đầu hành trình của bạn!</h2>
          <p>Tham gia cộng đồng học tập với hơn 50,000 học viên trên khắp Việt Nam.</p>
        </div>
        <div className="auth-panel-circles">
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-link">Đăng nhập</Link>
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Họ và tên</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc tiếp tục với</span></div>

          <div className="social-buttons">
            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Đăng nhập Google thất bại')}
                text="signup_with"
                shape="rectangular"
                theme="outline"
                width="100%"
              />
            </div>

            <button className="btn-social btn-facebook" onClick={handleFacebookLogin}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Tiếp tục với Facebook
            </button>
          </div>

          <p className="auth-terms">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <Link to="/terms" className="auth-link">Điều khoản dịch vụ</Link>{' '}và{' '}
            <Link to="/privacy" className="auth-link">Chính sách bảo mật</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
