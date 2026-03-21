import React, { useState, useEffect } from 'react';
import { Save, Plus, ArrowLeft, Image as ImageIcon, Type, Layout, FileText } from 'lucide-react';
import axios from 'axios';
import { 
  createArticleAPI, 
  updateArticleAPI, 
  uploadArticleImageAPI,
  createArticleStudentAPI,
  updateArticleStudentAPI 
} from '../services/articleService';
import { fetchAllCategoriesAPI } from '../services/categoryService';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import './CourseEditor.css';

const ArticleEditor = ({ articleId, articleData, onClose, onSuccess, userRole }) => {
  const isEditMode = Boolean(articleId);

  const [article, setArticle] = useState({
    title: '',
    content: '',
    thumbnail: '',
    excerpt: '',
    category: 'Lập trình',
    articleStatus: articleData?.articleStatus || 0
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'info' 
  });

  useEffect(() => {
    fetchCategories();
    if (isEditMode && articleData) {
      setArticle(articleData);
    }
  }, [articleId, articleData]);

  const fetchCategories = async () => {
    try {
      const data = await fetchAllCategoriesAPI();
      setCategories(data);
      if (!isEditMode && !articleData?.category && data.length > 0 && article.category === 'Lập trình') {
        setArticle(prev => ({ ...prev, category: data[0].name }));
      }
    } catch (error) {
       console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setArticle({ ...article, [name]: value });
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingThumb(true);
    try {
      const res = await uploadArticleImageAPI(formData);
      setArticle({ ...article, thumbnail: res.url });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Tải ảnh bìa thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    try {
      if (isEditMode) {
        if (userRole === 'student') {
          await updateArticleStudentAPI(articleId, article);
        } else {
          await updateArticleAPI(articleId, article);
        }
        toast.success('Đã cập nhật bài viết thành công!');
      } else {
        if (userRole === 'student') {
          await createArticleStudentAPI(article);
        } else {
          await createArticleAPI(article);
        }
        toast.success('Đã tạo bài viết mới thành công!');
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu bài viết: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: isEditMode ? 'Xác nhận cập nhật bài viết' : 'Xác nhận lưu bài viết mới',
      message: isEditMode 
        ? 'Bạn có chắc chắn muốn lưu các thay đổi cho bài viết này?' 
        : 'Bạn có chắc chắn muốn lưu bài viết này?',
      type: 'info',
      onConfirm: handleConfirmSubmit
    });
  };

  return (
    <div className="inst-content-fade-in">
      <div className="inst-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button className="inst-btn view" onClick={onClose} title="Quay lại">
            <ArrowLeft size={18} />
          </button>
          <h2 className="inst-content-title" style={{ margin: 0 }}>
            {isEditMode ? 'Chỉnh sửa Bài viết' : 'Viết bài mới'}
          </h2>
        </div>
        <button className="inst-add-btn primary" type="submit" form="article-form" disabled={loading}>
          <Save size={18} /> {loading ? 'Đang lưu...' : 'Lưu bài viết'}
        </button>
      </div>

      <div className="editor-main-content">
        <form id="article-form" className="basic-info-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label><Type size={16} /> Tiêu đề bài viết</label>
            <input 
              type="text" 
              name="title" 
              value={article.title} 
              onChange={handleChange} 
              placeholder="VD: Hướng dẫn học React cho người mới bắt đầu..." 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label><Layout size={16} /> Danh mục</label>
              <select name="category" value={article.category} onChange={handleChange}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group half">
              <label><FileText size={16} /> Tóm tắt ngắn</label>
              <input 
                type="text" 
                name="excerpt" 
                value={article.excerpt} 
                onChange={handleChange} 
                placeholder="Mô tả ngắn gọn về nội dung bài viết..." 
              />
            </div>
          </div>

          <div className="form-group">
            <label><ImageIcon size={16} /> Ảnh bài viết (Thumbnail)</label>
            <div className="upload-box" style={{ maxWidth: '400px' }}>
              <input 
                type="file" 
                id="art-thumb-upload" 
                accept="image/*" 
                onChange={handleThumbnailUpload} 
                style={{ display: 'none' }}
              />
              <label htmlFor="art-thumb-upload" className="upload-label-area" style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'block', transition: 'all 0.2s', overflow: 'hidden' }}>
                {uploadingThumb ? (
                  <div className="uploading-state" style={{ padding: '30px', textAlign: 'center' }}>
                    <span>Đang tải ảnh lên...</span>
                  </div>
                ) : article.thumbnail ? (
                  <div className="image-preview-wrapper" style={{ height: '180px', position: 'relative' }}>
                    <img src={article.thumbnail} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="upload-placeholder" style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}>
                    <Plus size={24} />
                    <span style={{ fontSize: '0.85rem' }}>Chọn ảnh bìa bài viết</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label><FileText size={16} /> Nội dung bài viết</label>
            <textarea 
              name="content" 
              value={article.content} 
              onChange={handleChange} 
              rows="12" 
              placeholder="Viết nội dung bài viết ở đây..." 
              required 
              style={{ lineHeight: '1.6', fontSize: '1rem', padding: '15px' }}
            />
          </div>

          {userRole === 'admin' && (
            <div className="form-group">
              <label>Trạng thái bài viết</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  <input 
                    type="radio" 
                    name="articleStatus" 
                    value="0" 
                    checked={Number(article.articleStatus) === 0} 
                    onChange={(e) => setArticle({...article, articleStatus: 0})} 
                  />
                  Lưu bản nháp
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}>
                  <input 
                    type="radio" 
                    name="articleStatus" 
                    value="2" 
                    checked={Number(article.articleStatus) === 2} 
                    onChange={(e) => setArticle({...article, articleStatus: 2})} 
                  />
                  Xuất bản ngay
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({...confirmDialog, isOpen: false})}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default ArticleEditor;
