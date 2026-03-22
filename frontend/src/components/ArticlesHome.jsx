import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { fetchArticlesAPI } from '../services/articleService';
import { fetchAllCategoriesAPI } from '../services/categoryService';
import './ArticlesHome.css';

const ArticleCard = ({ article, onClick }) => (
  <div 
    className="art-card" 
    onClick={() => onClick(article.id)} 
    role="button" 
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick(article.id)}
  >
    <div className="art-thumb">
      <img 
        src={article.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
        alt={article.title} 
        loading="lazy" 
      />
      <span className="art-category">{article.category}</span>
    </div>
    <div className="art-content">
      <h3 className="art-title">{article.title}</h3>
      <p className="art-excerpt">{article.excerpt}</p>
      
      <div className="art-meta">
        <span className="art-meta-item">
          <User size={14} />
          {article.author?.name || 'Ẩn danh'}
        </span>
        <span className="art-meta-item">
          <Calendar size={14} />
          {new Date(article.createdAt).toLocaleDateString('vi-VN')}
        </span>
      </div>

      <div className="art-card-footer">
        <button className="art-read-more">
          Đọc tiếp <ArrowRight size={16} />
        </button>
        <div className="art-likes">
          <Heart size={14} fill="#ef4444" stroke="#ef4444" />
          <span>{article.likesCount || 0}</span>
        </div>
      </div>
    </div>
  </div>
);

const ArticlesHome = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState(['Tất cả']);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const limit = 8;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchAllCategoriesAPI();
        const names = data.map(c => c.name);
        setCategories(['Tất cả', ...names]);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      try {
        const { data } = await fetchArticlesAPI(2, currentPage, limit, selectedCategory);
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Failed to load articles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, [currentPage, selectedCategory]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <section className="art-section">
      <div className="art-container">
        <div className="art-header">
          <div className="art-header-left">
            <div className="art-badge">
              <BookOpen size={14} />
              <span>BÀI VIẾT</span>
            </div>
            <h2 className="art-section-title">Bài viết nổi bật</h2>
            <p className="art-section-subtitle">
              Cập nhật kiến thức mới nhất, kinh nghiệm quý báu từ cộng đồng lập trình viên.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="art-tabs-wrapper">
          <div className="art-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`art-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="art-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="art-card article-skeleton" style={{ height: '400px', background: '#f5f5f5', borderRadius: '20px' }}></div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="art-empty">Hiện chưa có bài viết nào được xuất bản.</div>
        ) : (
          <>
            <div className="art-grid">
              {articles.map(article => (
                <ArticleCard 
                  key={article.id} 
                  article={article} 
                  onClick={(id) => navigate(`/articles/${id}`)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="art-pagination">
                <button 
                  className="art-page-btn art-page-nav"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    className={`art-page-btn ${currentPage === i + 1 ? 'art-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                <button 
                  className="art-page-btn art-page-nav"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ArticlesHome;
