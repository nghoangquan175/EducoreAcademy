import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
      <h1>Trang Thanh Toán (Checkout)</h1>
      <p>Đang xử lý thanh toán cho khóa học ID: {courseId}</p>
      <p style={{ color: '#64748b' }}>(Giao diện thanh toán sẽ được xây dựng sau)</p>
      
      <button 
        onClick={() => navigate(-1)}
        style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', background: '#e2e8f0', border: 'none', borderRadius: '6px' }}
      >
        Quay lại
      </button>
    </div>
  );
};

export default CheckoutPage;
