import React from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  User, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck,
  Percent,
  CreditCard
} from 'lucide-react';
import './RevenuePolicyDetail.css';

const RevenuePolicyDetail = ({ 
  isOpen, 
  onClose, 
  policy, 
  userRole, 
  onAction 
}) => {
  if (!isOpen || !policy) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft': return <span className="status-badge draft">Bản nháp</span>;
      case 'waiting_confirm': return <span className="status-badge pending">Chờ xác nhận</span>;
      case 'accepted': return <span className="status-badge active">Đã chấp nhận</span>;
      case 'rejected': return <span className="status-badge rejected">Đã từ chối</span>;
      default: return null;
    }
  };

  const getPolicyTypeLabel = (type) => {
    switch (type) {
      case 'PERCENT': return 'Chia sẻ phần trăm';
      case 'FIXED': return 'Mức phí cố định';
      case 'HYBRID': return 'Hỗn hợp (Hybrid)';
      default: return type;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content revenue-policy-detail admin-content-fade-in">
        <div className="modal-header">
          <div className="header-title">
            <DollarSign size={24} className="policy-icon" />
            <h3>Chi tiết Chính sách Doanh thu</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label><BookOpen size={16} /> Khóa học áp dụng</label>
                <div className="detail-value highlighted">{policy.course?.title}</div>
              </div>

              <div className="detail-item">
                <label><Clock size={16} /> Trạng thái</label>
                <div className="detail-value">{getStatusBadge(policy.status)}</div>
              </div>

              <div className="detail-item">
                <label><ShieldCheck size={16} /> Loại chính sách</label>
                <div className="detail-value">{getPolicyTypeLabel(policy.type)}</div>
              </div>

              {(policy.type === 'PERCENT' || policy.type === 'HYBRID') && (
                <div className="detail-item">
                  <label><Percent size={16} /> Phần trăm giảng viên</label>
                  <div className="detail-value">{policy.instructorPercent}% doanh thu</div>
                </div>
              )}

              {(policy.type === 'FIXED' || policy.type === 'HYBRID') && (
                <div className="detail-item">
                  <label><CreditCard size={16} /> Mức phí cố định</label>
                  <div className="detail-value">{policy.fixedAmount?.toLocaleString('vi-VN')}đ</div>
                </div>
              )}

              {policy.type === 'HYBRID' && policy.upfrontAmount > 0 && (
                <div className="detail-item">
                  <label><DollarSign size={16} /> Hỗ trợ trả trước</label>
                  <div className="detail-value">{policy.upfrontAmount?.toLocaleString('vi-VN')}đ</div>
                </div>
              )}
            </div>
          </div>

          <div className="audit-section">
            <h4 className="section-title">Lịch sử & Đối soát</h4>
            <div className="audit-grid">
              <div className="audit-item">
                <User size={14} />
                <span>Người tạo (Admin): <strong>{policy.admin?.name || 'Hệ thống'}</strong></span>
              </div>
              <div className="audit-item">
                <Calendar size={14} />
                <span>Ngày tạo: <strong>{new Date(policy.createdAt).toLocaleString('vi-VN')}</strong></span>
              </div>
              
              {policy.confirmedAt && (
                <>
                  <div className="audit-item">
                    <User size={14} />
                    <span>Xác nhận bởi: <strong>{policy.instructor?.name || 'Giảng viên'}</strong></span>
                  </div>
                  <div className="audit-item">
                    <Calendar size={14} />
                    <span>Ngày xác nhận: <strong>{new Date(policy.confirmedAt).toLocaleString('vi-VN')}</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="revenue-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
          
          {userRole === 'admin' && policy.status === 'draft' && (
            <button 
              className="btn-primary" 
              onClick={() => onAction(policy.id, 'send')}
            >
              Gửi cho giảng viên
            </button>
          )}

          {userRole === 'instructor' && policy.status === 'waiting_confirm' && (
            <>
              <button 
                className="btn-danger" 
                onClick={() => onAction(policy.id, 'rejected')}
              >
                <XCircle size={18} /> Từ chối
              </button>
              <button 
                className="btn-success" 
                onClick={() => onAction(policy.id, 'accepted')}
              >
                <CheckCircle size={18} /> Chấp nhận
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenuePolicyDetail;
