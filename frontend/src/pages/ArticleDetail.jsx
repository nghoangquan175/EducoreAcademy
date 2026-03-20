import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchArticleByIdAPI } from '../services/articleService';
import { Loader2, AlertCircle, Calendar, User } from 'lucide-react';
import './ArticleDetail.css';

const ArticleDetail = () => {
  const { id } = useParams();
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

      {/* 1. Title in to đậm */}
      <h1 className="article-simple-title">{article.title}</h1>

      {/* 2. Ảnh thumbnail */}
      {article.thumbnail && (
        <img src={article.thumbnail} alt={article.title} className="article-simple-thumbnail" />
      )}

      {/* 3. Bài viết */}
      <div 
        className="article-simple-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* 4. Ngày giờ đăng và thông tin tác giả */}
      <footer className="article-simple-footer">
        <div className="article-footer-item">
          <Calendar size={18} />
          <span>Đăng ngày: <strong>{new Date(article.createdAt).toLocaleString('vi-VN')}</strong></span>
        </div>
        <div className="article-footer-item">
          <User size={18} />
          <span>Tác giả: <strong>{article.author?.name || 'Ẩn danh'}</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default ArticleDetail;
