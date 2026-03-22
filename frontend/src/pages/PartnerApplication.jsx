import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './PartnerApplication.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const PartnerApplication = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('Kích thước tệp không được vượt quá 5MB.');
        setFile(null);
        e.target.value = null; // reset input
        return;
      }

      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
         setError('Chỉ chấp nhận tệp định dạng .pdf, .doc, hoặc .docx');
         setFile(null);
         e.target.value = null;
         return;
      }

      setFile(selectedFile);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Vui lòng tải lên CV của bạn.');
      return;
    }

    // Basic frontend validation for phone and email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ.');
      return;
    }

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
       setError('Số điện thoại không hợp lệ.');
       return;
    }

    setLoading(true);
    let cvUrl = '';

    try {
      // 1. Upload CV to Cloudinary
      const uploadData = new FormData();
      uploadData.append('document', file);

      const uploadRes = await axios.post('http://localhost:5000/api/upload/document', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      cvUrl = uploadRes.data.url;

      // 2. Submit Application
      await axios.post('http://localhost:5000/api/instructor-applications', {
        ...formData,
        cvUrl
      });

      setSuccess(true);
      toast.success('Hồ sơ của bạn đã được gửi thành công!');

    } catch (err) {
       console.error(err);
       setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
       toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi nộp hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="partner-app-container">
        <div className="partner-app-success">
           <CheckCircle size={64} className="success-icon" />
           <h2>Cảm ơn bạn đã gửi hồ sơ!</h2>
           <p>
             Hồ sơ của bạn đã được EducoreAcademy tiếp nhận. Chúng tôi sẽ xem xét kỹ lưỡng 
             và phản hồi lại bạn qua email trong thời gian sớm nhất.
           </p>
           <button className="back-home-btn" onClick={() => window.location.href='/'}>
             Trở về trang chủ
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page partner-page">
      {/* Left panel — Form */}
      <div className="auth-panel-right partner-form-panel">
        <div className="auth-card partner-auth-card">
          <div className="partner-app-header">
            <h1 className="auth-title">Hợp tác cùng chúng tôi</h1>
            <p className="auth-subtitle">Cùng EducoreAcademy lan tỏa kiến thức và xây dựng cộng đồng học tập vững mạnh.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form partner-form">
            {error && (
              <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <AlertCircle size={18} />
                 <span>{error}</span>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Họ và tên *</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    placeholder="Nhập họ và tên" 
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email liên lạc *</label>
                <div className="input-wrapper">
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="Nhập địa chỉ email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại *</label>
                <div className="input-wrapper">
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    placeholder="Nhập số điện thoại" 
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Giới thiệu bản thân & Kinh nghiệm</label>
              <div className="input-wrapper" style={{ padding: '0', height: 'auto' }}>
                <textarea 
                  id="bio" 
                  name="bio" 
                  rows="3" 
                  placeholder="Bạn có kinh nghiệm giảng dạy hay chuyên môn gì nổi bật?"
                  value={formData.bio}
                  onChange={handleChange}
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px 14px', outline: 'none', resize: 'none' }}
                ></textarea>
              </div>
            </div>

            <div className="form-group file-upload-group">
              <label>CV (Hồ sơ năng lực) *</label>
              <div className="file-upload-box">
                <input 
                  type="file" 
                  id="cv-upload" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <label htmlFor="cv-upload" className="file-upload-label">
                  <Upload size={20} className="upload-icon" />
                  <span>{file ? file.name : 'Tải lên CV (Tối đa 5MB, .pdf, .docx)'}</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary-auth" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? <span className="btn-spinner"></span> : 'Gửi hồ sơ ngay'}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel — Decorative */}
      <div className="auth-panel-left partner-deco-panel">
        <div className="auth-brand" onClick={() => window.location.href='/'} style={{ cursor: 'pointer' }}>
          <BookOpen size={36} />
          <span>EducoreAcademy</span>
        </div>
        <div className="auth-panel-content">
          <h2>Trở thành chuyên gia</h2>
          <p>Tham gia đội ngũ các chuyên gia hàng đầu và mang kiến thức của bạn đến với hàng triệu học viên trên khắp Việt Nam.</p>
        </div>
        <div className="auth-panel-circles">
          <div className="circle c1" />
          <div className="circle c2" />
          <div className="circle c3" />
        </div>
      </div>
    </div>
  );
};

export default PartnerApplication;
