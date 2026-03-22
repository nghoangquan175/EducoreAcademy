import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import ApproveInstructorModal from './ApproveInstructorModal';
import './InstructorApplications.css';

const InstructorApplications = ({ setConfirmDialog }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    id: null,
    name: '',
    email: '',
    loading: false
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/instructor-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách đăng ký:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách đơn đăng ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApproveClick = (id, name, email) => {
    setApproveModal({
      isOpen: true,
      id,
      name,
      email,
      loading: false
    });
  };

  const handleApproveConfirm = async (email, password) => {
    setApproveModal(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/instructor-applications/${approveModal.id}/approve`, 
        { email, password }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã phê duyệt và tạo tài khoản thành công!');
      setApproveModal({ isOpen: false, id: null, name: '', email: '', loading: false });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt.');
      setApproveModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReject = (id, name) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Từ chối đơn đăng ký',
      message: `Bạn có chắc chắn muốn từ chối đơn đăng ký của ${name}? Hệ thống sẽ gửi email thông báo từ chối cho ứng viên.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/instructor-applications/${id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã từ chối đơn đăng ký.');
          fetchApplications();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối.');
        }
      }
    });
  };

  const filteredApplications = applications.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-container">Đang tải danh sách...</div>;

  return (
    <div className="admin-content-fade-in instructor-applications-container">
      <div className="section-header">
        <h2 className="content-title">Quản lý Đơn đăng ký Giảng viên</h2>
      </div>
      <p className="section-desc">Danh sách các ứng viên đăng ký trở thành đối tác giảng dạy.</p>

      <div className="admin-search-wrapper applications-search">
        <Search size={18} className="search-icon" />
        <input 
          type="text" 
          placeholder="Tìm theo tên hoặc email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ứng viên</th>
              <th>Liên hệ</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.length > 0 ? filteredApplications.map(app => (
              <tr key={app.id}>
                <td>
                  <div className="app-user-info">
                    <span className="app-name">{app.name}</span>
                    <span className="app-bio">{app.bio ? (app.bio.length > 50 ? app.bio.substring(0, 50) + '...' : app.bio) : 'Không có giới thiệu'}</span>
                  </div>
                </td>
                <td>
                  <div className="app-contact-info">
                    <span>{app.email}</span>
                    <span className="text-muted">{app.phone}</span>
                  </div>
                </td>
                <td>{new Date(app.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <span className={`status-badge ${app.status}`}>
                    {app.status === 'pending' ? 'Chờ duyệt' : app.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <a 
                      href={`/admin/applications/${app.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="admin-btn view" 
                      title="Xem chi tiết đơn"
                    >
                      <Eye size={18} />
                    </a>
                    {app.status === 'pending' && (
                      <>
                        <button 
                          className="admin-btn approve" 
                          onClick={() => handleApproveClick(app.id, app.name, app.email)} 
                          title="Phê duyệt"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          className="admin-btn reject" 
                          onClick={() => handleReject(app.id, app.name)} 
                          title="Từ chối"
                        >
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="empty-table-cell">Không có đơn đăng ký nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ApproveInstructorModal 
        key={approveModal.id}
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ ...approveModal, isOpen: false })}
        onConfirm={handleApproveConfirm}
        applicantName={approveModal.name}
        applicantEmail={approveModal.email}
        loading={approveModal.loading}
      />
    </div>
  );
};

export default InstructorApplications;
