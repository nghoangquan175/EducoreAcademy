import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Users, 
  Layers, 
  ImageIcon, 
  FileText,
  LogOut,
  ChevronRight,
  Menu,
  X,
  CheckCircle, 
  XCircle, 
  ArrowDownCircle,
  Eye, 
  Check,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Plus,
  Bell,
  Search,
  User,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ArticleEditor from './ArticleEditor';
import {
  fetchMyArticlesAPI, 
  deleteArticleAPI, 
  adminFetchPendingArticlesAPI, 
  adminUpdateArticleStatusAPI,
  fetchTrashArticlesAPI
} from '../services/articleService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [isArticlesMenuOpen, setIsArticlesMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [banners, setBanners] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    buttonText: 'Khám phá ngay',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    imageUrl: '',
    tag: 'Mới',
    sortOrder: 0,
    isActive: true
  });
  
  // Articles State
  const [articles, setArticles] = useState([]);
  const [pendingArticles, setPendingArticles] = useState([]);
  const [articleSubTab, setArticleSubTab] = useState('my-articles'); // 'my-articles' or 'review'
  const [articleView, setArticleView] = useState('list'); // 'list' or 'editor'
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [editingArticleData, setEditingArticleData] = useState(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [debouncedArticleSearch, setDebouncedArticleSearch] = useState('');
  const [articlePage, setArticlePage] = useState(1);
  const [articleTotalPages, setArticleTotalPages] = useState(1);
  const [courseSearch, setCourseSearch] = useState('');
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState('');
  const [trashArticles, setTrashArticles] = useState([]);
  const [trashCourses, setTrashCourses] = useState([]);
  const [courseTrashView, setCourseTrashView] = useState(false);
  const [articleTrashView, setArticleTrashView] = useState(false);
  const prevTab = useRef(activeTab);
  const prevSubTab = useRef(articleSubTab);

  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'warning' 
  });

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'approvals', label: 'Phê duyệt', icon: <CheckSquare size={20} /> },
    { id: 'courses', label: 'Khóa học', icon: <BookOpen size={20} /> },
    { 
      id: 'users', 
      label: 'Người dùng', 
      icon: <Users size={20} />,
      hasSubmenu: true,
      subItems: [
        { id: 'students', label: 'Học viên', icon: <GraduationCap size={18} /> },
        { id: 'instructors', label: 'Giảng viên', icon: <UserCheck size={18} /> },
      ]
    },
    { id: 'categories', label: 'Danh mục', icon: <Layers size={20} /> },
    { id: 'banners', label: 'Banners', icon: <ImageIcon size={20} /> },
    { 
      id: 'articles', 
      label: 'Bài viết', 
      icon: <FileText size={20} />,
      hasSubmenu: true,
      subItems: [
        { id: 'all-articles', label: 'Tất cả bài viết', icon: <Layers size={18} /> },
        { id: 'my-articles', label: 'Bài viết của tôi', icon: <User size={18} /> },
        { id: 'review-articles', label: 'Duyệt bài viết', icon: <CheckCircle size={18} /> },
      ]
    },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={20} /> },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArticleSearch(articleSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [articleSearch]);

  useEffect(() => {
    const isSilent = (activeTab === prevTab.current && articleSubTab === prevSubTab.current);
    fetchData(isSilent);
    prevTab.current = activeTab;
    prevSubTab.current = articleSubTab;
  }, [activeTab, articleSubTab, articlePage, debouncedArticleSearch, debouncedCourseSearch]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'overview') {
        const { data } = await axios.get('http://localhost:5000/api/admin/stats', { headers });
        setStats(data);
      } else if (activeTab === 'approvals') {
        const { data } = await axios.get(`http://localhost:5000/api/admin/courses/pending?search=${debouncedCourseSearch}`, { headers });
        setPendingCourses(data);
      } else if (activeTab === 'courses') {
        const { data } = await axios.get(`http://localhost:5000/api/admin/courses?search=${debouncedCourseSearch}`, { headers });
        // Lọc khóa học đã xuất bản (published: 2)
        setPendingCourses(data.filter(c => c.published === 2));
      } else if (activeTab === 'students' || activeTab === 'instructors') {
        const { data } = await axios.get('http://localhost:5000/api/admin/users', { headers });
        setUsersList(data);
      } else if (activeTab === 'banners') {
        const { data } = await axios.get('http://localhost:5000/api/banners/all', { headers });
        setBanners(data);
      } else if (activeTab === 'all-articles') {
        const { data } = await axios.get(`http://localhost:5000/api/admin/articles/all?search=${debouncedArticleSearch}`, { headers });
        setArticles(data.data || []); 
      } else if (activeTab === 'my-articles') {
        const response = await fetchMyArticlesAPI(articlePage, 10, debouncedArticleSearch);
        setArticles(response.data?.articles || []); 
        setArticleTotalPages(response.data?.totalPages || 1);
      } else if (activeTab === 'review-articles') {
        const response = await adminFetchPendingArticlesAPI(debouncedArticleSearch);
        setPendingArticles(response.data || []);
      }
      
      // Always fetch notifications to update unread count
      const { data: notifs } = await axios.get('http://localhost:5000/api/notifications', { headers });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (courseId, status) => {
    const isApprove = status === 2;
    setConfirmDialog({
      isOpen: true,
      title: isApprove ? 'Phê duyệt khóa học' : 'Từ chối khóa học',
      message: isApprove 
        ? 'Bạn có chắc chắn muốn phê duyệt khóa học này? Khóa học sẽ được hiển thị cho tất cả học viên.' 
        : 'Bạn có chắc chắn muốn từ chối khóa học này?',
      type: isApprove ? 'info' : 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/admin/courses/${courseId}/status`, 
            { status }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success(isApprove ? 'Đã phê duyệt thành công!' : 'Đã từ chối khóa học.');
          fetchData();
        } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          toast.error('Có lỗi xảy ra khi thực hiện thao tác.');
        }
      }
    });
  };

  const handleBannerToggle = async (bannerId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/banners/${bannerId}`, 
        { isActive: !currentStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Lỗi khi cập nhật banner:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái banner.');
    }
  };

  const handleBannerDelete = (bannerId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Banner',
      message: 'Bạn có chắc chắn muốn xóa banner này? Thao tác này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/banners/${bannerId}`, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success('Đã xóa banner thành công!');
          fetchData();
        } catch (error) {
          console.error('Lỗi khi xóa banner:', error);
          toast.error('Có lỗi xảy ra khi xóa banner.');
        }
      }
    });
  };

  const handleBannerThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingBanner(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setNewBanner({ ...newBanner, imageUrl: res.data.url });
    } catch (error) {
      console.error("Upload error:", error);
      alert('Tải ảnh banner thất bại!');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/banners', newBanner, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Thêm banner thành công!');
      setShowBannerModal(false);
      setNewBanner({
        title: '', description: '', buttonText: 'Khám phá ngay',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        imageUrl: '', tag: 'Mới', sortOrder: 0, isActive: true
      });
      fetchData();
    } catch (error) {
      alert('Thêm banner thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${notifId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
  };

  const handleArticleStatusUpdate = (id, status) => {
    const isApprove = status === 2;
    setConfirmDialog({
      isOpen: true,
      title: isApprove ? 'Phê duyệt bài viết' : 'Từ chối bài viết',
      message: isApprove ? 'Phê duyệt bài viết này?' : 'Từ chối bài viết này?',
      type: isApprove ? 'info' : 'danger',
      onConfirm: async () => {
        try {
          await adminUpdateArticleStatusAPI(id, status);
          toast.success(isApprove ? 'Đã phê duyệt bài viết!' : 'Đã từ chối bài viết.');
          fetchData();
        } catch (error) {
          toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const handleArticleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa bài viết',
      message: 'Bạn có chắc chắn muốn xóa bài viết này?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await deleteArticleAPI(id);
          toast.success('Đã xóa bài viết thành công');
          fetchData();
        } catch (error) {
          toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  // Trash bin methods
  const fetchTrashCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/courses/trash/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrashCourses(data);
    } catch (error) {
      console.error('Lỗi khi tải thùng rác khóa học:', error);
    }
  };

  const fetchTrashArticles = async () => {
    try {
      const { data } = await fetchTrashArticlesAPI();
      setTrashArticles(data);
    } catch (error) {
      console.error('Lỗi khi tải thùng rác bài viết:', error);
    }
  };

  const handleRestoreCourse = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục khóa học',
      message: 'Bạn có chắc chắn muốn khôi phục khóa học này?',
      type: 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/courses/${id}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã khôi phục khóa học');
          fetchTrashCourses();
          fetchData();
        } catch (error) {
          toast.error('Lỗi khi khôi phục khóa học');
        }
      }
    });
  };

  const handleForceDeleteCourse = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa vĩnh viễn',
      message: 'Xóa vĩnh viễn khóa học này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/courses/${id}/force`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã xóa vĩnh viễn khóa học');
          fetchTrashCourses();
        } catch (error) {
          toast.error('Lỗi khi xóa vĩnh viễn');
        }
      }
    });
  };

  const handleRestoreArticle = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục bài viết',
      message: 'Bạn có chắc chắn muốn khôi phục bài viết này?',
      type: 'info',
      onConfirm: async () => {
        try {
          const { restoreArticleAPI } = await import('../services/articleService');
          await restoreArticleAPI(id);
          toast.success('Đã khôi phục bài viết');
          fetchTrashArticles();
          fetchData();
        } catch (error) {
          toast.error('Lỗi khi khôi phục bài viết');
        }
      }
    });
  };

  const handleForceDeleteArticle = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa vĩnh viễn',
      message: 'Xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { forceDeleteArticleAPI } = await import('../services/articleService');
          await forceDeleteArticleAPI(id);
          toast.success('Đã xóa vĩnh viễn bài viết');
          fetchTrashArticles();
        } catch (error) {
          toast.error('Lỗi khi xóa vĩnh viễn');
        }
      }
    });
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
          <div className="admin-content-fade-in">
            <h2 className="content-title">Tổng quan hệ thống</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Học viên</h3>
                <p className="stat-value">{stats?.students || 0}</p>
                <span className="stat-label">Tổng số học viên</span>
              </div>
              <div className="stat-card">
                <h3>Giảng viên</h3>
                <p className="stat-value">{stats?.instructors || 0}</p>
                <span className="stat-label">Tổng số giảng viên</span>
              </div>
              <div className="stat-card">
                <h3>Khóa học</h3>
                <p className="stat-value">{stats?.courses || 0}</p>
                <span className="stat-label">{stats?.pendingCourses || 0} đang chờ duyệt</span>
              </div>
              <div className="stat-card">
                <h3>Đăng ký học</h3>
                <p className="stat-value">{stats?.enrollments || 0}</p>
                <span className="stat-label">Tổng lượt tham gia</span>
              </div>
              <div className="stat-card">
                <h3>Bài viết</h3>
                <p className="stat-value">{stats?.publishedArticles || 0}</p>
                <span className="stat-label">{stats?.pendingArticles || 0} đang chờ duyệt</span>
              </div>
            </div>
          </div>
        );
      case 'approvals':
        return (
          <div className="admin-content-fade-in">
            <h2 className="content-title">Phê duyệt khóa học</h2>
            <p className="section-desc">Danh sách các khóa học đang chờ bạn kiểm duyệt nội dung.</p>
            
            <div className="admin-search-wrapper" style={{ marginBottom: '20px', maxWidth: '400px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input 
                    type="text" 
                    placeholder="Tìm theo tên khóa học..." 
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
                />
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Khóa học</th>
                            <th>Giảng viên</th>
                            <th>Ngày gửi</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingCourses.length > 0 ? pendingCourses.map(course => (
                            <tr key={course.id}>
                                <td>
                                    <div className="course-cell">
                                        <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="admin-table-thumb" />
                                        <span>{course.title}</span>
                                    </div>
                                </td>
                                <td>{course.instructor?.name}</td>
                                <td>{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn approve" onClick={() => handleStatusUpdate(course.id, 2)} title="Phê duyệt">
                                            <Check size={18} />
                                        </button>
                                        <button className="admin-btn reject" onClick={() => handleStatusUpdate(course.id, 3)} title="Từ chối">
                                            <XCircle size={18} />
                                        </button>
                                        <button className="admin-btn view" onClick={() => window.open(`/course/${course.id}`, '_blank')} title="Xem trước">
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="empty-table-cell">Không có yêu cầu phê duyệt nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'courses':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">{courseTrashView ? 'Thùng rác Khóa học' : 'Quản lý khóa học'}</h2>
                <button 
                  className="add-btn" 
                  style={{ background: '#f3f4f6', color: '#4b5563' }}
                  onClick={() => {
                    setCourseTrashView(!courseTrashView);
                    if (!courseTrashView) fetchTrashCourses();
                  }}
                >
                  {courseTrashView ? 'Quay lại' : <><Trash2 size={18} /> Thùng rác</>}
                </button>
            </div>
            <p className="section-desc">
              {courseTrashView ? 'Danh sách các khóa học đã xóa tạm thời từ tất cả giảng viên.' : 'Danh sách các khóa học đã được phê duyệt và đang hiển thị trên hệ thống.'}
            </p>
            
            <div className="admin-search-wrapper" style={{ marginBottom: '20px', maxWidth: '400px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input 
                    type="text" 
                    placeholder="Tìm theo tên khóa học..." 
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
                />
            </div>

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Khóa học</th>
                            <th>Giảng viên</th>
                            <th>{courseTrashView ? 'Ngày xóa' : 'Ngày xuất bản'}</th>
                            {!courseTrashView && <th>Học viên</th>}
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courseTrashView ? (
                            trashCourses.length > 0 ? trashCourses.map(course => (
                                <tr key={course.id}>
                                    <td>
                                        <div className="course-cell">
                                            <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="admin-table-thumb" />
                                            <span>{course.title}</span>
                                        </div>
                                    </td>
                                    <td>{course.instructor?.name}</td>
                                    <td>{new Date(course.deletedAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="admin-btn approve" onClick={() => handleRestoreCourse(course.id)} title="Phục hồi">
                                                Phục hồi
                                            </button>
                                            <button className="admin-btn reject" onClick={() => handleForceDeleteCourse(course.id)} title="Xóa vĩnh viễn">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="empty-table-cell">Thùng rác trống</td></tr>
                            )
                        ) : (
                            pendingCourses.length > 0 ? pendingCourses.map(course => (
                                <tr key={course.id}>
                                    <td>
                                        <div className="course-cell">
                                            <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="admin-table-thumb" />
                                            <span>{course.title}</span>
                                        </div>
                                    </td>
                                    <td>{course.instructor?.name}</td>
                                    <td>{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</td>
                                    <td>{course.studentsCount || 0}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="admin-btn view" onClick={() => window.open(`/course/${course.id}`, '_blank')} title="Xem chi tiết">
                                                <Eye size={18} />
                                            </button>
                                            <button className="admin-btn reject" onClick={() => handleStatusUpdate(course.id, 3)} title="Gỡ xuống (Hủy xuất bản)">
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="empty-table-cell">Không có khóa học nào đã xuất bản</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'students':
      case 'instructors':
        const filteredUsers = usersList.filter(u => u.role === (activeTab === 'students' ? 'student' : 'instructor'));
        return (
          <div className="admin-content-fade-in">
            <h2 className="content-title">Quản lý {activeTab === 'students' ? 'Học viên' : 'Giảng viên'}</h2>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Ngày tham gia</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>#{u.id.substring(0, 8)}</td>
                                <td className="user-name-cell">{u.name}</td>
                                <td>{u.email}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td><span className="status-badge active">Hoạt động</span></td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="empty-table-cell">Không có dữ liệu người dùng</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'categories':
        return <div className="admin-content-fade-in"><h2 className="content-title">Quản lý danh mục</h2><p className="empty-state">Tính năng đang phát triển...</p></div>;
      case 'banners':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">Quản lý Banners</h2>
                <button className="add-btn primary" onClick={() => setShowBannerModal(true)}>
                    <Plus size={18} /> Thêm Banner mới
                </button>
            </div>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Banner</th>
                            <th>Tag</th>
                            <th>Thứ tự</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banners.length > 0 ? banners.map(banner => (
                            <tr key={banner.id}>
                                <td>
                                    <div className="banner-cell">
                                        <div className="banner-preview-box" style={{ background: banner.gradient }}>
                                            {banner.imageUrl && <img src={banner.imageUrl} alt="" />}
                                        </div>
                                        <div className="banner-info">
                                            <span className="banner-title">{banner.title}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="tag-badge">{banner.tag}</span></td>
                                <td>{banner.sortOrder}</td>
                                <td>
                                    <span className={`status-badge ${banner.isActive ? 'active' : 'draft'}`}>
                                        {banner.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button 
                                            className={`admin-btn ${banner.isActive ? 'reject' : 'approve'}`} 
                                            title={banner.isActive ? "Tạm dừng" : "Kích hoạt"}
                                            onClick={() => handleBannerToggle(banner.id, banner.isActive)}
                                        >
                                            <XCircle size={18} />
                                        </button>
                                        <button className="admin-btn reject" onClick={() => handleBannerDelete(banner.id)} title="Xóa">
                                            <FileText size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="empty-table-cell">Chưa có banner nào</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'all-articles':
      case 'my-articles':
      case 'review-articles':
        if (articleView === 'editor') {
          return (
            <ArticleEditor 
              articleId={editingArticleId}
              articleData={editingArticleData}
              userRole="admin"
              onClose={() => setArticleView('list')}
              onSuccess={() => {
                setArticleView('list');
                fetchData();
              }}
            />
          );
        }
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">
                  {articleTrashView ? 'Thùng rác Bài viết' : (
                    activeTab === 'all-articles' ? 'Tất cả bài viết' : 
                    activeTab === 'my-articles' ? 'Bài viết của tôi' : 'Duyệt bài viết'
                  )}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="add-btn"
                      style={{ background: '#f3f4f6', color: '#4b5563' }}
                      onClick={() => {
                        setArticleTrashView(!articleTrashView);
                        if (!articleTrashView) fetchTrashArticles();
                      }}
                    >
                      {articleTrashView ? 'Quay lại' : <><Trash2 size={18} /> Thùng rác</>}
                    </button>
                    {!articleTrashView && (
                      <button 
                        className="add-btn primary"
                        onClick={() => {
                          setArticleView('editor');
                          setEditingArticleId(null);
                          setEditingArticleData(null);
                        }}
                      >
                        <Plus size={18} /> Viết bài
                      </button>
                    )}
                </div>
            </div>

            <div className="admin-search-wrapper" style={{ marginBottom: '20px', maxWidth: '400px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                <input 
                    type="text" 
                    placeholder={activeTab === 'all-articles' ? "Tìm trong tất cả bài viết..." : 
                                 activeTab === 'my-articles' ? "Tìm theo tên bài viết của tôi..." : "Tìm theo tên bài viết chờ duyệt..."} 
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#1f2937' }}
                />
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bài viết</th>
                    {(!articleTrashView && activeTab !== 'my-articles') && <th>Tác giả</th>}
                    <th>Danh mục</th>
                    <th>{articleTrashView ? 'Ngày xóa' : 'Ngày'}</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {articleTrashView ? (
                    trashArticles.length > 0 ? trashArticles.map(art => (
                      <tr key={art.id}>
                        <td style={{ fontWeight: '500' }}>{art.title}</td>
                        <td>{art.category}</td>
                        <td>{new Date(art.deletedAt).toLocaleDateString('vi-VN')}</td>
                        <td><span className="status-badge rejected">Đã xóa</span></td>
                        <td>
                          <div className="admin-actions">
                            <button className="admin-btn approve" onClick={() => handleRestoreArticle(art.id)} title="Phục hồi">
                              Phục hồi
                            </button>
                            <button className="admin-btn reject" onClick={() => handleForceDeleteArticle(art.id)} title="Xóa vĩnh viễn">
                              <XCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="empty-table-cell">Thùng rác trống</td></tr>
                    )
                  ) : (
                    (activeTab === 'review-articles' ? pendingArticles : articles).length > 0 ? 
                    (activeTab === 'review-articles' ? pendingArticles : articles).map(art => (
                      <tr key={art.id}>
                        <td style={{ fontWeight: '500' }}>{art.title}</td>
                        {activeTab !== 'my-articles' && <td>{art.author?.name || 'Admin'}</td>}
                        <td>{art.category}</td>
                        <td>{new Date(art.updatedAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <span className={`status-badge ${
                            art.articleStatus === 2 ? 'active' : 
                            art.articleStatus === 1 ? 'pending' : 
                            art.articleStatus === 3 ? 'rejected' : 'draft'
                          }`}>
                            {art.articleStatus === 2 ? 'Đã xuất bản' : 
                             art.articleStatus === 1 ? 'Chờ duyệt' : 
                             art.articleStatus === 3 ? 'Từ chối' : 'Bản nháp'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            {activeTab === 'review-articles' ? (
                              <>
                                <button className="admin-btn approve" onClick={() => handleArticleStatusUpdate(art.id, 2)} title="Duyệt">
                                  <Check size={18} />
                                </button>
                                <button className="admin-btn reject" onClick={() => handleArticleStatusUpdate(art.id, 3)} title="Từ chối">
                                  <XCircle size={18} />
                                </button>
                                <button className="admin-btn view" onClick={() => window.open(`/articles/${art.id}`, '_blank')} title="Xem trước">
                                  <Eye size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="admin-btn view" 
                                  title="Sửa"
                                  onClick={() => {
                                    setArticleView('editor');
                                    setEditingArticleId(art.id);
                                    setEditingArticleData(art);
                                  }}
                                >
                                  <CheckSquare size={18} />
                                </button>
                                <button className="admin-btn view" onClick={() => window.open(`/articles/${art.id}`, '_blank')} title="Xem">
                                  <Eye size={18} />
                                </button>
                                {art.articleStatus === 2 ? (
                                  <button className="admin-btn reject" title="Gỡ xuống" onClick={() => handleArticleStatusUpdate(art.id, 0)}>
                                    <ArrowDownCircle size={18} />
                                  </button>
                                ) : (
                                  <button className="admin-btn approve" title="Xuất bản" onClick={() => handleArticleStatusUpdate(art.id, 2)}>
                                    <CheckCircle size={18} />
                                  </button>
                                )}
                                <button className="admin-btn reject" title="Xóa" onClick={() => handleArticleDelete(art.id)}>
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="empty-table-cell">Không có bài viết nào</td></tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">Thông báo hệ thống</h2>
                <button className="add-btn secondary" onClick={handleMarkAllRead}>
                    Đánh dấu tất cả đã đọc
                </button>
            </div>
            <p className="section-desc">Theo dõi các hoạt động quan trọng từ giảng viên và hệ thống.</p>
            
            <div className="notifications-list">
                {notifications.length > 0 ? notifications.map(notif => (
                    <div key={notif.id} className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}>
                        <div className="notif-content">
                            <div className="notif-header">
                                <span className="notif-title">{notif.title}</span>
                                <span className="notif-time">
                                    {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <p className="notif-message">{notif.message}</p>
                        </div>
                        {!notif.isRead && (
                            <button className="mark-read-mark-btn" onClick={() => handleMarkAsRead(notif.id)} title="Đánh dấu đã đọc">
                                <Check size={16} />
                            </button>
                        )}
                    </div>
                )) : (
                    <div className="empty-state">
                        <Bell size={48} />
                        <p>Bạn không có thông báo nào</p>
                    </div>
                )}
            </div>
          </div>
        );
      default:
        return <div className="admin-content-fade-in"><h2>Chào mừng quay trở lại</h2><p>Vui lòng chọn một mục từ menu bên trái.</p></div>;
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="admin-logo">
            <span className="logo-text">EduCore</span>
            <span className="logo-badge">Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isUsersItem = item.id === 'users';
            const isArticlesItem = item.id === 'articles';
            const isItemMenuOpen = isUsersItem ? isUsersMenuOpen : (isArticlesItem ? isArticlesMenuOpen : false);
            
            const isTabActive = activeTab === item.id || 
              (isUsersItem && (activeTab === 'students' || activeTab === 'instructors')) ||
              (isArticlesItem && (activeTab === 'all-articles' || activeTab === 'my-articles' || activeTab === 'review-articles'));

            return (
              <div key={item.id} className="nav-group">
                <button
                  className={`nav-item ${isTabActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      if (isUsersItem) setIsUsersMenuOpen(!isUsersMenuOpen);
                      if (isArticlesItem) setIsArticlesMenuOpen(!isArticlesMenuOpen);
                    } else {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }
                  }}
                >
                  <span className="item-icon">{item.icon}</span>
                  <span className="item-label">{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount}</span>
                  )}
                  {item.hasSubmenu ? (
                    <ChevronDown size={16} className={`arrow-icon ${isItemMenuOpen ? 'rotated' : ''}`} />
                  ) : (
                    activeTab === item.id && <ChevronRight size={16} className="active-arrow" />
                  )}
                </button>
                
                {item.hasSubmenu && isItemMenuOpen && (
                  <div className="submenu">
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        className={`submenu-item ${activeTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveTab(subItem.id);
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                      >
                        <span className="sub-icon">{subItem.icon}</span>
                        <span className="sub-label">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="admin-info">
              <span className="admin-name">{user?.name || 'Administrator'}</span>
              <span className="admin-role">Quản trị viên</span>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
             <h3 className="system-title">Hệ quản trị EduCore</h3>
          </div>
          <div className="topbar-right">
             <div className="date-display">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
          </div>
        </header>
        
        <div className="admin-content-wrapper">
          {renderContent()}
        </div>

        {/* Create Banner Modal */}
        {showBannerModal && (
            <div className="admin-modal-overlay">
                <div className="admin-modal-content">
                    <div className="modal-header">
                        <h3>Thêm Banner Mới</h3>
                        <button className="close-modal" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleBannerSubmit} className="admin-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Tiêu đề Banner</label>
                                <input 
                                    type="text" 
                                    value={newBanner.title} 
                                    onChange={(e) => setNewBanner({...newBanner, title: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Tag (VD: Mới, HOT...)</label>
                                <input 
                                    type="text" 
                                    value={newBanner.tag} 
                                    onChange={(e) => setNewBanner({...newBanner, tag: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Mô tả ngắn</label>
                            <textarea 
                                value={newBanner.description} 
                                onChange={(e) => setNewBanner({...newBanner, description: e.target.value})} 
                                rows="2"
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Text Button</label>
                                <input 
                                    type="text" 
                                    value={newBanner.buttonText} 
                                    onChange={(e) => setNewBanner({...newBanner, buttonText: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Thứ tự hiển thị</label>
                                <input 
                                    type="number" 
                                    value={newBanner.sortOrder} 
                                    onChange={(e) => setNewBanner({...newBanner, sortOrder: parseInt(e.target.value)})} 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Màu nền (CSS Gradient)</label>
                            <input 
                                type="text" 
                                value={newBanner.gradient} 
                                onChange={(e) => setNewBanner({...newBanner, gradient: e.target.value})} 
                                placeholder="linear-gradient(...)"
                            />
                        </div>

                        <div className="form-group">
                            <label>Hình ảnh Banner</label>
                            <div className="modal-upload-area">
                                <input 
                                    type="file" 
                                    id="banner-upload" 
                                    onChange={handleBannerThumbnailUpload} 
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="banner-upload" className="modal-upload-label">
                                    {uploadingBanner ? 'Đang tải lên...' : newBanner.imageUrl ? 'Đã tải ảnh lên' : 'Nhấn để chọn ảnh'}
                                </label>
                                {newBanner.imageUrl && <img src={newBanner.imageUrl} alt="" className="modal-preview-img" />}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => setShowBannerModal(false)}>Hủy</button>
                            <button type="submit" className="btn-submit" disabled={uploadingBanner}>Tạo Banner</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </main>
      <ConfirmDialog 
        {...confirmDialog} 
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};

export default AdminDashboard;
