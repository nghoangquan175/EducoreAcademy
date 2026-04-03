import React, { useState } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';
import './RefundRequestModal.css';

const RefundRequestModal = ({ isOpen, onClose, course, onSubmit, isSubmitting }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !course) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(reason);
  };

  return (
    <div className="refund-modal-overlay" onClick={onClose}>
      <div className="refund-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="refund-modal-header">
          <div className="header-title-group">
            <div className="header-icon-wrapper">
               <AlertCircle size={20} />
            </div>
            <h3>Yêu cầu hoàn tiền</h3>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="refund-modal-body">
            <div className="refund-course-summary">
              <img src={course.thumbnail || 'https://via.placeholder.com/120x80'} alt={course.title} />
              <div className="course-details">
                <span className="label">Khóa học đang yêu cầu:</span>
                <h4 className="title">{course.title}</h4>
                <div className="price-tag">
                  Số tiền hoàn lại: <strong>{parseFloat(course.paidAmount || course.price || 0).toLocaleString()}đ</strong>
                </div>
              </div>
            </div>

            <div className="refund-policy-notice">
              <div className="notice-header">
                <Info size={16} />
                <span>Điều kiện hoàn tiền (Quy định 7 ngày)</span>
              </div>
              <ul>
                <li>Yêu cầu trong vòng <strong>7 ngày</strong> kể từ lúc thanh toán thành công.</li>
                <li>Tiến độ học tập video phải <strong>dưới 15%</strong>.</li>
                <li>Chưa hoàn thành khóa học và chưa được cấp chứng chỉ.</li>
              </ul>
            </div>

            <div className="refund-form-group">
              <label>Lý do hoàn tiền <span className="required">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Vui lòng chia sẻ lý do bạn muốn hoàn tiền để chúng tôi cải thiện chất lượng dịch vụ..."
                rows={4}
              ></textarea>
              <p className="form-hint">Lý do của bạn sẽ được gửi đến Admin để xem xét phê duyệt.</p>
            </div>
          </div>

          <div className="refund-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? (
                <span className="loader-inline">Đang gửi yêu cầu...</span>
              ) : (
                'Xác nhận gửi yêu cầu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundRequestModal;
