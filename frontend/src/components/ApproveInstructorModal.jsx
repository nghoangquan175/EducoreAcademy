import React, { useState } from 'react';
import { X, Mail, Lock, CheckCircle } from 'lucide-react';
import './ApproveInstructorModal.css';

const ApproveInstructorModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  applicantName, 
  applicantEmail,
  loading 
}) => {
  const [email, setEmail] = useState(applicantEmail || '');
  const [password, setPassword] = useState('');

  // Sync email when prop changes
  React.useEffect(() => {
    if (isOpen) {
      setEmail(applicantEmail || '');
      setPassword(''); // Reset password when opening
    }
  }, [applicantEmail, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(email, password);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content approve-instructor-modal admin-content-fade-in">
        <div className="modal-header">
          <div className="header-title">
            <CheckCircle size={24} className="success-icon" />
            <h3>Phê duyệt Giảng viên</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-desc">
            Thiết lập tài khoản đăng nhập cho <strong>{applicantName}</strong>. 
            Hệ thống sẽ gửi email thông báo sau khi tài khoản được tạo.
          </p>

          <div className="form-group">
            <label>Email đăng nhập</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ví dụ: hotro.educore@gmail.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mật khẩu tạm thời</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input 
                type="text" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu cho giảng viên"
                required
              />
            </div>
            <p className="field-hint">Mật khẩu này sẽ được gửi tới giảng viên qua email.</p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !password || !email}>
              {loading ? <span className="btn-spinner"></span> : 'Xác nhận & Gửi mail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveInstructorModal;
