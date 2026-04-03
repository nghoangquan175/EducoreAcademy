import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPasswordAPI } from '../services/authService';
import './AuthPage.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordAPI(email);
      setIsSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="auth-page">
        <div className="auth-panel-left">
          <Link to="/" className="auth-brand">
            <BookOpen size={36} />
            <span>EducoreAcademy</span>
          </Link>
          <div className="auth-panel-content">
            <h2>Kiểm tra Email của bạn</h2>
            <p>Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu tới email của bạn.</p>
          </div>
          <div className="auth-panel-circles">
            <div className="circle c1" />
            <div className="circle c2" />
            <div className="circle c3" />
          </div>
        </div>
        <div className="auth-panel-right">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '24px', color: '#10b981' }}>
              <CheckCircle size={64} style={{ margin: '0 auto' }} />
            </div>
            <h1 className="auth-title">Email đã được gửi!</h1>
            <p className="auth-subtitle" style={{ marginTop: '12px' }}>
              Vui lòng kiểm tra hộp thư đến (và cả thư rác) để tìm link đặt lại mật khẩu.
            </p>
            <Link to="/login" className="btn-primary-auth" style={{ textDecoration: 'none', marginTop: '24px' }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <Link to="/" className="auth-brand">
          <BookOpen size={36} />
          <span>EducoreAcademy</span>
        </Link>
        <div className="auth-panel-content">
          <h2>Quên mật khẩu?</h2>
          <p>Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào tài khoản của mình.</p>
        </div>
        <div className="auth-panel-circles">
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <Link to="/login" className="auth-back-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '24px' }}>
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
          
          <h1 className="auth-title">Quên mật khẩu</h1>
          <p className="auth-subtitle">
            Nhập email của bạn và chúng tôi sẽ gửi cho bạn link để đặt lại mật khẩu.
          </p>

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

            <button type="submit" className="btn-primary-auth" disabled={loading} style={{ marginTop: '12px' }}>
              {loading ? <span className="btn-spinner" /> : 'Gửi yêu cầu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
