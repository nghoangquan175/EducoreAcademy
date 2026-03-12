import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Video, ArrowLeft } from 'lucide-react';
import './CourseEditor.css';

const CourseEditor = ({ courseId, onClose, onSuccess }) => {
  const isEditMode = Boolean(courseId);

  const [course, setCourse] = useState({
    title: '', 
    description: '', 
    price: 0, 
    category: 'Phát triển Web', 
    thumbnail: '', 
    previewVideoUrl: '', 
    level: 'Beginner', 
    isPro: false
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
      fetchCourseData();
    }
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/courses/instructor/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu khóa học:", error);
      alert('Không thể tải dữ liệu khóa học');
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
       if (name === 'isPro' && !checked) {
          setCourse({ ...course, isPro: false, price: 0 }); 
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
      if (isEditMode) {
        await axios.patch(`http://localhost:5000/api/courses/${courseId}`, course, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Đã cập nhật thông tin khóa học thành công!');
      } else {
        await axios.post('http://localhost:5000/api/courses', course, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Đã tạo khóa học thành công!');
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      alert('Có lỗi xảy ra khi lưu: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="editor-loading">Đang tải...</div>;

  return (
    <div className="inst-content-fade-in">
        <div className="inst-section-header">
           <button className="inst-btn view" onClick={onClose} title="Quay lại">
             <ArrowLeft size={18} />
           </button>
           <h2 className="inst-content-title" style={{ margin: 0 }}>
             {isEditMode ? 'Chỉnh sửa Khóa học' : 'Tạo Khóa học mới'}
           </h2>
           <button className="inst-add-btn primary" type="submit" form="course-form">
             <Save size={18} /> Lưu thông tin
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
                    style={!course.isPro ? { backgroundColor: '#f1f5f9', opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  {!course.isPro && <small style={{color: '#64748b'}}>Khóa học miễn phí không yêu cầu nhập giá.</small>}
               </div>
             </div>

             <div className="form-row">
               <div className="form-group half">
                  <label>Danh mục</label>
                  <input 
                    type="text" 
                    name="category" 
                    list="category-suggestions" 
                    // value={course.category} 
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
                <div className="form-group half">
                  <label>Cấp độ</label>
                  <select name="level" value={course.level} onChange={handleChange}>
                    <option value="Beginner">Beginner (Cơ bản)</option>
                    <option value="Intermediate">Intermediate (Trung bình)</option>
                    <option value="Advanced">Advanced (Nâng cao)</option>
                    <option value="All Levels">All Levels (Mọi cấp độ)</option>
                  </select>
               </div>
             </div>

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
                    <label htmlFor="thumbnail-upload" className="upload-label-area" style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}>
                      {uploadingThumb ? (
                        <div className="uploading-state" style={{ padding: '40px', textAlign: 'center' }}>
                          <span>Đang tải ảnh lên...</span>
                        </div>
                      ) : course.thumbnail ? (
                        <div className="image-preview-wrapper" style={{ height: '160px', position: 'relative' }}>
                          <img src={course.thumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                        </div>
                      ) : (
                        <div className="upload-placeholder" style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                          <Plus size={24} />
                          <span style={{ fontSize: '0.85rem' }}>Nhấn để chọn ảnh</span>
                        </div>
                      )}
                    </label>
                  </div>
               </div>

               <div className="form-group upload-group half">
                  <label>Video giới thiệu</label>
                  <div className="upload-box">
                    <input 
                      type="file" 
                      id="video-upload" 
                      accept="video/*" 
                      onChange={handleVideoUpload} 
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="video-upload" className="upload-label-area" style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'block', transition: 'all 0.2s' }}>
                      {uploadingVideo ? (
                        <div className="uploading-state" style={{ padding: '40px', textAlign: 'center' }}>
                          <span>Đang tải video lên...</span>
                        </div>
                      ) : course.previewVideoUrl ? (
                        <div className="video-preview-wrapper" style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', color: '#10b981', borderRadius: '10px' }}>
                           <Video size={48} />
                           <span style={{ marginTop: '8px', fontWeight: 'bold' }}>Video đã sẵn sàng</span>
                        </div>
                      ) : (
                        <div className="upload-placeholder" style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                          <Video size={24} />
                          <span style={{ fontSize: '0.85rem' }}>Nhấn để chọn video</span>
                        </div>
                      )}
                    </label>
                  </div>
               </div>
             </div>
          </form>
          
          {isEditMode && (
             <div className="curriculum-editor-section" style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Cấu trúc Khóa học</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Tính năng quản lý chương và bài giảng (Content Management) có thể truy cập qua nút "Bài giảng" ở danh sách chính để có trải nghiệm tốt nhất.</p>
             </div>
          )}
        </div>
    </div>
  );
};

export default CourseEditor;
