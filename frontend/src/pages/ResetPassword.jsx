import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { resetPasswordAPI } from '../services/authService';
import './AuthPage.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password rules validation
  const rules = [
    { label: 'Tối thiểu 8 ký tự', passed: password.length >= 8 },
    { label: 'Ít nhất 1 chữ hoa', passed: /[A-Z]/.test(password) },
    { label: 'Ít nhất 1 chữ thường', passed: /[a-z]/.test(password) },
    { label: 'Ít nhất 1 chữ số', passed: /[0-9]/.test(password) },
    { label: 'Ít nhất 1 ký tự đặc biệt (!@#...)', passed: /[^A-Za-z0-9]/.test(password) },
  ];

  const allRulesPassed = rules.every(r => r.passed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Vui lòng đảm bảo mật khẩu đáp ứng đầy đủ các yêu cầu bảo mật.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordAPI(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Link có thể đã hết hạn hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-panel-left">
          <Link to="/" className="auth-brand">
            <BookOpen size={36} />
            <span>EducoreAcademy</span>
          </Link>
          <div className="auth-panel-content">
            <h2>Mật khẩu đã được cập nhật!</h2>
            <p>Tuyệt vời! Bạn đã lấy lại quyền truy cập vào tài khoản của mình.</p>
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
            <h1 className="auth-title">Thành công!</h1>
            <p className="auth-subtitle" style={{ marginTop: '12px' }}>
              Mật khẩu đã được thay đổi. Bạn sẽ được tự động chuyển hướng về trang đăng nhập sau vài giây.
            </p>
            <Link to="/login" className="btn-primary-auth" style={{ textDecoration: 'none', marginTop: '24px' }}>
              Đăng nhập ngay
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
          <h2>Bảo mật tài khoản</h2>
          <p>Tạo một mật khẩu mới mạnh mẽ để bảo vệ hành trình học tập của bạn.</p>
        </div>
        <div className="auth-panel-circles">
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <h1 className="auth-title">Đặt lại mật khẩu</h1>
          <p className="auth-subtitle">
            Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.
          </p>

          {error && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="password-rules">
              {rules.map((rule, idx) => (
                <div key={idx} className={`rule-item ${rule.passed ? 'passed' : 'pending'}`}>
                  {rule.passed ? <CheckCircle size={14} className="rule-icon" /> : <div className="rule-dot" />}
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Xác nhận mật khẩu</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading} style={{ marginTop: '24px' }}>
              {loading ? <span className="btn-spinner" /> : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
