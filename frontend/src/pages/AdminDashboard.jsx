import React, { useState, useEffect } from 'react';
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
  Check,
  XCircle,
  Eye,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Plus
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [banners, setBanners] = useState([]);
  const [usersList, setUsersList] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

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
    { id: 'articles', label: 'Bài viết', icon: <FileText size={20} /> },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'overview') {
        const { data } = await axios.get('http://localhost:5000/api/admin/stats', { headers });
        setStats(data);
      } else if (activeTab === 'approvals') {
        const { data } = await axios.get('http://localhost:5000/api/admin/courses/pending', { headers });
        setPendingCourses(data);
      } else if (activeTab === 'courses') {
        const { data } = await axios.get('http://localhost:5000/api/admin/courses', { headers });
        // Lọc khóa học đã xuất bản (published: 2)
        setPendingCourses(data.filter(c => c.published === 2));
      } else if (activeTab === 'students' || activeTab === 'instructors') {
        const { data } = await axios.get('http://localhost:5000/api/admin/users', { headers });
        setUsersList(data);
      } else if (activeTab === 'banners') {
        const { data } = await axios.get('http://localhost:5000/api/banners/all', { headers });
        setBanners(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (courseId, status) => {
    const confirmMsg = status === 2 
        ? 'Bạn có chắc chắn muốn phê duyệt khóa học này?' 
        : 'Bạn có chắc chắn muốn từ chối khóa học này?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/courses/${courseId}/status`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(status === 2 ? 'Đã phê duyệt thành công!' : 'Đã từ chối khóa học.');
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert('Có lỗi xảy ra khi thực hiện thao tác.');
    }
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

  const handleBannerDelete = async (bannerId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/banners/${bannerId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Đã xóa banner thành công!');
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Lỗi khi xóa banner:', error);
      alert('Có lỗi xảy ra khi xóa banner.');
    }
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
            </div>
            <div className="recent-activity">
                <h3>Hoạt động gần đây</h3>
                <div className="activity-placeholder">
                    Hệ thống đang hoạt động ổn định.
                </div>
            </div>
          </div>
        );
      case 'approvals':
        return (
          <div className="admin-content-fade-in">
            <h2 className="content-title">Phê duyệt khóa học</h2>
            <p className="section-desc">Danh sách các khóa học đang chờ bạn kiểm duyệt nội dung.</p>
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
            <h2 className="content-title">Quản lý khóa học</h2>
            <p className="section-desc">Danh sách tất cả các khóa học đã được xuất bản trên hệ thống.</p>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Khóa học</th>
                            <th>Giảng viên</th>
                            <th>Ngày xuất bản</th>
                            <th>Học viên</th>
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
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'banners':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">Quản lý Banners</h2>
                <button className="add-btn primary" onClick={() => setShowBannerModal(true)}>
                    <Plus size={18} /> Thêm Banner mới
                </button>
            </div>
            <p className="section-desc">Quản lý các banner quảng cáo hiển thị trên trang chủ Carousel.</p>
            
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Hình ảnh & Tiêu đề</th>
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
                                        <div className="banner-thumb-wrapper" style={{ background: banner.gradient || '#6366f1' }}>
                                            {banner.imageUrl && <img src={banner.imageUrl} alt="" className="admin-table-thumb" />}
                                        </div>
                                        <div className="banner-info-cell">
                                            <span className="banner-title-text">{banner.title}</span>
                                            <span className="banner-desc-text">{banner.description}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="banner-tag-badge">{banner.tag}</span></td>
                                <td>{banner.sortOrder}</td>
                                <td>
                                    <button 
                                        className={`status-toggle-btn ${banner.isActive ? 'active' : 'inactive'}`}
                                        onClick={() => handleBannerToggle(banner.id, banner.isActive)}
                                    >
                                        {banner.isActive ? 'Đang hiện' : 'Đang ẩn'}
                                    </button>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn reject" onClick={() => handleBannerDelete(banner.id)} title="Xóa">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="empty-table-cell">Chưa có banner nào</td>
                            </tr>
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
                            <th>Tên</th>
                            <th>Email</th>
                            <th>Ngày tham gia</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <span className="status-badge active">Hoạt động</span>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan="4" className="empty-table-cell">Không có người dùng nào</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      default:
        return (
          <div className="admin-content-fade-in">
            <h2 className="content-title">{menuItems.find(m => m.id === activeTab)?.label}</h2>
            <div className="placeholder-content">
              Module này đang được phát triển. Dữ liệu sẽ sớm hiển thị tại đây.
            </div>
          </div>
        );
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
          {menuItems.map((item) => (
            <div key={item.id} className="nav-group">
              <button
                className={`nav-item ${activeTab === item.id || (item.id === 'users' && (activeTab === 'students' || activeTab === 'instructors')) ? 'active' : ''}`}
                onClick={() => {
                  if (item.hasSubmenu) {
                    setIsUsersMenuOpen(!isUsersMenuOpen);
                  } else {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }
                }}
              >
                <span className="item-icon">{item.icon}</span>
                <span className="item-label">{item.label}</span>
                {item.hasSubmenu ? (
                  <ChevronDown size={16} className={`arrow-icon ${isUsersMenuOpen ? 'rotated' : ''}`} />
                ) : (
                  activeTab === item.id && <ChevronRight size={16} className="active-arrow" />
                )}
              </button>
              
              {item.hasSubmenu && isUsersMenuOpen && (
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
          ))}
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
    </div>
  );
};

export default AdminDashboard;
