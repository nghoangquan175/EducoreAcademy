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
  Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CourseEditor from './CourseEditor';
import CurriculumEditor from './CurriculumEditor';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [courseView, setCourseView] = useState('list'); // 'list', 'editor', or 'curriculum'
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  }, []);

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
        return (
          <div className="inst-content-fade-in">
            <h2 className="inst-content-title">Quản lý Bài viết</h2>
            <div className="inst-placeholder-content">
                <FileText size={48} />
                <p>Tính năng quản lý bài viết Blog dành cho Giảng viên đang được phát triển.</p>
                <button className="inst-add-btn primary mt-4">Viết bài mới</button>
            </div>
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
