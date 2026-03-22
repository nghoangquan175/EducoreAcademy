import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, BookOpen } from 'lucide-react';
import axios from 'axios';
import { loginAPI, googleLoginAPI, facebookLoginAPI } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const registered = searchParams.get('registered') === '1';
  const returnUrl = location.state?.returnUrl || searchParams.get('returnUrl');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !returnUrl) {
      navigate('/');
    }
  }, [user, navigate, returnUrl]);


  const handleLoginSuccess = async (data) => {
    login(data);
    if (location.state?.action === 'enroll_free' && location.state?.courseId) {
      try {
        await axios.post(`http://localhost:5000/api/courses/${location.state.courseId}/enroll`, {}, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        navigate(location.state.returnUrl || `/learn/${location.state.courseId}`);
      } catch (err) {
        console.error('Lỗi khi đăng ký khóa học tự động:', err);
        navigate(location.state.returnUrl || '/');
      }
    } else if (returnUrl) {
      navigate(returnUrl);
    } else {
      // Logic mới: Nếu student chưa đăng ký khóa học thì về Home (/)
      // Nếu đã đăng ký rồi thì vào Dashboard (/student-dashboard)
      if (data.role === 'student') {
        if (data.hasEnrolledCourses) {
          navigate('/student-dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        const { data } = await googleLoginAPI(tokenResponse.access_token);
        if (data.role !== 'student') {
          setError('Tài khoản này là tài khoản Giảng viên/Admin. Vui lòng đăng nhập tại cổng nội bộ.');
          setLoading(false);
          return;
        }
        await handleLoginSuccess(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google thất bại'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginAPI(email, password);
      if (data.role !== 'student') {
        setError('Tài khoản này là tài khoản Giảng viên/Admin. Vui lòng đăng nhập tại cổng nội bộ.');
        setLoading(false);
        return;
      }
      await handleLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await googleLoginAPI(credentialResponse.credential);
      if (data.role !== 'student') {
        setError('Tài khoản này là tài khoản Giảng viên/Admin. Vui lòng đăng nhập tại cổng nội bộ.');
        setLoading(false);
        return;
      }
      await handleLoginSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    if (typeof window.FB === 'undefined') {
      setError('Facebook SDK chưa được tải. Vui lòng thử lại sau.');
      return;
    }
    // FB.login callback MUST be a regular (non-async) function
    window.FB.login((response) => {
      if (response.authResponse) {
        setLoading(true);
        (async () => {
          try {
            const { data } = await facebookLoginAPI(response.authResponse.accessToken);
            if (data.role !== 'student') {
              setError('Tài khoản này là tài khoản Giảng viên/Admin. Vui lòng đăng nhập tại cổng nội bộ.');
              setLoading(false);
              return;
            }
            await handleLoginSuccess(data);
          } catch (err) {
            setError(err.response?.data?.message || 'Đăng nhập Facebook thất bại');
          } finally {
            setLoading(false);
          }
        })();
      }
    }, { scope: 'public_profile,email' });
  };

  if (user) return null;

  return (
    <div className="auth-page">
      {/* Left panel — decorative */}
      <div className="auth-panel-left">
        <Link to="/" className="auth-brand">
          <BookOpen size={36} />
          <span>EducoreAcademy</span>
        </Link>
        <div className="auth-panel-content">
          <h2>Chào mừng trở lại!</h2>
          <p>Tiếp tục hành trình học tập của bạn cùng hàng ngàn khoá học chất lượng.</p>
        </div>
        <div className="auth-panel-circles">
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">
            Chưa có tài khoản?{' '}
            <Link to="/register" state={{ returnUrl }} className="auth-link">Đăng ký ngay</Link>
          </p>

          {registered && (
            <div className="auth-success">
              ✅ Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password" className="auth-link">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Đăng nhập'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc tiếp tục với</span></div>

          {/* Social Buttons */}
          <div className="social-buttons">
            <button className="btn-social btn-google" onClick={() => handleGoogleLogin()}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            <button className="btn-social btn-facebook" onClick={handleFacebookLogin}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Tiếp tục với Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
