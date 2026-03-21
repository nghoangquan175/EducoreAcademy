import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArticleByIdAPI } from '../services/articleService';
import { Loader2, AlertCircle, Calendar, User, ChevronLeft } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await fetchArticleByIdAPI(id);
        setArticle(res.data);
        window.scrollTo(0, 0);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải bài viết');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  // Hide Top Header and Footer in Preview Mode
  useEffect(() => {
    if (article) {
      const isPreviewMode = article.articleStatus !== 2;
      if (isPreviewMode) {
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';

        // Cleanup function when component unmounts or leaves preview mode
        return () => {
          if (header) header.style.display = '';
          if (footer) footer.style.display = '';
        };
      }
    }
  }, [article]);

  if (loading) {
    return (
      <div className="article-detail-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="#4f46e5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-detail-container" style={{ textAlign: 'center' }}>
        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
        <h1>Lỗi tải bài viết</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!article) return null;

  const isPreview = article.articleStatus !== 2;

  return (
    <div className="article-detail-container">
      {isPreview && (
        <div className="preview-alert-simple">
          <AlertCircle size={18} />
          <span>CHẾ ĐỘ XEM TRƯỚC</span>
        </div>
      )}

      {!isPreview && (
        <button className="btn-back-article" onClick={() => navigate('/')}>
          <ChevronLeft size={20} /> Quay lại trang chủ
        </button>
      )}

      {/* 1. Title */}
      <h1 className="article-simple-title">{article.title}</h1>

      {/* 2. Meta Info */}
      <div className="article-meta-header">
        <div className="article-meta-item">
          <User size={18} />
          <span>Tác giả: <strong>{article.author?.name || 'Ẩn danh'}</strong></span>
        </div>
        <div className="article-meta-item">
          <Calendar size={18} />
          <span>Đăng ngày: <strong>{new Date(article.createdAt).toLocaleString('vi-VN')}</strong></span>
        </div>
      </div>

      {/* 3. Ảnh thumbnail */}
      {article.thumbnail && (
        <img src={article.thumbnail} alt={article.title} className="article-simple-thumbnail" />
      )}

      {/* 4. Bài viết */}
      <div 
        className="article-simple-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
 
      {/* 5. Comment Section */}
      {!isPreview && (
        <CommentSection articleId={article.id} />
      )}
    </div>
  );
};

export default ArticleDetail;
