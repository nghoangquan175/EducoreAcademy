import React, { useState, useEffect } from 'react';
import { X, DollarSign, Tag, Info, Monitor, Layers } from 'lucide-react';
import axios from 'axios';
import './SalesSetupModal.css';

const SalesSetupModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  onSuccess,
  onPublishRequested 
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    course: null,
    policy: null,
    config: null
  });

  const [form, setForm] = useState({
    isPro: true,
    price: 0,
    salePrice: 0,
    discountPercent: 0
  });

  useEffect(() => {
    if (isOpen && courseId) {
      fetchData();
    }
  }, [isOpen, courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/admin/publish-config/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const { course, policy, config } = res.data;
      setData({ course, policy, config });

      // Initial form values
      if (config) {
        setForm({
          isPro: config.isPro,
          price: Number(config.price),
          salePrice: Number(config.salePrice),
          discountPercent: Number(config.discountPercent)
        });
      } else {
        // Default values based on policy or course
        const basePrice = (policy?.type === 'PERCENT' || policy?.type === 'HYBRID') 
          ? Number(policy.pricePerPurchase) 
          : Number(course.price);

        setForm({
          isPro: true,
          price: basePrice,
          salePrice: basePrice,
          discountPercent: 0
        });
      }
    } catch (error) {
      console.error('Error fetching publish config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePro = (e) => {
    const isPro = e.target.checked;
    if (!isPro) {
      setForm({ ...form, isPro: false, salePrice: 0, discountPercent: 100 });
    } else {
      setForm({ ...form, isPro: true, salePrice: form.price, discountPercent: 0 });
    }
  };

  const handlePriceChange = (value) => {
    const newPrice = Number(value);
    const salePrice = newPrice * (1 - form.discountPercent / 100);
    setForm({ ...form, price: newPrice, salePrice: Math.round(salePrice) });
  };

  const handlePercentChange = (value) => {
    const percent = Math.min(100, Math.max(0, Number(value)));
    const salePrice = form.price * (1 - percent / 100);
    setForm({ ...form, discountPercent: percent, salePrice: Math.round(salePrice) });
  };

  const handleSalePriceChange = (value) => {
    const salePrice = Number(value);
    const percent = form.price > 0 ? ((form.price - salePrice) / form.price) * 100 : 0;
    setForm({ ...form, salePrice, discountPercent: Number(percent.toFixed(1)) });
  };

  const handleSubmit = async (publish = false) => {
    if (publish && onPublishRequested) {
      onPublishRequested(form);
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`http://localhost:5000/api/admin/publish-config/${courseId}`, {
        ...form,
        publish: false
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      onSuccess('Đã lưu cấu hình bán hàng');
      onClose();
    } catch (error) {
      console.error('Error saving publish config:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFixedPolicy = data.policy?.type === 'FIXED';
  const canEditBasePrice = isFixedPolicy;

  return (
    <div className="sales-setup-overlay">
      <div className="sales-setup-content">
        <div className="sales-setup-header">
          <h3><Tag size={22} className="text-primary" /> Cấu hình & Đăng tải</h3>
          <button className="sales-setup-close" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <div className="sales-setup-body">
            <div className="sales-setup-info">
              <Info size={16} />
              <span>
                {isFixedPolicy 
                  ? "Đây là khóa học Mua đứt (FIXED). Bạn có toàn quyền định giá niêm yết và giá bán." 
                  : `Chính sách: ${data.policy?.type}. Giá quy ước được tính theo thỏa thuận (${data.policy?.instructorPercent}% doanh thu cho GV).`}
              </span>
            </div>

            <div className="sales-setup-toggle-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={18} color={form.isPro ? '#4f46e5' : '#64748b'} />
                <span style={{ fontWeight: '600', color: form.isPro ? '#1e293b' : '#64748b' }}>
                  {form.isPro ? 'Khóa học trả phí (PRO)' : 'Khóa học miễn phí (FREE)'}
                </span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={form.isPro} onChange={handleTogglePro} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="sales-setup-group">
              <label>Giá niêm yết (Gốc)</label>
              <div className="sales-setup-input-wrapper">
                <input 
                  type="number" 
                  className="sales-setup-input" 
                  value={form.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  disabled={!canEditBasePrice || !form.isPro}
                  placeholder="Nhập giá niêm yết"
                />
                <span className="sales-setup-currency">VNĐ</span>
              </div>
              {!canEditBasePrice && (
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                  * Giá này được lấy từ Giá quy ước trong Chính sách doanh thu (không được sửa).
                </small>
              )}
            </div>

            <div className="sales-setup-grid">
              <div className="sales-setup-group">
                <label>% Giảm giá</label>
                <div className="sales-setup-input-wrapper">
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    className="sales-setup-input" 
                    value={form.discountPercent}
                    onChange={(e) => handlePercentChange(e.target.value)}
                    disabled={!form.isPro}
                  />
                  <span className="sales-setup-currency">%</span>
                </div>
              </div>
              <div className="sales-setup-group">
                <label>Giá bán thực tế</label>
                <div className="sales-setup-input-wrapper">
                  <input 
                    type="number" 
                    className="sales-setup-input" 
                    value={form.salePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    disabled={!form.isPro}
                    style={{ fontWeight: 'bold', color: form.isPro ? '#10b981' : '#64748b' }}
                  />
                  <span className="sales-setup-currency">VNĐ</span>
                </div>
              </div>
            </div>

            {form.isPro && data.policy && data.policy.type !== 'FIXED' && (
              <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#64748b', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>GV nhận ({data.policy.instructorPercent}% của giá quy ước):</span>
                  <span style={{ fontWeight: '600' }}>{(data.policy.pricePerPurchase * data.policy.instructorPercent / 100).toLocaleString('vi-VN')} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b' }}>
                  <span>Admin thực nhận (sau coupon):</span>
                  <span style={{ fontWeight: 'bold' }}>{(form.salePrice - (data.policy.pricePerPurchase * data.policy.instructorPercent / 100)).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sales-setup-footer">
          <button className="btn-setup-secondary btn-setup-save" onClick={onClose} disabled={submitting}>Hủy</button>
          
          {[4, 6].includes(Number(data.course?.published)) ? (
             <button 
              className="btn-setup-primary btn-setup-save" 
              onClick={() => handleSubmit(true)}
              disabled={submitting || loading}
            >
              {submitting ? 'Đăng xử lý...' : 'Lưu & Đăng bài'}
            </button>
          ) : (
            <button 
              className="btn-setup-primary btn-setup-save" 
              onClick={() => handleSubmit(false)}
              disabled={submitting || loading}
            >
              {submitting ? 'Đang lưu...' : 'Cập nhật cấu hình'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesSetupModal;
