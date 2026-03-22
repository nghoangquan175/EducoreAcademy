import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  ExternalLink,
  Download
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import ApproveInstructorModal from '../components/ApproveInstructorModal';
import './PartnerApplicationDetail.css';

const PartnerApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    loading: false
  });

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/instructor-applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplication(data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn đăng ký:', error);
      toast.error('Không tìm thấy đơn đăng ký hoặc lỗi máy chủ');
      navigate('/admin-dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleApproveClick = () => {
    setApproveModal({
      isOpen: true,
      loading: false
    });
  };

  const handleApproveConfirm = async (email, password) => {
    setApproveModal(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/instructor-applications/${id}/approve`, 
        { email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã phê duyệt và tạo tài khoản thành công!');
      setApproveModal({ isOpen: false, loading: false });
      fetchApplication();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt.');
      setApproveModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReject = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Từ chối đơn đăng ký',
      message: `Bạn có chắc chắn muốn từ chối đơn đăng ký của ${application.name}? Hệ thống sẽ gửi email thông báo từ chối cho ứng viên.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/instructor-applications/${id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã từ chối đơn đăng ký.');
          fetchApplication();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi từ chối.');
        }
      }
    });
  };

  const getViewerUrl = (url) => {
    if (!url) return '';
    // Use Google Docs Viewer for inline viewing without download
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  if (loading) return <div className="loading-fullscreen">Đang tải chi tiết đơn đăng ký...</div>;
  if (!application) return null;

  return (
    <div className="app-detail-page">
      <div className="app-detail-header">
        <button className="back-btn" onClick={() => window.close()}>
          <ArrowLeft size={20} />
          <span>Quay lại Dashboard</span>
        </button>
        <div className="header-actions">
           <span className={`status-pill ${application.status}`}>
              {application.status === 'pending' ? 'Chờ duyệt' : application.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
           </span>
        </div>
      </div>

      <div className="app-detail-content">
        {/* Left Sidebar Info */}
        <div className="detail-sidebar">
          <div className="sidebar-card user-main-info">
            <div className="user-avatar-placeholder">
              {application.name.charAt(0)}
            </div>
            <h2>{application.name}</h2>
            <p className="app-date">Ngày nộp: {new Date(application.createdAt).toLocaleDateString('vi-VN')}</p>
            
            <div className="contact-list">
              <div className="contact-item">
                <Mail size={18} />
                <span>{application.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={18} />
                <span>{application.phone}</span>
              </div>
            </div>

            {application.status === 'pending' && (
              <div className="sidebar-actions">
                <button className="btn-approve" onClick={handleApproveClick}>
                  <CheckCircle size={18} /> Phê duyệt
                </button>
                <button className="btn-reject" onClick={handleReject}>
                  <XCircle size={18} /> Từ chối
                </button>
              </div>
            )}
          </div>

          <div className="sidebar-card">
            <h3>Giới thiệu</h3>
            <p className="bio-text">{application.bio || 'Không có thông tin giới thiệu.'}</p>
          </div>
        </div>

        {/* Main CV View */}
        <div className="cv-preview-section">
          <div className="cv-header">
            <div className="cv-title">
              <FileText size={20} />
              <h3>Hồ sơ năng lực (CV)</h3>
            </div>
            <div className="cv-actions">
               <a href={application.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-action-link">
                 <Download size={18} /> Tải xuống
               </a>
               <a href={application.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-action-link">
                 <ExternalLink size={18} /> Mở tab mới
               </a>
            </div>
          </div>
          
          <div className="cv-viewer-container">
            <iframe 
              src={getViewerUrl(application.cvUrl)}
              width="100%" 
              height="100%" 
              title="CV Viewer"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />

      <ApproveInstructorModal 
        key={id}
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ ...approveModal, isOpen: false })}
        onConfirm={handleApproveConfirm}
        applicantName={application.name}
        applicantEmail={application.email}
        loading={approveModal.loading}
      />
    </div>
  );
};

export default PartnerApplicationDetail;
