import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText,
  Plus, 
  Edit, 
  Trash2, 
  Video, 
  List, 
  Send,
  LogOut,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Users,
  Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CourseEditor from './CourseEditor';
import CurriculumEditor from './CurriculumEditor';
import ArticleEditor from './ArticleEditor';
import { fetchMyArticlesAPI, deleteArticleAPI, submitArticleForReviewAPI } from '../services/articleService';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [courseView, setCourseView] = useState('list'); // 'list', 'editor', or 'curriculum'
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Articles State
  const [articles, setArticles] = useState([]);
  const [articleView, setArticleView] = useState('list'); // 'list' or 'editor'
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingArticleData, setEditingArticleData] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalStudents: 0,
    averageRating: 4.8
  });
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Khóa học', icon: <BookOpen size={20} /> },
    { id: 'articles', label: 'Bài viết', icon: <FileText size={20} /> },
  ];

  useEffect(() => {
    fetchMyCourses();
    fetchMyArticles();
  }, [articlePage, articleSearch]);

  const fetchMyArticles = async () => {
    try {
      const { data } = await fetchMyArticlesAPI(articlePage, 10, articleSearch);
      setArticles(data.articles);
      setArticleTotalPages(data.totalPages);
    } catch (error) {
      console.error('Lỗi khi tải bài viết:', error);
    }
  };

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/courses/instructor/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(data);
      
      // Calculate basic stats for overview
      const totalStuds = data.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0);
      setStats(prev => ({ ...prev, totalStudents: totalStuds }));
      
    } catch (error) {
      console.error('Lỗi khi tải khóa học:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Thao tác này không thể hoàn tác.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã xóa khóa học thành công!');
      fetchMyCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa khóa học');
    }
  };

  const handleSubmitForReview = async (courseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn gửi yêu cầu phê duyệt cho khóa học này?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/courses/${courseId}/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Đã gửi yêu cầu phê duyệt thành công!');
      fetchMyCourses();
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu phê duyệt');
    }
  };

  const handleArticleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await deleteArticleAPI(id);
      alert('Đã xóa bài viết thành công');
      fetchMyArticles();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xóa bài viết');
    }
  };

  const handleArticleSubmit = async (id) => {
    if (!window.confirm('Gửi bài viết này để quản trị viên phê duyệt?')) return;
    try {
      await submitArticleForReviewAPI(id);
      alert('Đã gửi bài viết thành công');
      fetchMyArticles();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi gửi bài viết');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff/login');
  };

  const renderContent = () => {
    if (loading) return <div className="loading-container">Đang tải dữ liệu...</div>;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="inst-content-fade-in">
            <h2 className="inst-content-title">Chào mừng trở lại, {user?.name}!</h2>
            <div className="inst-stats-grid">
              <div className="inst-stat-card">
                <div className="inst-stat-icon-wrapper earnings">
                    <CreditCard size={24} />
                </div>
                <div className="inst-stat-info">
                    <h3>Doanh thu</h3>
                    <p className="inst-stat-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalEarnings)}</p>
                    <span className="inst-stat-label">Tổng thu nhập của bạn</span>
                </div>
              </div>
              <div className="inst-stat-card">
                <div className="inst-stat-icon-wrapper courses">
                    <BookOpen size={24} />
                </div>
                <div className="inst-stat-info">
                    <h3>Khóa học</h3>
                    <p className="inst-stat-value">{courses.length}</p>
                    <span className="inst-stat-label">Tổng số bài học đã biên soạn</span>
                </div>
              </div>
              <div className="inst-stat-card">
                <div className="inst-stat-icon-wrapper students">
                    <Users size={24} />
                </div>
                <div className="inst-stat-info">
                    <h3>Học viên</h3>
                    <p className="inst-stat-value">{stats.totalStudents}</p>
                    <span className="inst-stat-label">Đang theo học các khóa của bạn</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'courses':
        if (courseView === 'editor') {
            return (
                <CourseEditor 
                    courseId={editingCourseId} 
                    onClose={() => setCourseView('list')} 
                    onSuccess={() => {
                        setCourseView('list');
                        fetchMyCourses();
                    }}
                />
            );
        }
        if (courseView === 'curriculum') {
            return (
                <CurriculumEditor 
                    courseId={selectedCourseId}
                    onClose={() => setCourseView('list')}
                />
            );
        }
        return (
          <div className="inst-content-fade-in">
            <div className="inst-section-header">
                <h2 className="inst-content-title">Quản lý Khóa học</h2>
                <button 
                    className="inst-add-btn primary"
                    onClick={() => {
                        setCourseView('editor');
                        setEditingCourseId(null);
                    }}
                >
                    <Plus size={18} /> Tạo khóa học mới
                </button>
            </div>
            <p className="inst-section-desc">Danh sách tất cả các khóa học do bạn biên soạn và quản lý.</p>
            
            <div className="inst-table-container">
                <table className="inst-table">
                    <thead>
                        <tr>
                            <th>Khóa học</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Học viên</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length > 0 ? courses.map(course => (
                            <tr key={course.id}>
                                <td>
                                    <div className="inst-course-cell">
                                        <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="inst-table-thumb" />
                                        <span>{course.title}</span>
                                    </div>
                                </td>
                                <td>{course.category}</td>
                                <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</td>
                                <td>{course.studentsCount}</td>
                                <td>
                                    <span className={`inst-status-badge ${Number(course.published) === 2 ? 'published' : Number(course.published) === 1 ? 'pending' : Number(course.published) === 3 ? 'rejected' : 'draft'}`}>
                                        {Number(course.published) === 2 && 'Đã xuất bản'}
                                        {Number(course.published) === 0 && 'Bản nháp'}
                                        {Number(course.published) === 1 && 'Đang chờ duyệt'}
                                        {Number(course.published) === 3 && 'Bị từ chối'}
                                    </span>
                                </td>
                                <td>
                                    <div className="inst-actions">
                                        {(course.published === 0 || course.published === 3) && (
                                            <button className="inst-btn approve" onClick={() => handleSubmitForReview(course.id)} title="Gửi phê duyệt">
                                                <Send size={16} />
                                            </button>
                                        )}
                                        <button 
                                            className="inst-btn view" 
                                            onClick={() => {
                                                setCourseView('editor');
                                                setEditingCourseId(course.id);
                                            }} 
                                            title="Sửa"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            className="inst-btn view" 
                                            onClick={() => {
                                                setCourseView('curriculum');
                                                setSelectedCourseId(course.id);
                                            }} 
                                            title="Bài giảng"
                                        >
                                            <BookOpen size={16} />
                                        </button>
                                        {![1, 2].includes(course.published) && (
                                            <button 
                                                className="inst-btn reject" 
                                                title="Xóa"
                                                onClick={() => handleDeleteCourse(course.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="empty-table-cell">Bạn chưa có khóa học nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'articles':
        if (articleView === 'editor') {
          return (
            <ArticleEditor 
              articleId={editingArticleId}
              articleData={editingArticleData}
              onClose={() => setArticleView('list')}
              onSuccess={() => {
                setArticleView('list');
                fetchMyArticles();
              }}
            />
          );
        }
        return (
          <div className="inst-content-fade-in">
            <div className="inst-section-header">
                <h2 className="inst-content-title">Quản lý Bài viết</h2>
                <button 
                  className="inst-add-btn primary"
                  onClick={() => {
                    setArticleView('editor');
                    setEditingArticleId(null);
                    setEditingArticleData(null);
                  }}
                >
                  <Plus size={18} /> Viết bài mới
                </button>
            </div>

            <div className="inst-filters-bar" style={{ marginBottom: '20px' }}>
              <div className="inst-search-wrapper" style={{ position: 'relative', maxWidth: '400px' }}>
                <input 
                  type="text" 
                  className="inst-search-input" 
                  placeholder="Tìm kiếm bài viết..." 
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>

            <div className="inst-table-container">
                <table className="inst-table">
                  <thead>
                    <tr>
                      <th>Bài viết</th>
                      <th>Danh mục</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.length > 0 ? articles.map(article => (
                      <tr key={article.id}>
                        <td>{article.title}</td>
                        <td>{article.category}</td>
                        <td>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`inst-status-badge ${article.articleStatus === 2 ? 'published' : article.articleStatus === 1 ? 'pending' : article.articleStatus === 3 ? 'rejected' : 'draft'}`}>
                            {article.articleStatus === 2 && 'Đã duyệt'}
                            {article.articleStatus === 0 && 'Bản nháp'}
                            {article.articleStatus === 1 && 'Chờ duyệt'}
                            {article.articleStatus === 3 && 'Từ chối'}
                          </span>
                        </td>
                        <td>
                          <div className="inst-actions">
                            <button 
                              className="inst-btn view" 
                              onClick={() => window.open(`/articles/${article.id}`, '_blank')}
                              title="Xem chi tiết"
                            >
                              <Eye size={16} />
                            </button>
                            {(article.articleStatus === 0 || article.articleStatus === 3) && (
                              <button className="inst-btn approve" onClick={() => handleArticleSubmit(article.id)} title="Gửi duyệt">
                                <Send size={16} />
                              </button>
                            )}
                            <button 
                              className="inst-btn view" 
                              onClick={() => {
                                setArticleView('editor');
                                setEditingArticleId(article.id);
                                setEditingArticleData({
                                  title: article.title,
                                  content: article.content,
                                  thumbnail: article.thumbnail,
                                  excerpt: article.excerpt,
                                  category: article.category
                                });
                              }}
                              title="Sửa"
                            >
                              <Edit size={16} />
                            </button>
                            {article.articleStatus !== 2 && (
                              <button className="inst-btn reject" onClick={() => handleArticleDelete(article.id)} title="Xóa">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="empty-table-cell">Không tìm thấy bài viết nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>

            {articleTotalPages > 1 && (
              <div className="inst-pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {Array.from({ length: articleTotalPages }).map((_, i) => (
                  <button 
                    key={i + 1}
                    className={`inst-page-btn ${articlePage === i + 1 ? 'active' : ''}`}
                    onClick={() => setArticlePage(i + 1)}
                    style={{ 
                      padding: '5px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      background: articlePage === i + 1 ? '#6366f1' : 'white',
                      color: articlePage === i + 1 ? 'white' : 'inherit'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="inst-dashboard-layout">
      <button className="inst-mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`inst-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="inst-sidebar-header">
          <div className="inst-logo">
            <span className="inst-logo-text">EduCore</span>
            <span className="inst-logo-badge">Giảng viên</span>
          </div>
        </div>

        <nav className="inst-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`inst-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
            >
              <span className="inst-item-icon">{item.icon}</span>
              <span className="inst-item-label">{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="inst-active-arrow" />}
            </button>
          ))}
        </nav>

        <div className="inst-sidebar-footer">
          <div className="inst-admin-profile">
            <div className="inst-admin-avatar">
              {user?.name?.charAt(0) || 'I'}
            </div>
            <div className="inst-admin-info">
              <span className="inst-admin-name">{user?.name || 'Instructor'}</span>
              <span className="inst-admin-role">Giảng viên chuyên môn</span>
            </div>
          </div>
          <button className="inst-logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="inst-main">
        <header className="inst-topbar">
          <div className="topbar-left">
             <h3 className="inst-system-title">Instructor Center</h3>
          </div>
          <div className="topbar-right">
             <div className="inst-date-display">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>
        
        <div className="inst-content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;
