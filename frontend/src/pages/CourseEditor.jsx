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
    title: '', description: '', price: 0, category: 'Phát triển Web', thumbnail: '', duration: '', level: 'Beginner'
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  
  // Tạm thời bỏ qua load data cũ nếu Edit mode, tập trung làm UI Create trước

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // NOTE: Here we would send data to backend. Assume successful for now in UI.
      alert('Đã lưu thông tin khóa học thành công!');
      navigate('/instructor-dashboard');
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu');
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
           <button className="btn-save" onClick={handleSubmit}>
             <Save size={18} /> Lưu Khóa Học
           </button>
        </div>

        <div className="editor-main-content">
          <form className="basic-info-form">
             <div className="form-group">
                <label>Tên khóa học</label>
                <input type="text" name="title" value={course.title} onChange={handleChange} placeholder="VD: Khóa học React 2026..." required />
             </div>

             <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea name="description" value={course.description} onChange={handleChange} rows="4" placeholder="Nhập mô tả về khóa học..." />
             </div>

             <div className="form-row">
               <div className="form-group half">
                  <label>Giá tiền (VNĐ)</label>
                  <input type="number" name="price" value={course.price} onChange={handleChange} />
               </div>
               <div className="form-group half">
                  <label>Danh mục</label>
                  <select name="category" value={course.category} onChange={handleChange}>
                    <option value="Phát triển Web">Phát triển Web</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Design">Design</option>
                  </select>
               </div>
             </div>

             <div className="form-row">
               <div className="form-group half">
                  <label>Cấp độ</label>
                  <select name="level" value={course.level} onChange={handleChange}>
                    <option value="Beginner">Beginner (Cơ bản)</option>
                    <option value="Intermediate">Intermediate (Trung bình)</option>
                    <option value="Advanced">Advanced (Nâng cao)</option>
                  </select>
               </div>
               <div className="form-group half">
                  <label>Tổng thời lượng ước tính</label>
                  <input type="text" name="duration" value={course.duration} onChange={handleChange} placeholder="VD: 45 hours, 12.5 giờ..." />
               </div>
             </div>

             {/* Upload Component */}
             <div className="form-group upload-group">
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
                      <div className="image-preview-wrapper">
                        <img src={course.thumbnail} alt="Thumbnail preview" className="preview-image" />
                        <div className="preview-overlay">
                          <Plus size={24} />
                          <span>Đổi ảnh khác</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Plus size={24} />
                        <span>Nhấn để chọn ảnh từ máy rính (JPG, PNG, WEBP)</span>
                      </div>
                    )}
                  </label>
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
