import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Home, ArrowRight } from 'lucide-react';
import './PaymentResult.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');
  const courseId = searchParams.get('courseId');

  const isSuccess = status === 'success';

  const handleRetry = () => {
    if (courseId && courseId !== 'unknown') {
      navigate(`/checkout/${courseId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        {isSuccess ? (
          <>
            <div className="result-icon success">
              <CheckCircle size={64} />
            </div>
            <h1 className="result-title">Thanh toán thành công!</h1>
            <p className="result-message">
              Cảm ơn bạn đã đăng ký khóa học. Mã đơn hàng của bạn là <strong>#{orderId}</strong>. 
              Bây giờ bạn có thể bắt đầu hành trình học tập của mình.
            </p>
            <div className="result-actions">
              <button className="btn-primary" onClick={() => navigate('/student-dashboard')}>
                VÀO TRANG HỌC TẬP <ArrowRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="result-icon failure">
              <XCircle size={64} />
            </div>
            <h1 className="result-title">Thanh toán thất bại</h1>
            <p className="result-message">
              Rất tiếc, đã có lỗi xảy ra trong quá trình xử lý thanh toán cho đơn hàng <strong>#{orderId}</strong>. 
              Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp diễn.
            </p>
            <div className="result-actions">
              <button className="btn-secondary" onClick={() => navigate('/')}>
                QUAY LẠI TRANG CHỦ <Home size={18} />
              </button>
              <button className="btn-primary" onClick={handleRetry}>
                THỬ THANH TOÁN LẠI
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
