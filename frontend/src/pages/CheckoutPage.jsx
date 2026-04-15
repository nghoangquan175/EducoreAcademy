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
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
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
    try {
      const finalPrice = course.publishConfig ? Number(course.publishConfig.salePrice) : Number(course.price);
      
      if (paymentMethod === 'vnpay') {
        const orderRes = await axios.post(`http://localhost:5000/api/payment/order/create`, {
          courseId: courseId,
          amount: finalPrice
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const { orderId: newOrderId } = orderRes.data;

        const { data } = await axios.post(`http://localhost:5000/api/payment/vnpay/create`, {
          orderId: newOrderId,
          amount: finalPrice
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        }
      } else {
        // Mock flow for other methods
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
        return; // Exit here as we use setTimeout for mock
      }
    } catch (err) {
      console.error('Lỗi thanh toán:', err);
      alert(err.response?.data?.message || 'Lỗi khi xử lý thanh toán');
    } finally {
      if (paymentMethod === 'vnpay') {
        setIsProcessing(false);
      }
    }
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

  const originalPrice = course.publishConfig ? Number(course.publishConfig.price) : Number(course.price);
  const salePrice = course.publishConfig ? Number(course.publishConfig.salePrice) : Number(course.price);
  const discountPercent = course.publishConfig ? Number(course.publishConfig.discountPercent) : 0;
  const discountAmount = originalPrice - salePrice;

  return (
    <div className="checkout-layout-container">
      {/* Premium Mini Header */}
      <header className="checkout-mini-header">
        <div className="checkout-mini-logo" onClick={() => navigate('/')}>
          <div className="logo-icon-box">
             <ShieldCheck size={24} />
          </div>
          <span>Educore Academy</span>
        </div>
        <button className="checkout-cancel-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          <span>Hủy thanh toán</span>
        </button>
      </header>

      <div className="checkout-container">
        <div className="checkout-wrapper">
          
          {/* LEFT PART: Payment Selection */}
          <div className="checkout-main">
            <div className="checkout-card">
              <div className="card-header-label">
                <span className="step-badge">Bước 1/1</span>
                <h2 className="checkout-title">Phương thức thanh toán</h2>
              </div>
              
              <div className="payment-methods">
                <div 
                  className={`payment-method-item ${paymentMethod === 'vnpay' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay')}
                >
                  <div className="method-radio">
                    <div className="radio-inner" />
                  </div>
                  <div className="method-icon">
                    <Landmark size={24} />
                  </div>
                  <div className="method-info">
                    <h4>VNPay</h4>
                    <p>ATM, Visa, Mastercard, JCB, QR Code</p>
                  </div>
                  {paymentMethod === 'vnpay' && <CheckCircle size={18} className="check-indicator" />}
                </div>

                <div 
                  className={`payment-method-item ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                   <div className="method-radio">
                    <div className="radio-inner" />
                  </div>
                  <div className="method-icon">
                    <CreditCard size={24} />
                  </div>
                  <div className="method-info">
                    <h4>Thẻ tín dụng / Ghi nợ</h4>
                    <p>Hỗ trợ thẻ quốc tế (Visa, Master...)</p>
                  </div>
                  {paymentMethod === 'card' && <CheckCircle size={18} className="check-indicator" />}
                </div>
              </div>

              <div className="secure-badge-row mt-8">
                <div className="secure-item">
                  <Lock size={14} /> 
                  <span>Mã hóa SSL 128-bit</span>
                </div>
                <div className="secure-item">
                  <ShieldCheck size={14} />
                  <span>Thanh toán an toàn</span>
                </div>
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
                <span>{discountPercent > 0 ? `Giá gốc` : 'Giá tiền'}</span>
                <span className={discountPercent > 0 ? "line-through" : ""}>{formatCurrency(originalPrice)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="price-row">
                  <span>Khuyến mãi ({discountPercent}%)</span>
                  <span className="text-green-500">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Tổng cộng</span>
                <span>{formatCurrency(salePrice)}</span>
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
