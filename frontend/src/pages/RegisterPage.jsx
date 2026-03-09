import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, Eye, EyeOff, BookOpen, ArrowLeft, ShieldCheck } from 'lucide-react';
import { googleLoginAPI, facebookLoginAPI, sendOtpAPI, verifyOtpAPI } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const OTP_EXPIRY_SEC = 600; // 10 phút

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // ── Step 1: form state ──────────────────────────────────
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  // Real-time password validation state
  const passwordRules = [
    { id: 'length', text: 'Ít nhất 8 ký tự', check: (p) => p.length >= 8 },
    { id: 'upper', text: 'Chứa ít nhất 1 chữ IN HOA', check: (p) => /[A-Z]/.test(p) },
    { id: 'lower', text: 'Chứa ít nhất 1 chữ thường', check: (p) => /[a-z]/.test(p) },
    { id: 'number', text: 'Chứa ít nhất 1 chữ số', check: (p) => /[0-9]/.test(p) },
    { id: 'special', text: 'Chứa ít nhất 1 ký tự đặc biệt (!@#$%...)', check: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];
  
  const isPasswordValid = passwordRules.every(rule => rule.check(password));

  // ── Step 2: OTP state ───────────────────────────────────
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SEC);
  const timerRef = useRef(null);

  // ── Shared ──────────────────────────────────────────────
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer khi ở step 2
  useEffect(() => {
    if (step === 2) {
      setCountdown(OTP_EXPIRY_SEC);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Step 1: Gửi OTP ────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Vui lòng tạo mật khẩu mạnh hơn để bảo mật tài khoản');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtpAPI(name, email, password);
      setStep(2);
      // Focus ô đầu tiên
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi mã xác minh');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ──────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    [...pasted].forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Xác minh OTP ───────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyOtpAPI(email, code);
      clearInterval(timerRef.current);
      navigate('/login?registered=1');
    } catch (err) {
      setError(err.response?.data?.message || 'Xác minh thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại mã ─────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendOtpAPI(name, email, password);
      setOtp(['', '', '', '', '', '']);
      setCountdown(OTP_EXPIRY_SEC);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timerRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
      // Cooldown 60s
      setResendCooldown(60);
      const cd = setInterval(() => {
        setResendCooldown((v) => { if (v <= 1) { clearInterval(cd); return 0; } return v - 1; });
      }, 1000);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã');
    } finally {
      setLoading(false);
    }
  };

  // ── Social login ────────────────────────────────────────
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        const { data } = await googleLoginAPI(tokenResponse.access_token);
        login(data);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Đăng nhập Google thất bại');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google thất bại'),
  });

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
        <Link to="/" className="auth-brand">
          <BookOpen size={36} />
          <span>EducoreAcademy</span>
        </Link>
        <div className="auth-panel-content">
          {step === 1 ? (
            <>
              <h2>Bắt đầu hành trình của bạn!</h2>
              <p>Tham gia cộng đồng học tập với hơn 50,000 học viên trên khắp Việt Nam.</p>
            </>
          ) : (
            <>
              <h2>Kiểm tra email của bạn</h2>
              <p>Chúng tôi đã gửi mã xác minh 6 số tới <strong>{email}</strong></p>
            </>
          )}
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

          {/* ── STEP 1: Form đăng ký ── */}
          {step === 1 && (
            <>
              <h1 className="auth-title">Tạo tài khoản</h1>
              <p className="auth-subtitle">
                Đã có tài khoản?{' '}
                <Link to="/login" className="auth-link">Đăng nhập</Link>
              </p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSendOtp} className="auth-form">
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
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password rules box: only show unmet rules if password has value */}
                  {password.length > 0 && !isPasswordValid && (
                    <div className="password-rules">
                      {passwordRules
                        .filter((rule) => !rule.check(password)) // Chỉ lấy các rule chưa pass
                        .map((rule) => (
                          <div key={rule.id} className="rule-item pending">
                            <div className="rule-dot" />
                            <span>{rule.text}</span>
                          </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary-auth" disabled={loading || (password.length > 0 && !isPasswordValid)}>
                  {loading ? <span className="btn-spinner" /> : 'Gửi mã xác minh'}
                </button>
              </form>

              <div className="auth-divider"><span>hoặc tiếp tục với</span></div>

              <div className="social-buttons">
                <button className="btn-social btn-google" onClick={() => handleGoogleLogin()}>
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Đăng ký bằng Google
                </button>

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
            </>
          )}

          {/* ── STEP 2: Nhập OTP ── */}
          {step === 2 && (
            <>
              <div className="otp-header">
                <div className="otp-icon-wrap">
                  <ShieldCheck size={32} color="#2563eb" strokeWidth={1.5} />
                </div>
                <h1 className="auth-title">Xác minh email</h1>
                <p className="auth-subtitle">
                  Nhập mã 6 số đã gửi tới <strong>{email}</strong>
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleVerifyOtp} className="auth-form">
                {/* OTP input boxes */}
                <div className="otp-inputs" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      className="otp-box"
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                {/* Countdown */}
                <div className="otp-timer">
                  {countdown > 0 ? (
                    <span>Mã hết hạn sau <strong className="otp-countdown">{formatTime(countdown)}</strong></span>
                  ) : (
                    <span className="otp-expired">Mã đã hết hạn</span>
                  )}
                </div>

                <button type="submit" className="btn-primary-auth" disabled={loading || countdown === 0}>
                  {loading ? <span className="btn-spinner" /> : 'Xác minh'}
                </button>
              </form>

              <div className="otp-resend">
                <span>Không nhận được mã? </span>
                <button
                  className="otp-resend-btn"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại'}
                </button>
              </div>

              <button className="otp-back-btn" onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); }}>
                <ArrowLeft size={16} />
                Quay lại
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
