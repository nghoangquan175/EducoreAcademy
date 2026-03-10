import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Plus, Trash2, Video, ArrowLeft } from 'lucide-react';
import './CourseEditor.css';

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [course, setCourse] = useState({
    title: '', description: '', price: 0, category: 'Phát triển Web', thumbnail: '', previewVideoUrl: '', level: 'Beginner', isPro: false
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Tạm thời bỏ qua load data cũ nếu Edit mode, tập trung làm UI Create trước

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
       if (name === 'isPro' && !checked) {
          setCourse({ ...course, isPro: false, price: 0 }); // Force price 0 when reverting to Free
       } else {
          setCourse({ ...course, [name]: checked });
       }
    } else {
       setCourse({ ...course, [name]: value });
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingThumb(true);
    try {
       // Need the token for the protected route
       const token = localStorage.getItem('token');
       const res = await axios.post('http://localhost:5000/api/upload/image', formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${token}`
         }
       });
       
       setCourse({ ...course, thumbnail: res.data.url });
    } catch (error) {
       console.error("Upload error:", error);
       alert('Tải ảnh bìa thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
       setUploadingThumb(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g., 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File video quá lớn. Vui lòng chọn file dưới 100MB.');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);

    setUploadingVideo(true);
    try {
       const token = localStorage.getItem('token');
       const res = await axios.post('http://localhost:5000/api/upload/video', formData, {
         headers: {
           'Content-Type': 'multipart/form-data',
           Authorization: `Bearer ${token}`
         }
       });
       
       setCourse({ ...course, previewVideoUrl: res.data.url });
    } catch (error) {
       console.error("Upload video error:", error);
       alert('Tải video thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
       setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/courses', course, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã lưu thông tin khóa học thành công!');
      navigate('/instructor-dashboard');
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="editor-loading">Đang tải...</div>;

  return (
    <div className="course-editor-wrapper">
      <div className="editor-container">
        
        <div className="editor-header">
           <button className="btn-back" onClick={() => navigate('/instructor-dashboard')}>
             <ArrowLeft size={18} /> Quay lại
           </button>
           <h1>{isEditMode ? 'Chỉnh sửa Khóa học' : 'Tạo Khóa học mới'}</h1>
           <button className="btn-save" type="submit" form="course-form">
             <Save size={18} /> Lưu Khóa Học
           </button>
        </div>

        <div className="editor-main-content">
          <form id="course-form" className="basic-info-form" onSubmit={handleSubmit}>
             <div className="form-group">
                <label>Tên khóa học</label>
                <input type="text" name="title" value={course.title} onChange={handleChange} placeholder="VD: Khóa học React 2026..." required />
             </div>

             <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea name="description" value={course.description} onChange={handleChange} rows="4" placeholder="Nhập mô tả về khóa học..." required />
             </div>

             <div className="form-row">
               <div className="form-group half">
                  <label>Loại khóa học</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input 
                        type="radio" 
                        name="isPro" 
                        checked={!course.isPro} 
                        onChange={() => { setCourse({ ...course, isPro: false, price: 0 }); }} 
                      />
                      Miễn phí
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input 
                        type="radio" 
                        name="isPro" 
                        checked={course.isPro} 
                        onChange={() => setCourse({ ...course, isPro: true })} 
                      />
                      Trả phí
                    </label>
                  </div>
               </div>

               <div className="form-group half">
                  <label>Giá tiền (VNĐ)</label>
                  <input 
                    type="number" 
                    name="price" 
                    value={course.price} 
                    onChange={handleChange} 
                    min="0" 
                    disabled={!course.isPro} 
                    required={course.isPro}
                    style={!course.isPro ? { backgroundColor: 'var(--bg-elevated)', opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  {!course.isPro && <small style={{color: 'var(--text-muted)'}}>Khóa học miễn phí không yêu cầu nhập giá.</small>}
               </div>
             </div>

             <div className="form-row">
               <div className="form-group half">
                  <label>Danh mục</label>
                  <input 
                    type="text" 
                    name="category" 
                    list="category-suggestions" 
                    value={course.category} 
                    onChange={handleChange} 
                    placeholder="Chọn hoặc nhập danh mục mới..." 
                    required 
                  />
                  <datalist id="category-suggestions">
                    <option value="Phát triển Web" />
                    <option value="Mobile App" />
                    <option value="Data Science" />
                    <option value="Design" />
                    <option value="IT & Web" />
                    <option value="Ngoại ngữ" />
                    <option value="Marketing" />
                  </datalist>
               </div>
             </div>

             <div className="form-row">
               <div className="form-group full">
                  <label>Cấp độ</label>
                  <select name="level" value={course.level} onChange={handleChange}>
                    <option value="Beginner">Beginner (Cơ bản)</option>
                    <option value="Intermediate">Intermediate (Trung bình)</option>
                    <option value="Advanced">Advanced (Nâng cao)</option>
                    <option value="All Levels">All Levels (Mọi cấp độ)</option>
                  </select>
               </div>
             </div>

             {/* Upload Component */}
             <div className="form-row">
               <div className="form-group upload-group half">
                  <label>Ảnh bìa (Thumbnail)</label>
                  <div className="upload-box">
                    <input 
                      type="file" 
                      id="thumbnail-upload" 
                      accept="image/*" 
                      onChange={handleThumbnailUpload} 
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="thumbnail-upload" className="upload-label-area">
                      {uploadingThumb ? (
                        <div className="uploading-state">
                          <div className="spinner-border"></div>
                          <span>Đang tải ảnh lên...</span>
                        </div>
                      ) : course.thumbnail ? (
                        <div className="image-preview-wrapper" style={{ height: '160px' }}>
                          <img src={course.thumbnail} alt="Thumbnail preview" className="preview-image" />
                          <div className="preview-overlay">
                            <Plus size={24} />
                            <span>Đổi ảnh khác</span>
                          </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder" style={{ height: '160px', padding: '15px' }}>
                          <Plus size={24} />
                          <span style={{ fontSize: '0.85rem' }}>Nhấn để chọn ảnh từ máy (JPG, PNG, WEBP)</span>
                        </div>
                      )}
                    </label>
                  </div>
               </div>

               <div className="form-group upload-group half">
                  <label>Video giới thiệu khóa học</label>
                  <div className="upload-box">
                    <input 
                      type="file" 
                      id="video-upload" 
                      accept="video/*" 
                      onChange={handleVideoUpload} 
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="video-upload" className="upload-label-area">
                      {uploadingVideo ? (
                        <div className="uploading-state">
                          <div className="spinner-border"></div>
                          <span>Đang tải video lên...</span>
                        </div>
                      ) : course.previewVideoUrl ? (
                        <div className="video-preview-wrapper" style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '8px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                           <Video size={48} />
                           <span style={{ marginTop: '8px', fontWeight: 'bold' }}>Đã tải lên Video</span>
                           <div className="preview-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                             <Plus size={24} />
                             <span>Đổi video khác</span>
                           </div>
                        </div>
                      ) : (
                        <div className="upload-placeholder" style={{ height: '160px', padding: '15px' }}>
                          <Video size={24} />
                          <span style={{ fontSize: '0.85rem' }}>Nhấn để chọn video từ máy (MP4, MOV) - Tối đa 100MB</span>
                        </div>
                      )}
                    </label>
                  </div>
               </div>
             </div>

          </form>
          
          {/* Note: In a real app, Curriculum is usually edited after the basic course is created to secure a courseId first */}
          {isEditMode && (
             <div className="curriculum-editor-section">
                <h2>Cấu trúc Khóa học (Chương & Bài học)</h2>
                <div className="alert-info">Tính năng thêm Chương và Upload Video bài giảng sẽ có mặt sau khi thiết lập Cloudinary API Key.</div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
