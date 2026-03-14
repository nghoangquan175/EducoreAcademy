import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, 
  Landmark, 
  CheckCircle, 
  ShieldCheck, 
  Lock,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import './CheckoutPage.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourse(data);
      } catch (err) {
        console.error('Lỗi khi tải thông tin khóa học:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment delay
    setTimeout(async () => {
      try {
        await axios.post(`http://localhost:5000/api/courses/${courseId}/enroll`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShowSuccess(true);
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi khi xử lý thanh toán');
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  const goToLearning = () => {
    navigate('/student-dashboard');
  };

  if (loading) return (
    <div className="checkout-container">
      <div className="loading-state">Đang chuẩn bị đơn hàng...</div>
    </div>
  );

  if (!course) return (
    <div className="checkout-container">
      <div className="error-state">Không tìm thấy thông tin khóa học</div>
    </div>
  );

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        
        {/* LEFT PART: Payment Selection */}
        <div className="checkout-main">
          <div className="checkout-card">
            <h2 className="checkout-title">Phương thức thanh toán</h2>
            
            <div className="payment-methods">
              <div 
                className={`payment-method-item ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="method-icon">
                  <CreditCard size={24} />
                </div>
                <div className="method-info">
                  <h4>Thẻ tín dụng / Ghi nợ</h4>
                  <p>Visa, Mastercard, JCB, Amex</p>
                </div>
                {paymentMethod === 'card' && <CheckCircle size={20} className="check-indicator" />}
              </div>

              <div 
                className={`payment-method-item ${paymentMethod === 'transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('transfer')}
              >
                <div className="method-icon">
                  <Landmark size={24} />
                </div>
                <div className="method-info">
                  <h4>Chuyển khoản ngân hàng</h4>
                  <p>Vietcombank, Techcombank, MB Bank...</p>
                </div>
                {paymentMethod === 'transfer' && <CheckCircle size={20} className="check-indicator" />}
              </div>
            </div>

            <div className="secure-notice mt-6">
              <Lock size={14} /> 
              <span>Mọi giao dịch đều được mã hóa và bảo mật tuyệt đối.</span>
            </div>
          </div>
        </div>

        {/* RIGHT PART: Order Summary */}
        <div className="checkout-sidebar">
          <div className="checkout-card order-summary-card">
            <div className="summary-header">
              <h3 className="text-xl font-bold">Tóm tắt đơn hàng</h3>
            </div>

            <div className="summary-course-info">
              <img src={course.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="summary-thumb" />
              <div>
                <h4 className="summary-course-title">{course.title}</h4>
                <p className="text-xs text-slate-400">Giảng viên: {course.instructor?.name}</p>
              </div>
            </div>

            <div className="price-details">
              <div className="price-row">
                <span>Giá gốc</span>
                <span className="line-through">{formatCurrency(course.price * 1.5)}</span>
              </div>
              <div className="price-row">
                <span>Khuyến mãi</span>
                <span className="text-green-400">-{formatCurrency(course.price * 0.5)}</span>
              </div>
              <div className="price-row total">
                <span>Tổng cộng</span>
                <span>{formatCurrency(course.price)}</span>
              </div>
            </div>

            <button 
              className="btn-confirm-payment"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN THANH TOÁN'}
            </button>

            <div className="trust-badges">
              <div className="trust-badge">
                <ShieldCheck size={14} /> <span>An toàn</span>
              </div>
              <div className="trust-badge">
                <Lock size={14} /> <span>Bảo mật</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal-overlay">
            <div className="success-modal">
              <div className="success-icon">
                <CheckCircle size={48} />
              </div>
              <h2>Thoanh toán thành công!</h2>
              <p>Chào mừng bạn đến với khóa học <strong>{course.title}</strong>. Bạn có thể bắt đầu học ngay bây giờ.</p>
              <button className="btn-go-learn" onClick={goToLearning}>
                BẮT ĐẦU HỌC NGAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
