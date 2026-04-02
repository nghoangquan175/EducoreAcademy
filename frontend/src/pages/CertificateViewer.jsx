import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Download, 
    Share2, 
    Facebook, 
    Linkedin, 
    Copy, 
    ArrowLeft,
    CheckCircle,
    ExternalLink,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './CertificateViewer.css';

const CertificateViewer = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCert = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/certificates/verify/${code}`);
                setCert(res.data);
                
                // Update Page Title
                document.title = `Chứng chỉ: ${res.data.courseTitle} - ${res.data.studentName}`;
            } catch (err) {
                setError(err.response?.data?.message || 'Không tìm thấy chứng chỉ');
            } finally {
                setLoading(false);
            }
        };
        fetchCert();
    }, [code]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết chứng chỉ!');
    };

    const handleShareFacebook = () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const handleShareLinkedIn = () => {
        const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    if (loading) {
        return (
            <div className="cert-viewer-loading">
                <Loader2 className="animate-spin" size={48} color="#3b82f6" />
                <p>Đang tải thông tin chứng chỉ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cert-viewer-error">
                <div className="error-card">
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')} className="btn-back"> Quay về Trang chủ</button>
                </div>
            </div>
        );
    }

    return (
        <div className="cert-viewer-page">
            <div className="cert-viewer-container">
                {/* Header Section */}
                <header className="cert-viewer-header">
                    <div className="header-left">
                        <div className="cert-title-group">
                            <h1>Chứng chỉ hoàn thành</h1>
                            <div className="cert-badges">
                                <span className="badge-verified">
                                    <CheckCircle size={14} /> ID: {cert.certificateCode}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="header-right">
                        <button onClick={handleCopyLink} className="btn-outline">
                            <Copy size={18} /> <span style={{ whiteSpace: 'nowrap' }}>Copy Link</span>
                        </button>
                        <a href={cert.pdfUrl} download={`Certificate-${code}.pdf`} className="btn-primary" target="_blank" rel="noreferrer">
                            <Download size={18} /> <span style={{ whiteSpace: 'nowrap' }}>Tải xuống (PDF)</span>
                        </a>
                    </div>
                </header>

                <div className="cert-viewer-content">
                    {/* Main Viewer */}
                    <div className="cert-pdf-frame">
                        <iframe 
                            src={`${cert.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                            title="Certificate Viewer"
                            width="100%"
                            height="100%"
                        ></iframe>
                    </div>

                    {/* Sidebar / Info */}
                    <aside className="cert-viewer-sidebar">
                        <div className="sidebar-card info-card">
                            <h3>Thông tin xác thực</h3>
                            <div className="info-item">
                                <label>Học viên</label>
                                <p>{cert.studentName}</p>
                            </div>
                            <div className="info-item">
                                <label>Khóa học</label>
                                <p>{cert.courseTitle}</p>
                            </div>
                            <div className="info-item">
                                <label>Ngày cấp</label>
                                <p>{new Date(cert.issuedAt).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}</p>
                            </div>
                            <div className="verify-badge">
                                <div className="verify-icon">✓</div>
                                <span>Chứng chỉ hợp lệ & được xác thực bởi Educore Academy</span>
                            </div>
                        </div>

                        <div className="sidebar-card share-card">
                            <h3>Chia sẻ thành tựu</h3>
                            <p>Chia sẻ chứng chỉ của bạn lên mạng xã hội để mọi người cùng biết!</p>
                            <div className="share-buttons">
                                <button onClick={handleShareFacebook} className="share-btn fb">
                                    <Facebook size={20} /> Facebook
                                </button>
                                <button onClick={handleShareLinkedIn} className="share-btn li">
                                    <Linkedin size={20} /> LinkedIn
                                </button>
                            </div>
                        </div>

                        <div className="sidebar-card course-suggest">
                            <p>Bạn muốn tiếp tục hành trình học tập?</p>
                            <button onClick={() => navigate('/')} className="btn-full">
                                Khám phá thêm khóa học <ExternalLink size={14} />
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CertificateViewer;
