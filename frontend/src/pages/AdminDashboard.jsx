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
  ArrowUpCircle,
  Eye, 
  Check,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Plus,
  Bell,
  Search,
  User,
  Trash2,
  Pencil,
  ArrowLeft,
  Send,
  Mail,
  Calendar,
  Clock,
  HelpCircle,
  Play,
  DollarSign
} from 'lucide-react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CategoryManager from '../components/CategoryManager';
import InstructorApplications from '../components/InstructorApplications';
import CourseDetailView from '../components/CourseDetailView';
import RevenuePolicyDetail from '../components/RevenuePolicyDetail';
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
  const [isCoursesMenuOpen, setIsCoursesMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [banners, setBanners] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [selectedEditRequest, setSelectedEditRequest] = useState(null);
  const [diffData, setDiffData] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isReviewRequestModalOpen, setIsReviewRequestModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerTrashView, setBannerTrashView] = useState(false);
  const [trashBanners, setTrashBanners] = useState([]);
  const [bannerLinkCourses, setBannerLinkCourses] = useState([]);
  const [bannerLinkArticles, setBannerLinkArticles] = useState([]);
  
  // User detail state
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [lastUserTab, setLastUserTab] = useState('students');
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const defaultBanner = {
    title: '',
    description: '',
    buttonText: 'Khám phá ngay',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    imageUrl: '',
    tag: 'Mới',
    sortOrder: 1,
    isActive: true,
    linkType: '',
    linkId: null,
  };
  const [newBanner, setNewBanner] = useState({ ...defaultBanner });
  
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
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [reviewCourseId, setReviewCourseId] = useState(null);
  const [reviewCourseData, setReviewCourseData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [lastCourseTab, setLastCourseTab] = useState('manage-courses');
  const [trashArticles, setTrashArticles] = useState([]);
  const [trashCourses, setTrashCourses] = useState([]);
  const [courseTrashView, setCourseTrashView] = useState(false);
  const [articleTrashView, setArticleTrashView] = useState(false);
  const [isCourseDetailViewOpen, setIsCourseDetailViewOpen] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);

  // Revenue Policy State
  const [revenuePolicies, setRevenuePolicies] = useState([]);
  const [revenueSearch, setRevenueSearch] = useState('');
  const [debouncedRevenueSearch, setDebouncedRevenueSearch] = useState('');
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedRevenuePolicy, setSelectedRevenuePolicy] = useState(null);
  const [showRevenuePolicyDetail, setShowRevenuePolicyDetail] = useState(false);
  const [editingRevenuePolicyId, setEditingRevenuePolicyId] = useState(null);
  const [revenueData, setRevenueData] = useState({
    courseId: '',
    type: 'PERCENT',
    instructorPercent: 0,
    fixedAmount: 0,
  });

  const prevTab = useRef(activeTab);
  const prevSubTab = useRef(articleSubTab);

  // Bulk Notification State
  const [bulkNotifData, setBulkNotifData] = useState({
    target: 'all',
    title: '',
    message: ''
  });
  const [sendingBulkNotif, setSendingBulkNotif] = useState(false);

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
    { 
      id: 'courses', 
      label: 'Khóa học', 
      icon: <BookOpen size={20} />,
      hasSubmenu: true,
      subItems: [
        { id: 'manage-courses', label: 'Khóa học đã xuất bản', icon: <Layers size={18} /> },
        { id: 'approvals', label: 'Quản lý', icon: <CheckSquare size={18} /> },
        { id: 'edit-requests', label: 'Yêu cầu sửa', icon: <Pencil size={18} /> },
      ]
    },
    { 
      id: 'users', 
      label: 'Người dùng', 
      icon: <Users size={20} />,
      hasSubmenu: true,
      subItems: [
        { id: 'students', label: 'Học viên', icon: <GraduationCap size={18} /> },
        { id: 'instructors', label: 'Giảng viên', icon: <UserCheck size={18} /> },
        { id: 'bulk-notification', label: 'Gửi thông báo', icon: <Send size={18} /> },
        { id: 'applications', label: 'Đơn đăng ký GV', icon: <FileText size={18} /> },
      ]
    },
    { id: 'categories', label: 'Danh mục', icon: <Layers size={20} /> },
    { id: 'banners', label: 'Banners', icon: <ImageIcon size={20} /> },
    { id: 'revenue-policy', label: 'Chính sách Doanh thu', icon: <DollarSign size={20} /> },
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
    const timer = setTimeout(() => {
      setDebouncedRevenueSearch(revenueSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [revenueSearch]);

  useEffect(() => {
    const isSilent = (activeTab === prevTab.current && articleSubTab === prevSubTab.current);
    fetchData(isSilent);
    prevTab.current = activeTab;
    prevSubTab.current = articleSubTab;
  }, [activeTab, articleSubTab, articlePage, debouncedArticleSearch, debouncedCourseSearch, debouncedRevenueSearch]);

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
        const { data } = await axios.get(`http://localhost:5000/api/admin/courses?search=${debouncedCourseSearch}`, { headers });
        // Quản lý: hiển thị trạng thái 1 (Chờ duyệt), 2 (Đã duyệt ND), 3 (Từ chối), 4 (Sẵn sàng đăng)
        setPendingCourses(data.filter(c => [1, 2, 3, 4].includes(Number(c.published))));
      } else if (activeTab === 'manage-courses') {
        const { data } = await axios.get(`http://localhost:5000/api/admin/courses?search=${debouncedCourseSearch}`, { headers });
        // Khóa học đã xuất bản: hiển thị trạng thái 5 (Đã xuất bản), 6 (Đã gỡ)
        setPendingCourses(data.filter(c => [5, 6].includes(Number(c.published))));
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
      } else if (activeTab === 'edit-requests') {
        const { data } = await axios.get('http://localhost:5000/api/admin/courses/edit-requests', { headers });
        setEditRequests(data);
      } else if (activeTab === 'revenue-policy') {
        const { data } = await axios.get(`http://localhost:5000/api/revenue-policies?search=${debouncedRevenueSearch}`, { headers });
        setRevenuePolicies(data.policies || []);
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

  const fetchReviewCourse = async (id) => {
    setReviewLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/admin/courses/${id}/review`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReviewCourseData(data);
    } catch (error) {
      toast.error('Không thể tải thông tin khóa học để review');
      setActiveTab(lastCourseTab || 'manage-courses');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewCourse = (id) => {
    setLastCourseTab(activeTab);
    setReviewCourseId(id);
    setActiveTab('course-review');
    fetchReviewCourse(id);
  };

  const handleEditRequestStatus = (requestId, status, message = '') => {
    const isApprove = status === 'approved';
    setConfirmDialog({
      isOpen: true,
      title: isApprove ? 'Phê duyệt yêu cầu sửa' : 'Từ chối yêu cầu sửa',
      message: isApprove 
        ? 'Phê duyệt sẽ tạo một bản clone V2 cho giảng viên chỉnh sửa. Bạn có chắc chắn?' 
        : 'Từ chối yêu cầu chỉnh sửa này?',
      type: isApprove ? 'info' : 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/admin/courses/edit-requests/${requestId}/status`, 
            { status, message }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success(isApprove ? 'Đã phê duyệt yêu cầu!' : 'Đã từ chối yêu cầu.');
          setIsReviewRequestModalOpen(false);
          fetchData();
        } catch (error) {
          toast.error('Lỗi khi xử lý yêu cầu');
        }
      }
    });
  };

  const handleRevenueSubmit = async (e, sendImmediately = false) => {
    if (e) e.preventDefault();
    
    // Validation
    if (!revenueData.courseId) {
      toast.error('Vui lòng chọn khóa học');
      return;
    }
    
    if (revenueData.type === 'PERCENT' || revenueData.type === 'HYBRID') {
      if (revenueData.instructorPercent <= 0 || revenueData.instructorPercent > 100) {
        toast.error('Phần trăm giảng viên phải từ 1 đến 100');
        return;
      }
    }
    
    if (revenueData.type === 'FIXED' || revenueData.type === 'HYBRID') {
      if (revenueData.fixedAmount <= 0) {
        toast.error('Số tiền cố định phải lớn hơn 0');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (editingRevenuePolicyId) {
        await axios.put(`http://localhost:5000/api/revenue-policies/${editingRevenuePolicyId}`, { ...revenueData, sendImmediately }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(sendImmediately ? 'Đã cập nhật và gửi chính sách cho giảng viên!' : 'Đã cập nhật chính sách!');
      } else {
        await axios.post('http://localhost:5000/api/revenue-policies', { ...revenueData, sendImmediately }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(sendImmediately ? 'Đã tạo và gửi chính sách cho giảng viên!' : 'Đã lưu chính sách vào bản nháp!');
      }
      setShowRevenueModal(false);
      setEditingRevenuePolicyId(null);
      setRevenueData({
        courseId: '',
        type: 'PERCENT',
        instructorPercent: 0,
        fixedAmount: 0,
      });
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRevenuePolicyAction = async (id, action) => {
    if (action === 'edit') {
      const policy = revenuePolicies.find(p => p.id === id);
      if (policy) {
        setRevenueData({
          courseId: policy.courseId,
          type: policy.type,
          instructorPercent: policy.instructorPercent || 0,
          fixedAmount: policy.fixedAmount || 0,
        });
        setEditingRevenuePolicyId(id);
        setShowRevenuePolicyDetail(false);
        fetchBannerLinkData();
        setShowRevenueModal(true);
      }
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 
        action === 'send' ? 'Gửi chính sách doanh thu' : 
        action === 'accept' ? 'Chấp nhận chính sách' : 
        action === 'reject' ? 'Từ chối chính sách' : 
        action === 'revoke' ? 'Thu hồi chính sách' :
        action === 'request_delete' ? 'Yêu cầu xóa chính sách' :
        'Xóa chính sách',
      message: 
        action === 'send' ? 'Bạn có chắc chắn muốn gửi chính sách này cho giảng viên để xác nhận?' :
        action === 'accept' ? 'Bạn có chắc chắn muốn chấp nhận chính sách này? Nó sẽ có hiệu lực ngay lập tức.' :
        action === 'reject' ? 'Bạn có chắc chắn muốn từ chối chính sách này?' :
        action === 'revoke' ? 'Bạn có muốn thu hồi chính sách này về bản nháp? Giảng viên sẽ không thấy nó nữa.' :
        action === 'request_delete' ? 'Gửi yêu cầu xóa chính sách này tới giảng viên? Chính sách vẫn có hiệu lực cho đến khi giảng viên xác nhận xóa.' :
        'Bạn có chắc chắn muốn xóa chính sách này? Hành động này không thể hoàn tác.',
      type: action === 'reject' || action === 'delete' || action === 'revoke' ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          let status = action;
          if (action === 'send') status = 'waiting_confirm';
          if (action === 'accept') status = 'accepted';
          if (action === 'reject') status = 'rejected';
          if (action === 'revoke') status = 'draft';
          if (action === 'request_delete') status = 'waiting_delete';
  
          if (action === 'delete') {
            await axios.delete(`http://localhost:5000/api/revenue-policies/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã xóa chính sách doanh thu!');
          } else {
            await axios.patch(`http://localhost:5000/api/revenue-policies/${id}/status`, { status }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(
              action === 'send' ? 'Đã gửi chính sách cho giảng viên' : 
              action === 'revoke' ? 'Đã thu hồi chính sách về bản nháp' :
              'Đã cập nhật trạng thái'
            );
          }
          
          setShowRevenuePolicyDetail(false);
          fetchData(); // Refresh list
        } catch (error) {
          toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const fetchRevenuePolicyDetail = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/revenue-policies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRevenuePolicy(data);
      setShowRevenuePolicyDetail(true);
      setActiveTab('revenue-policy');
    } catch (error) {
      toast.error('Không thể tải chi tiết chính sách');
    }
  };

  const fetchDiffData = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/admin/courses/${courseId}/diff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiffData(data);
      setIsDiffModalOpen(true);
    } catch (error) {
      toast.error('Không thể tải dữ liệu so sánh');
    }
  };

  const handleStatusUpdate = (courseId, status) => {
    let title = '';
    let message = '';
    let type = 'info';

    switch (status) {
      case 2:
        title = 'Phê duyệt nội dung';
        message = 'Bạn có chắc chắn muốn phê duyệt nội dung khóa học này? Giảng viên có thể xem và chờ bước tiếp theo.';
        break;
      case 3:
        title = 'Từ chối khóa học';
        message = 'Bạn có chắc chắn muốn từ chối khóa học này?';
        type = 'danger';
        break;
      case 5:
        title = 'Xuất bản khóa học';
        message = 'Bạn có chắc chắn muốn xuất bản khóa học này lên hệ thống? Học viên có thể đăng ký học ngay lập tức.';
        break;
      case 6:
        title = 'Gỡ xuống khóa học';
        message = 'Tạm gỡ khóa học này? Học viên sẽ không thể đăng ký mới, nội dung sẽ được ẩn khỏi trang chủ.';
        type = 'danger';
        break;
      default:
        title = 'Cập nhật trạng thái';
        message = 'Bạn có chắc chắn muốn cập nhật trạng thái này?';
    }

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`http://localhost:5000/api/admin/courses/${courseId}/status`, 
            { status }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success('Đã cập nhật trạng thái thành công!');
          fetchData();
          if (activeTab === 'course-review' && Number(courseId) === Number(reviewCourseId)) {
            fetchReviewCourse(courseId);
          }
        } catch (error) {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          toast.error('Có lỗi xảy ra khi thực hiện thao tác.');
        }
      }
    });
  };

  const handleBannerToggle = (bannerId, currentStatus) => {
    const isDeactivating = currentStatus;
    setConfirmDialog({
      isOpen: true,
      title: isDeactivating ? 'Gỡ xuống Banner' : 'Đăng Banner',
      message: isDeactivating
        ? 'Bạn có chắc chắn muốn gỡ xuống banner này?'
        : 'Bạn có chắc chắn muốn đăng banner này lên trang chủ?',
      type: isDeactivating ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/banners/${bannerId}`,
            { isActive: !currentStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success(isDeactivating ? 'Đã gỡ xuống banner' : 'Đã đăng banner lên trang chủ');
          fetchData();
        } catch (error) {
          console.error('Lỗi khi cập nhật banner:', error);
          toast.error('Có lỗi xảy ra khi cập nhật trạng thái banner.');
        }
      }
    });
  };

  const handleBannerDelete = (bannerId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Banner',
      message: 'Banner sẽ được chuyển vào thùng rác. Bạn có chắc chắn?',
      type: 'warning',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/banners/${bannerId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          toast.success('Đã chuyển banner vào thùng rác');
          fetchData();
        } catch (error) {
          console.error('Lỗi khi xóa banner:', error);
          toast.error('Có lỗi xảy ra khi xóa banner.');
        }
      }
    });
  };

  const fetchTrashBanners = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/banners/trash', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrashBanners(data);
    } catch (error) {
      console.error('Lỗi khi tải thùng rác banner:', error);
    }
  };

  const handleRestoreBanner = (bannerId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục Banner',
      message: 'Bạn có chắc chắn muốn khôi phục banner này?',
      type: 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:5000/api/banners/${bannerId}/restore`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã khôi phục banner');
          fetchTrashBanners();
          fetchData();
        } catch (error) {
          toast.error('Lỗi khi khôi phục banner');
        }
      }
    });
  };

  const handleForceDeleteBanner = (bannerId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa vĩnh viễn Banner',
      message: 'Xóa vĩnh viễn banner này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/banners/${bannerId}/force`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Đã xóa vĩnh viễn banner');
          fetchTrashBanners();
        } catch (error) {
          toast.error('Lỗi khi xóa vĩnh viễn banner');
        }
      }
    });
  };

  const fetchBannerLinkData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [coursesRes, articlesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/courses', { headers }),
        axios.get('http://localhost:5000/api/admin/articles/all', { headers }),
      ]);
      setBannerLinkCourses(coursesRes.data || []);
      setBannerLinkArticles(articlesRes.data?.data || articlesRes.data || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu liên kết:', error);
    }
  };

  const openBannerModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setNewBanner({
        title: banner.title || '',
        description: banner.description || '',
        buttonText: banner.buttonText || 'Khám phá ngay',
        gradient: banner.gradient || '',
        imageUrl: banner.imageUrl || '',
        tag: banner.tag || '',
        sortOrder: banner.sortOrder || 0,
        isActive: banner.isActive,
        linkType: banner.linkType || '',
        linkId: banner.linkId || null,
      });
    } else {
      setEditingBanner(null);
      // Gợi ý số thứ tự tiếp theo (lớn nhất + 1)
      const nextOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sortOrder)) + 1 : 1;
      setNewBanner({ ...defaultBanner, sortOrder: nextOrder });
    }
    fetchBannerLinkData();
    setShowBannerModal(true);
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
          'Content-Type': 'multipart/form-type',
          Authorization: `Bearer ${token}`
        }
      });
      setNewBanner({ ...newBanner, imageUrl: res.data.url });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error('Tải ảnh banner thất bại!');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validation: sortOrder > 0
    if (newBanner.sortOrder <= 0) {
      toast.error('Thứ tự hiển thị phải lớn hơn 0');
      return;
    }

    // 2. Nếu là Edit, kiểm tra xem có thay đổi gì không để tránh request thừa
    if (editingBanner) {
      const hasChanged = 
        newBanner.title !== (editingBanner.title || '') ||
        newBanner.description !== (editingBanner.description || '') ||
        newBanner.buttonText !== (editingBanner.buttonText || 'Khám phá ngay') ||
        newBanner.gradient !== (editingBanner.gradient || '') ||
        newBanner.imageUrl !== (editingBanner.imageUrl || '') ||
        newBanner.tag !== (editingBanner.tag || '') ||
        newBanner.sortOrder !== (editingBanner.sortOrder || 1) ||
        newBanner.linkType !== (editingBanner.linkType || '') ||
        newBanner.linkId !== (editingBanner.linkId || null);

      if (!hasChanged) {
        toast.error('Không có thay đổi nào để cập nhật');
        return;
      }
    }

    // 3. Hiện Dialog xác nhận
    setConfirmDialog({
      isOpen: true,
      title: editingBanner ? 'Xác nhận cập nhật Banner' : 'Xác nhận tạo Banner mới',
      message: editingBanner 
        ? 'Bạn có chắc chắn muốn lưu các thay đổi cho banner này? Hệ thống sẽ tự động sắp xếp lại thứ tự nếu cần thiết.' 
        : 'Bạn có chắc chắn muốn tạo banner mới này?',
      type: 'info',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const payload = { ...newBanner, linkType: newBanner.linkType || null, linkId: newBanner.linkId || null };
          
          if (editingBanner) {
            await axios.put(`http://localhost:5000/api/banners/${editingBanner.id}`, payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã cập nhật banner!');
          } else {
            await axios.post('http://localhost:5000/api/banners', payload, {
              headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Đã thêm banner mới!');
          }
          
          setShowBannerModal(false);
          setEditingBanner(null);
          setNewBanner({ ...defaultBanner });
          fetchData();
        } catch (error) {
          toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  const handleViewUser = async (user) => {
    setSelectedUserDetails(null);
    setLastUserTab(activeTab);
    setActiveTab('user-detail');
    setLoadingUserDetail(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserDetails(data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết người dùng:', error);
      toast.error('Không thể tải thông tin chi tiết');
    } finally {
      setLoadingUserDetail(false);
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

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    
    if (notif.relatedId) {
       if (notif.type?.startsWith('course_submission')) {
          handleReviewCourse(notif.relatedId);
       } else if (notif.type?.startsWith('edit_request')) {
          setActiveTab('edit-requests');
       } else if (notif.type?.startsWith('article_submission')) {
          setActiveTab('review-articles');
          setArticleSubTab('review-articles');
       } else if (notif.type?.startsWith('revenue_policy_update')) {
          fetchRevenuePolicyDetail(notif.relatedId);
       }
    }
  };

  const getNotifStyle = (notif) => {
    const typeParts = notif.type?.split(':');
    if (!typeParts || typeParts.length < 2) return {};

    const status = parseInt(typeParts[1]);
    const colors = {
      0: 'rgba(107, 114, 128, 0.15)', // DRAFT - Gray
      1: 'rgba(245, 158, 11, 0.15)',  // PENDING_REVIEW - Amber
      2: 'rgba(59, 130, 246, 0.15)',  // CONTENT_APPROVED - Blue
      3: 'rgba(239, 68, 68, 0.15)',   // REJECTED - Red
      4: 'rgba(139, 92, 246, 0.15)',  // READY_TO_PUBLISH - Violet
      5: 'rgba(16, 185, 129, 0.15)',  // PUBLISHED - Emerald
      6: 'rgba(249, 115, 22, 0.15)',  // UNPUBLISHED - Orange
    };

    return { backgroundColor: colors[status] || 'transparent' };
  };

  const handleArticleStatusUpdate = (id, status) => {
    let title = '';
    let message = '';
    let successMsg = '';
    let dialogType = 'info';

    if (status === 2) {
      title = 'Phê duyệt / Xuất bản bài viết';
      message = 'Bạn có chắc chắn muốn xuất bản bài viết này?';
      successMsg = 'Đã phê duyệt và xuất bản bài viết!';
    } else if (status === 3) {
      title = 'Từ chối bài viết';
      message = 'Bạn có chắc chắn muốn từ chối duyệt bài viết này?';
      successMsg = 'Đã từ chối bài viết.';
      dialogType = 'danger';
    } else if (status === 0) {
      title = 'Gỡ xuống bài viết';
      message = 'Gỡ xuống bài viết này?';
      successMsg = 'Đã gỡ bài viết về trạng thái bản nháp.';
      dialogType = 'warning';
    }

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type: dialogType,
      onConfirm: async () => {
        try {
          await adminUpdateArticleStatusAPI(id, status);
          toast.success(successMsg);
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

  const handleSendBulkNotification = async (e) => {
    e.preventDefault();
    if (!bulkNotifData.title || !bulkNotifData.message) {
      return toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận gửi thông báo',
      message: `Bạn có chắc chắn muốn gửi thông báo này tới ${bulkNotifData.target === 'all' ? 'tất cả người dùng' : bulkNotifData.target === 'students' ? 'tất cả học viên' : 'tất cả giảng viên'}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          setSendingBulkNotif(true);
          const token = localStorage.getItem('token');
          const { data } = await axios.post('http://localhost:5000/api/admin/notifications/bulk', bulkNotifData, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success(data.message);
          setBulkNotifData({ target: 'all', title: '', message: '' });
        } catch (error) {
          toast.error('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
          setSendingBulkNotif(false);
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
      case 'manage-courses': {
        const uniqueInstructors = Array.from(new Set(pendingCourses.map(c => c.instructor?.id)))
          .map(id => pendingCourses.find(c => c.instructor?.id === id)?.instructor)
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name));

        const uniqueCategories = Array.from(new Set(pendingCourses.map(c => c.category).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b));

        const filteredCourses = pendingCourses.filter(c => {
          const matchesInstructor = instructorFilter === 'all' || Number(c.instructorId) === Number(instructorFilter);
          const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
          return matchesInstructor && matchesCategory;
        });

        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">
                  {activeTab === 'approvals' ? 'Phê duyệt khóa học' : 'Quản lý khóa học'}
                  {courseTrashView && ' (Thùng rác)'}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
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
            </div>
            
            {!courseTrashView && activeTab === 'approvals' && (
                <p className="section-desc">Danh sách các khóa học đang chờ bạn kiểm duyệt nội dung.</p>
            )}
            
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
                            <th>
                              <div className="header-filter-wrapper">
                                <span>Giảng viên</span>
                                <select 
                                  className={`header-filter-select ${instructorFilter !== 'all' ? 'active' : ''}`}
                                  value={instructorFilter}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setInstructorFilter(e.target.value)}
                                >
                                  <option value="all">Tất cả</option>
                                  {uniqueInstructors.map(ins => (
                                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                                  ))}
                                </select>
                              </div>
                            </th>
                            <th>
                              <div className="header-filter-wrapper">
                                <span>Danh mục</span>
                                <select 
                                  className={`header-filter-select ${categoryFilter !== 'all' ? 'active' : ''}`}
                                  value={categoryFilter}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                  <option value="all">Tất cả</option>
                                  {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              </div>
                            </th>
                            <th>{courseTrashView ? 'Ngày xóa' : (activeTab === 'approvals' ? 'Ngày gửi' : 'Ngày xuất bản')}</th>
                            {!courseTrashView && activeTab === 'manage-courses' && <th>Học viên</th>}
                            {!courseTrashView && <th>Trạng thái</th>}
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
                                    <td><span className="course-category-badge">{course.category || 'Chưa phân loại'}</span></td>
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
                                <tr><td colSpan="5" className="empty-table-cell">Thùng rác trống</td></tr>
                            )
                        ) : (
                            filteredCourses.length > 0 ? filteredCourses.map(course => (
                                <tr key={course.id}>
                                    <td>
                                        <div className="course-cell">
                                            <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="admin-table-thumb" />
                                            <span>{course.title}</span>
                                        </div>
                                    </td>
                                    <td>{course.instructor?.name}</td>
                                    <td><span className="course-category-badge">{course.category || 'Chưa phân loại'}</span></td>
                                    <td>{new Date(course.updatedAt).toLocaleDateString('vi-VN')}</td>
                                    {activeTab === 'manage-courses' && <td>{course.studentsCount || 0}</td>}
                                    <td>
                                        <div className="inst-status-badge" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', textAlign: 'center', display: 'inline-block', whiteSpace: 'nowrap',
                                            background: Number(course.published) === 0 ? '#f3f4f6' : Number(course.published) === 1 ? '#fef3c7' : Number(course.published) === 2 ? '#dbeafe' : Number(course.published) === 3 ? '#fee2e2' : Number(course.published) === 4 ? '#ede9fe' : Number(course.published) === 5 ? '#d1fae5' : '#ffedd5',
                                            color: Number(course.published) === 0 ? '#6b7280' : Number(course.published) === 1 ? '#f59e0b' : Number(course.published) === 2 ? '#3b82f6' : Number(course.published) === 3 ? '#ef4444' : Number(course.published) === 4 ? '#8b5cf6' : Number(course.published) === 5 ? '#10b981' : '#f97316'
                                        }}>
                                            {Number(course.published) === 0 && 'Nháp'}
                                            {Number(course.published) === 1 && 'Chờ duyệt'}
                                            {Number(course.published) === 2 && 'Đã duyệt nội dung'}
                                            {Number(course.published) === 3 && 'Từ chối'}
                                            {Number(course.published) === 4 && 'Chờ xuất bản'}
                                            {Number(course.published) === 5 && 'Đã đăng'}
                                            {Number(course.published) === 6 && 'Đã gỡ'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button className="admin-btn view" onClick={() => handleReviewCourse(course.id)} title="Xem chi tiết">
                                                <Eye size={18} />
                                            </button>
                                            {activeTab === 'approvals' ? (
                                                <>
                                                    {[1, 3].includes(Number(course.published)) && (
                                                        <button className="admin-btn approve" onClick={() => handleStatusUpdate(course.id, 2)} title="Duyệt nội dung">
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {[1, 2].includes(Number(course.published)) && (
                                                        <button className="admin-btn reject" onClick={() => handleStatusUpdate(course.id, 3)} title="Từ chối">
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                    {Number(course.published) === 4 && (
                                                        <button className="admin-btn approve" onClick={() => handleStatusUpdate(course.id, 5)} title="Xuất bản">
                                                            <ArrowUpCircle size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {Number(course.published) === 6 && (
                                                        <button className="admin-btn approve" onClick={() => handleStatusUpdate(course.id, 5)} title="Xuất bản">
                                                            <ArrowUpCircle size={18} />
                                                        </button>
                                                    )}
                                                    {course.published === 5 && (
                                                        <button className="admin-btn reject" onClick={() => handleStatusUpdate(course.id, 6)} title="Gỡ xuống">
                                                            <ArrowDownCircle size={18} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-table-cell">
                                        {activeTab === 'approvals' ? 'Không có yêu cầu phê duyệt nào phù hợp' : 'Không có khóa học nào phù hợp'}
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
              </div>
          </div>
        );
      }
      case 'course-review': {
        if (reviewLoading) return <div className="admin-loading-container"><div className="admin-spinner"></div><p>Đang tải nội dung khóa học...</p></div>;
        if (!reviewCourseData) return null;

        const adminActions = (
          <>
            {[1, 2, 3].includes(Number(reviewCourseData.published)) && (
              <div className="admin-actions" style={{ display: 'flex', gap: '10px' }}>
                {[1, 3].includes(Number(reviewCourseData.published)) && (
                  <button className="admin-btn approve" style={{ flex: 1, padding: '10px' }} onClick={() => handleStatusUpdate(reviewCourseData.id, 2)}>Phê duyệt nội dung</button>
                )}
                {[1, 2].includes(Number(reviewCourseData.published)) && (
                  <button className="admin-btn reject" style={{ flex: 1, padding: '10px' }} onClick={() => handleStatusUpdate(reviewCourseData.id, 3)}>Từ chối</button>
                )}
              </div>
            )}
            {[4, 6].includes(Number(reviewCourseData.published)) && (
              <button className="admin-btn approve" style={{ width: '100%', padding: '10px' }} onClick={() => handleStatusUpdate(reviewCourseData.id, 5)}>Xuất bản khóa học</button>
            )}
            {reviewCourseData.published === 5 && (
              <button className="admin-btn reject" style={{ width: '100%', padding: '10px' }} onClick={() => handleStatusUpdate(reviewCourseData.id, 6)}>Gỡ xuống khóa học</button>
            )}
          </>
        );

        return (
          <CourseDetailView 
            courseData={reviewCourseData} 
            onBack={() => setActiveTab(lastCourseTab)} 
            actions={adminActions}
            isReviewMode={true}
          />
        );
      }
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
                        {filteredUsers.length > 0 ? filteredUsers.map(u => {
                            const formattedId = u.role === 'student' ? `HV-${String(u.id).padStart(4, '0')}` : `GV-${String(u.id).padStart(4, '0')}`;
                            return (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '600', color: '#6366f1' }}>{formattedId}</td>
                                    <td className="user-name-cell">{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <span className="status-badge active">Hoạt động</span>
                                            <button 
                                                className="admin-btn view" 
                                                title="Xem chi tiết"
                                                onClick={() => handleViewUser(u)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="5" className="empty-table-cell">Không có dữ liệu người dùng</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'bulk-notification':
        return (
          <div className="admin-content-fade-in">
            <h2 className="content-title">Gửi thông báo hàng loạt</h2>
            <div className="notification-form-container">
                <form onSubmit={handleSendBulkNotification} className="admin-form bulk-notif-form">
                    <div className="form-group">
                        <label>Đối tượng nhận thông báo</label>
                        <select 
                            value={bulkNotifData.target}
                            onChange={(e) => setBulkNotifData({...bulkNotifData, target: e.target.value})}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white' }}
                        >
                            <option value="all">Tất cả người dùng</option>
                            <option value="students">Tất cả Học viên</option>
                            <option value="instructors">Tất cả Giảng viên</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tiêu đề thông báo</label>
                        <input 
                            type="text" 
                            placeholder="Nhập tiêu đề ngắn gọn..."
                            value={bulkNotifData.title}
                            onChange={(e) => setBulkNotifData({...bulkNotifData, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nội dung thông báo</label>
                        <textarea 
                            placeholder="Nhập nội dung chi tiết thông báo..."
                            value={bulkNotifData.message}
                            onChange={(e) => setBulkNotifData({...bulkNotifData, message: e.target.value})}
                            rows="6"
                            required
                        />
                    </div>

                    <div className="form-submit-footer">
                        <button 
                            type="submit" 
                            className="btn-submit" 
                            disabled={sendingBulkNotif}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: 'auto', padding: '12px 30px' }}
                        >
                            {sendingBulkNotif ? 'Đang gửi...' : <><Send size={18} /> Gửi thông báo ngay</>}
                        </button>
                    </div>
                </form>

                <div className="bulk-notif-preview">
                    <h3>Xem trước khi gửi</h3>
                    <div className="preview-card">
                        <div className="preview-header">
                            <Bell size={20} color="#6366f1" />
                            <span className="preview-title">{bulkNotifData.title || '(Tiêu đề thông báo)'}</span>
                        </div>
                        <div className="preview-body">
                            {bulkNotifData.message || 'Nội dung thông báo sẽ hiển thị ở đây. Hãy nhập nội dung vào form bên cạnh để xem trước.'}
                        </div>
                        <div className="preview-footer">
                            Vừa xong • EduCore Admin
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'categories':
        return <CategoryManager setConfirmDialog={setConfirmDialog} />;
      case 'applications':
        return <InstructorApplications setConfirmDialog={setConfirmDialog} />;
      case 'banners':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">{bannerTrashView ? 'Thùng rác Banners' : 'Quản lý Banners'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="add-btn"
                      style={{ background: '#f3f4f6', color: '#4b5563' }}
                      onClick={() => {
                        setBannerTrashView(!bannerTrashView);
                        if (!bannerTrashView) fetchTrashBanners();
                      }}
                    >
                      {bannerTrashView ? 'Quay lại' : <><Trash2 size={18} /> Thùng rác</>}
                    </button>
                    {!bannerTrashView && (
                      <button className="add-btn primary" onClick={() => openBannerModal()}>
                          <Plus size={18} /> Thêm Banner mới
                      </button>
                    )}
                </div>
            </div>
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Banner</th>
                            <th>Tag</th>
                            <th>Liên kết</th>
                            <th>{bannerTrashView ? 'Ngày xóa' : 'Thứ tự'}</th>
                            {!bannerTrashView && <th>Trạng thái</th>}
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bannerTrashView ? (
                          trashBanners.length > 0 ? trashBanners.map(banner => (
                            <tr key={banner.id}>
                                <td>
                                    <div className="banner-cell">
                                        <div className="banner-thumb-wrapper" style={{ background: banner.gradient }}>
                                            {banner.imageUrl && <img src={banner.imageUrl} alt="" />}
                                        </div>
                                        <div className="banner-info-cell">
                                            <span className="banner-title-text">{banner.title}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="banner-tag-badge">{banner.tag}</span></td>
                                <td>—</td>
                                <td>{new Date(banner.deletedAt).toLocaleDateString('vi-VN')}</td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn approve" onClick={() => handleRestoreBanner(banner.id)} title="Phục hồi">
                                            Phục hồi
                                        </button>
                                        <button className="admin-btn reject" onClick={() => handleForceDeleteBanner(banner.id)} title="Xóa vĩnh viễn">
                                            <XCircle size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="5" className="empty-table-cell">Thùng rác trống</td></tr>
                          )
                        ) : (
                          banners.length > 0 ? banners.map(banner => (
                            <tr key={banner.id}>
                                <td>
                                    <div className="banner-cell">
                                        <div className="banner-thumb-wrapper" style={{ background: banner.gradient }}>
                                            {banner.imageUrl && <img src={banner.imageUrl} alt="" />}
                                        </div>
                                        <div className="banner-info-cell">
                                            <span className="banner-title-text">{banner.title}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="banner-tag-badge">{banner.tag}</span></td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {banner.linkType === 'course' ? '📚 Khóa học' : banner.linkType === 'article' ? '📝 Bài viết' : '—'}
                                </td>
                                <td>{banner.sortOrder}</td>
                                <td>
                                    <span className={`status-badge ${banner.isActive ? 'active' : 'draft'}`}>
                                        {banner.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn view" onClick={() => openBannerModal(banner)} title="Sửa">
                                            <Pencil size={18} />
                                        </button>
                                        {banner.isActive ? (
                                            <button className="admin-btn reject" title="Gỡ xuống" onClick={() => handleBannerToggle(banner.id, banner.isActive)}>
                                                <ArrowDownCircle size={18} />
                                            </button>
                                        ) : (
                                            <>
                                                <button className="admin-btn approve" title="Đăng lên" onClick={() => handleBannerToggle(banner.id, banner.isActive)}>
                                                    <ArrowUpCircle size={18} />
                                                </button>
                                                <button className="admin-btn reject" title="Xóa" onClick={() => handleBannerDelete(banner.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="6" className="empty-table-cell">Chưa có banner nào</td></tr>
                          )
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
                                {(!art.authorId || art.authorId === user.id) && (
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
                                )}
                                <button className="admin-btn view" onClick={() => window.open(`/articles/${art.id}`, '_blank')} title="Xem">
                                  <Eye size={18} />
                                </button>
                                {art.articleStatus === 2 ? (
                                  <button className="admin-btn reject" title="Gỡ xuống" onClick={() => handleArticleStatusUpdate(art.id, 0)}>
                                    <ArrowDownCircle size={18} />
                                  </button>
                                ) : (
                                  <>
                                    <button className="admin-btn approve" title="Xuất bản" onClick={() => handleArticleStatusUpdate(art.id, 2)}>
                                      <CheckCircle size={18} />
                                    </button>
                                    <button className="admin-btn reject" title="Xóa" onClick={() => handleArticleDelete(art.id)}>
                                      <XCircle size={18} />
                                    </button>
                                  </>
                                )}
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
      case 'user-detail':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  className="add-btn" 
                  style={{ background: '#f3f4f6', color: '#4b5563', padding: '8px 12px' }}
                  onClick={() => setActiveTab(lastUserTab)}
                >
                  <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} /> Quay lại
                </button>
                <h2 className="content-title" style={{ margin: 0 }}>
                    Chi tiết {selectedUserDetails?.role === 'instructor' ? 'Giảng Viên' : 'Học Viên'}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                  <span className={`status-badge active`}>Đang hoạt động</span>
              </div>
            </div>

            {loadingUserDetail ? (
                <div className="loading-detail" style={{ minHeight: '400px' }}>
                    <div className="spinner"></div>
                    <p>Đang tải thông tin chi tiết...</p>
                </div>
            ) : selectedUserDetails ? (
                <div className="user-detail-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div className="user-profile-header">
                        <div className="user-detail-avatar">
                            {selectedUserDetails.avatar ? <img src={selectedUserDetails.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : selectedUserDetails.name.charAt(0)}
                        </div>
                        <div className="user-main-info">
                            <h2>{selectedUserDetails.name}</h2>
                            <div className="user-metadata">
                                <div className="meta-item">
                                    <FileText size={16} />
                                    <span>ID: {selectedUserDetails.role === 'student' ? `HV-${String(selectedUserDetails.id).padStart(4, '0')}` : `GV-${String(selectedUserDetails.id).padStart(4, '0')}`}</span>
                                </div>
                                <div className="meta-item">
                                    <Bell size={16} />
                                    <span>Email: {selectedUserDetails.email}</span>
                                </div>
                                <div className="meta-item">
                                    <CheckCircle size={16} />
                                    <span>Ngày tham gia: {new Date(selectedUserDetails.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="user-detail-sections">
                        <div className="detail-section">
                            <h3 className="detail-section-title">
                                <BookOpen size={18} /> {selectedUserDetails.role === 'instructor' ? 'Khóa học đã xuất bản' : 'Khóa học đã đăng ký'} ({selectedUserDetails.role === 'instructor' ? (selectedUserDetails.instructedCourses?.length || 0) : (selectedUserDetails.Enrollments?.length || 0)})
                            </h3>
                            <div className="detail-courses-grid">
                                {selectedUserDetails.role === 'instructor' ? (
                                    selectedUserDetails.instructedCourses?.length > 0 ? selectedUserDetails.instructedCourses.map(course => (
                                        <div key={course.id} className="mini-course-card">
                                            <img src={course.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="mini-thumb" />
                                            <div className="mini-course-info">
                                                <span className="mini-course-name">{course.title}</span>
                                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '4px' }}>
                                                    <span className={`mini-status-tag ${course.published === 2 ? 'published' : 'draft'}`}>
                                                        {course.published === 2 ? 'Đã xuất bản' : 'Nháp'}
                                                    </span>
                                                    <span className="course-category-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                        {course.category || 'Chưa phân loại'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="empty-mini-list">Chưa có khóa học nào xuất bản</p>
                                    )
                                ) : (
                                    selectedUserDetails.Enrollments?.length > 0 ? selectedUserDetails.Enrollments.map(en => (
                                        <div key={en.id} className="mini-course-card">
                                            <img src={en.Course?.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="mini-thumb" />
                                            <div className="mini-course-info">
                                                <span className="mini-course-name">{en.Course?.title}</span>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                    <span className="mini-course-price">{en.Course?.price?.toLocaleString('vi-VN')}đ</span>
                                                    <span className="course-category-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                        {en.Course?.category || 'Chưa phân loại'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="empty-mini-list">Chưa đăng ký khóa học nào</p>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Articles Section */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">
                                <FileText size={18} /> Bài viết đã đăng ({selectedUserDetails.articles?.length || 0})
                            </h3>
                            <div className="detail-articles-grid">
                                {selectedUserDetails.articles?.length > 0 ? selectedUserDetails.articles.map(article => (
                                    <div key={article.id} className="mini-article-card">
                                        <img src={article.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="mini-article-thumb" />
                                        <div className="mini-article-info">
                                            <span className="mini-article-title">{article.title}</span>
                                            <span className={`mini-status-tag ${article.articleStatus === 2 ? 'published' : 'draft'}`}>
                                                {article.articleStatus === 2 ? 'Đã đăng' : 'Chờ duyệt'}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="empty-mini-list">Chưa có bài viết nào</p>
                                )}
                            </div>
                        </div>

                        {/* Payment History (Only for Students) */}
                        {selectedUserDetails.role !== 'instructor' && (
                            <div className="detail-section">
                                <h3 className="detail-section-title">
                                    <Layers size={18} /> Lịch sử thanh toán ({selectedUserDetails.PaymentOrders?.filter(o => o.Payments?.some(p => p.status === 'success' || p.status === 'refunded')).length || 0})
                                </h3>
                                <div className="mini-table-wrapper">
                                    <table className="mini-table">
                                        <thead>
                                            <tr>
                                                <th>Khóa học</th>
                                                <th>Giá tiền</th>
                                                <th>Ngày</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const filteredOrders = selectedUserDetails.PaymentOrders?.filter(order => {
                                                    return order.Payments?.some(p => p.status === 'success' || p.status === 'refunded');
                                                }) || [];

                                                return filteredOrders.length > 0 ? filteredOrders.map(order => {
                                                    const successfulPayment = order.Payments?.find(p => p.status === 'success' || p.status === 'refunded');
                                                    const pStatus = successfulPayment?.status;
                                                    
                                                    return (
                                                        <tr key={order.id}>
                                                            <td style={{ fontWeight: '500' }}>{order.Course?.title}</td>
                                                            <td>{order.Course?.price?.toLocaleString('vi-VN')}đ</td>
                                                            <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                                            <td>
                                                                <span className={`payment-status-pill ${pStatus === 'success' ? 'completed' : 'refunded'}`}>
                                                                    {pStatus === 'success' ? 'Thành công' : 'Đã hoàn tiền'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                }) : (
                                                    <tr>
                                                        <td colSpan="4" className="empty-table-row">
                                                            Chưa có lịch sử giao dịch
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
          </div>
        );

      case 'revenue-policy':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">Chính sách Doanh thu</h2>
                <button className="add-btn primary" onClick={() => {
                  setRevenueData({
                    courseId: '',
                    type: 'PERCENT',
                    instructorPercent: 0,
                    fixedAmount: 0,
                  });
                  setEditingRevenuePolicyId(null);
                  fetchBannerLinkData(); // Reuse this to get courses
                  setShowRevenueModal(true);
                }}>
                    <Plus size={18} /> Tạo chính sách mới
                </button>
            </div>
            <p className="section-desc">Quản lý cách phân chia doanh thu giữa hệ thống và giảng viên.</p>
            
            <div className="filters-bar" style={{ marginBottom: '20px' }}>
                <div className="search-wrapper" style={{ position: 'relative', maxWidth: '400px' }}>
                    <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Tìm theo tên khóa học..." 
                        style={{ paddingLeft: '40px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', height: '42px' }}
                        value={revenueSearch}
                        onChange={(e) => setRevenueSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Khóa học</th>
                    <th>Loại</th>
                    <th>Người tạo</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {revenuePolicies.length > 0 ? revenuePolicies.map(policy => (
                    <tr key={policy.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{policy.course?.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GV: {policy.instructor?.name || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                          {policy.type === 'PERCENT' ? 'Phần trăm' : policy.type === 'FIXED' ? 'Cố định' : 'Hỗn hợp'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          {policy.creator?.name || 'Admin'}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${policy.status === 'accepted' ? 'active' : policy.status === 'rejected' ? 'rejected' : policy.status === 'draft' ? 'draft' : 'pending'}`}>
                          {policy.status === 'draft' && 'Bản nháp'}
                          {policy.status === 'waiting_confirm' && 'Chờ xác nhận'}
                          {policy.status === 'accepted' && 'Đã chấp nhận'}
                          {policy.status === 'rejected' && 'Đã từ chối'}
                          {policy.status === 'waiting_delete' && 'Chờ xác nhận xóa'}
                        </span>
                      </td>
                      <td>{new Date(policy.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="admin-actions">
                          <button 
                            className="admin-btn view" 
                            title="Xem chi tiết"
                            onClick={() => {
                              setSelectedRevenuePolicy(policy);
                              setShowRevenuePolicyDetail(true);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          
                          {(policy.status === 'draft' || policy.status === 'rejected') && (
                            <>
                              <button 
                                className="admin-btn edit" 
                                title="Sửa chính sách"
                                onClick={() => handleRevenuePolicyAction(policy.id, 'edit')}
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                className="admin-btn approve" 
                                title="Gửi cho giảng viên"
                                onClick={() => handleRevenuePolicyAction(policy.id, 'send')}
                              >
                                <Send size={16} />
                              </button>
                            </>
                          )}

                          {policy.status === 'waiting_confirm' && (
                            <button 
                              className="admin-btn reject" 
                              title="Thu hồi chính sách"
                              onClick={() => handleRevenuePolicyAction(policy.id, 'revoke')}
                            >
                              <ArrowLeft size={16} />
                            </button>
                          )}

                          {policy.status === 'accepted' && (
                            <button 
                              className="admin-btn reject" 
                              title="Yêu cầu xóa"
                              onClick={() => handleRevenuePolicyAction(policy.id, 'request_delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {policy.status === 'waiting_delete' && (
                             <button 
                                className="admin-btn approve" 
                                title="Hủy yêu cầu xóa"
                                onClick={() => handleRevenuePolicyAction(policy.id, 'accept')}
                             >
                                <ArrowLeft size={16} />
                             </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="empty-table-cell">Không có chính sách nào được tìm thấy</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'edit-requests':
        return (
          <div className="admin-content-fade-in">
            <div className="section-header">
                <h2 className="content-title">Yêu cầu chỉnh sửa khóa học</h2>
            </div>
            <p className="section-desc">Giảng viên yêu cầu chỉnh sửa khóa học đã xuất bản.</p>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Giảng viên</th>
                    <th>Khóa học</th>
                    <th>Lý do</th>
                    <th>Ngày yêu cầu</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {editRequests.length > 0 ? editRequests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '600' }}>{req.instructor?.name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.instructor?.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>{req.course?.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phiên bản hiện tại: v{req.course?.version}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</p>
                      </td>
                      <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <button 
                          className="admin-btn view" 
                          onClick={() => {
                            setSelectedEditRequest(req);
                            setIsReviewRequestModalOpen(true);
                          }}
                        >
                          Xem & Phê duyệt
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="empty-table-cell">Không có yêu cầu nào đang chờ</td></tr>
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
                    <div 
                        key={notif.id} 
                        className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                        onClick={() => handleNotificationClick(notif)}
                        style={{ ...getNotifStyle(notif), cursor: 'pointer' }}
                    >
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
            const isCoursesItem = item.id === 'courses';
            const isItemMenuOpen = isUsersItem ? isUsersMenuOpen : (isArticlesItem ? isArticlesMenuOpen : (isCoursesItem ? isCoursesMenuOpen : false));
            
            const isTabActive = activeTab === item.id || 
              (isUsersItem && (activeTab === 'students' || activeTab === 'instructors' || activeTab === 'user-detail' || activeTab === 'bulk-notification')) ||
              (isCoursesItem && (activeTab === 'manage-courses' || activeTab === 'approvals')) ||
              (isArticlesItem && (activeTab === 'all-articles' || activeTab === 'my-articles' || activeTab === 'review-articles'));

            return (
              <div key={item.id} className="nav-group">
                <button
                  className={`nav-item ${isTabActive ? 'active' : ''}`}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      if (isUsersItem) setIsUsersMenuOpen(!isUsersMenuOpen);
                      if (isArticlesItem) setIsArticlesMenuOpen(!isArticlesMenuOpen);
                      if (isCoursesItem) setIsCoursesMenuOpen(!isCoursesMenuOpen);
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

        {/* Create/Edit Banner Modal */}
        {showBannerModal && (
            <div className="admin-modal-overlay">
                <div className="admin-modal-content">
                    <div className="modal-header">
                        <h3>{editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner Mới'}</h3>
                        <button className="close-modal" onClick={() => { setShowBannerModal(false); setEditingBanner(null); setNewBanner({ ...defaultBanner }); }}><X size={20} /></button>
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
                                 <label>
                                     Thứ tự hiển thị 
                                     {banners.some(b => b.sortOrder === newBanner.sortOrder && b.id !== editingBanner?.id) && (
                                         <span style={{ color: '#0ea5e9', marginLeft: '8px', fontSize: '0.75rem', fontWeight: '400' }}>(Số này đang dùng - sẽ tự động đẩy các banner khác xuống)</span>
                                     )}
                                 </label>
                                 <input 
                                     type="number" 
                                     value={newBanner.sortOrder} 
                                     onChange={(e) => setNewBanner({...newBanner, sortOrder: parseInt(e.target.value) || 1})} 
                                     min="1"
                                     required
                                 />
                                 <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                                     Số đã dùng: {banners.length > 0 ? banners.map(b => b.sortOrder).sort((a, b) => a - b).join(', ') : 'Chưa có'}
                                 </div>
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

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Liên kết đến</label>
                                <select
                                    value={newBanner.linkType || ''}
                                    onChange={(e) => setNewBanner({...newBanner, linkType: e.target.value, linkId: null})}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: 'white' }}
                                >
                                    <option value="">Không liên kết</option>
                                    <option value="course">Khóa học</option>
                                    <option value="article">Bài viết</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>{newBanner.linkType === 'course' ? 'Chọn khóa học' : newBanner.linkType === 'article' ? 'Chọn bài viết' : 'Chọn nội dung'}</label>
                                <select
                                    value={newBanner.linkId || ''}
                                    onChange={(e) => setNewBanner({...newBanner, linkId: e.target.value ? parseInt(e.target.value) : null})}
                                    disabled={!newBanner.linkType}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem', background: newBanner.linkType ? 'white' : '#f1f5f9' }}
                                >
                                    <option value="">{newBanner.linkType ? '-- Chọn --' : '-- Chọn loại liên kết trước --'}</option>
                                    {newBanner.linkType === 'course' && bannerLinkCourses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                    {newBanner.linkType === 'article' && bannerLinkArticles.map(a => (
                                        <option key={a.id} value={a.id}>{a.title}</option>
                                    ))}
                                </select>
                            </div>
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
                                    {uploadingBanner ? 'Đang tải lên...' : newBanner.imageUrl ? 'Đổi ảnh' : 'Nhấn để chọn ảnh'}
                                </label>
                                {newBanner.imageUrl && <img src={newBanner.imageUrl} alt="" className="modal-preview-img" />}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-cancel" onClick={() => { setShowBannerModal(false); setEditingBanner(null); setNewBanner({ ...defaultBanner }); }}>Hủy</button>
                            <button type="submit" className="btn-submit" disabled={uploadingBanner}>{editingBanner ? 'Cập nhật' : 'Tạo Banner'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Edit Request Review Modal */}
        {isReviewRequestModalOpen && selectedEditRequest && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content" style={{ maxWidth: '600px' }}>
              <div className="modal-header">
                <h3>Phê duyệt yêu cầu chỉnh sửa</h3>
                <button onClick={() => setIsReviewRequestModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div className="review-info-section" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Khóa học:</label>
                  <p style={{ margin: 0 }}>{selectedEditRequest.course?.title} (v{selectedEditRequest.course?.version})</p>
                </div>
                <div className="review-info-section" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Lý do chỉnh sửa:</label>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {selectedEditRequest.reason}
                  </div>
                </div>
                <div className="review-info-section" style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '4px' }}>Tóm tắt thay đổi:</label>
                  <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    {selectedEditRequest.contentSummary}
                  </div>
                </div>
                <div className="review-info-section">
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                    * Khi phê duyệt, hệ thống sẽ tạo một bản sao v{selectedEditRequest.course?.version + 1} làm Bản nháp cho giảng viên. Khóa học hiện tại vẫn sẽ được hiển thị cho sinh viên cho đến khi bản mới được duyệt và xuất bản.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => handleEditRequestStatus(selectedEditRequest.id, 'rejected')}>Từ chối</button>
                <button className="btn-submit" onClick={() => handleEditRequestStatus(selectedEditRequest.id, 'approved')}>Duyệt & Tạo bản sao</button>
              </div>
            </div>
          </div>
        )}

        {/* Diff Comparison Modal */}
        {isDiffModalOpen && diffData && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content" style={{ maxWidth: '90%', width: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header">
                <h3>So sánh thay đổi (v{diffData.v1.version} vs v{diffData.v2.version})</h3>
                <button onClick={() => setIsDiffModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <div className="diff-container">
                  <div className="diff-section">
                    <h4>Thông tin chung</h4>
                    <table className="diff-table">
                      <thead>
                        <tr>
                          <th>Trường</th>
                          <th>Cũ (v{diffData.v1.version})</th>
                          <th>Mới (v{diffData.v2.version})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Tiêu đề', field: 'title' },
                          { label: 'Mô tả ngắn', field: 'subtitle' },
                          { label: 'Giá', field: 'price' },
                          { label: 'Danh mục', field: 'category' }
                        ].map(item => {
                          const isChanged = diffData.v1[item.field] !== diffData.v2[item.field];
                          return (
                            <tr key={item.field} className={isChanged ? 'row-changed' : ''}>
                              <td>{item.label}</td>
                              <td className="old-val">{diffData.v1[item.field]}</td>
                              <td className={isChanged ? 'new-val highlight' : 'new-val'}>{diffData.v2[item.field]}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="diff-section" style={{ marginTop: '30px' }}>
                    <h4>Cấu trúc chương trình học</h4>
                    <div className="diff-curriculum">
                      {diffData.v2.chapters.map((chapter, cIdx) => {
                        const oldChapter = diffData.v1.chapters.find(c => c.chapterOrder === chapter.chapterOrder);
                        const isChapterNew = !oldChapter;
                        const isTitleChanged = oldChapter && oldChapter.title !== chapter.title;

                        return (
                          <div key={chapter.id} className={`diff-chapter ${isChapterNew ? 'added' : ''}`}>
                            <div className="chapter-header">
                              <span className="chapter-order">Chương {chapter.chapterOrder}:</span>
                              <span className={isTitleChanged ? 'highlight' : ''}>{chapter.title}</span>
                              {isChapterNew && <span className="diff-tag added">MỚI</span>}
                            </div>
                            <div className="chapter-lessons">
                              {chapter.lessons.map(lesson => {
                                const oldLesson = oldChapter?.lessons.find(l => l.lessonOrder === lesson.lessonOrder);
                                const isLessonNew = !oldLesson;
                                const isLessonChanged = oldLesson && (oldLesson.title !== lesson.title || oldLesson.content !== lesson.content || oldLesson.videoUrl !== lesson.videoUrl);

                                return (
                                  <div key={lesson.id} className={`diff-lesson ${isLessonNew ? 'added' : isLessonChanged ? 'modified' : ''}`}>
                                    <div className="lesson-info">
                                      <span className="lesson-order">{lesson.lessonOrder}.</span>
                                      <span className={isLessonChanged && oldLesson.title !== lesson.title ? 'highlight' : ''}>{lesson.title}</span>
                                      {isLessonNew && <span className="diff-tag added">MỚI</span>}
                                      {isLessonChanged && <span className="diff-tag modified">SỬA</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setIsDiffModalOpen(false)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
        {/* Revenue Policy Modal */}
        {showRevenueModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-content" style={{ maxWidth: '700px' }}>
              <div className="modal-header">
                <h3>Tạo Chính sách Doanh thu</h3>
                <button onClick={() => setShowRevenueModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleRevenueSubmit}>
                <div className="modal-body" style={{ padding: '20px' }}>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Chọn Khóa học</label>
                    <select 
                      required 
                      className="modal-input"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      value={revenueData.courseId}
                      onChange={(e) => setRevenueData({ ...revenueData, courseId: e.target.value })}
                    >
                      <option value="">-- Chọn khóa học --</option>
                      {bannerLinkCourses
                        .filter(c => Number(c.published) === 2)
                        .map(course => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Loại chính sách</label>
                    <select 
                      className="modal-input"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      value={revenueData.type}
                      onChange={(e) => setRevenueData({ ...revenueData, type: e.target.value })}
                    >
                      <option value="PERCENT">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (đ)</option>
                      <option value="HYBRID">Hỗn hợp (Phần trăm + Cố định)</option>
                    </select>
                  </div>

                  {(revenueData.type === 'PERCENT' || revenueData.type === 'HYBRID') && (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phần trăm doanh thu (%)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        max="100"
                        className="modal-input" 
                        value={revenueData.instructorPercent}
                        onChange={(e) => setRevenueData({ ...revenueData, instructorPercent: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        placeholder="%"
                      />
                    </div>
                  )}

                  {(revenueData.type === 'FIXED' || revenueData.type === 'HYBRID') && (
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Số tiền cố định (VNĐ)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        className="modal-input" 
                        value={revenueData.fixedAmount}
                        onChange={(e) => setRevenueData({ ...revenueData, fixedAmount: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        placeholder="Nhập số tiền (vd: 5000000)"
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ gap: '10px', backgroundColor: 'white', margin: '0' }}>
                  <button type="button" className="btn-cancel" onClick={() => setShowRevenueModal(false)}>Hủy</button>
                  <button type="button" className="btn-submit draft-submit" onClick={(e) => handleRevenueSubmit(e, false)}>Lưu</button>
                  <button type="button" className="btn-submit send-submit" onClick={(e) => handleRevenueSubmit(e, true)}>Gửi ngay</button>
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

      <RevenuePolicyDetail 
        isOpen={showRevenuePolicyDetail}
        onClose={() => setShowRevenuePolicyDetail(false)}
        policy={selectedRevenuePolicy}
        userRole="admin"
        onAction={handleRevenuePolicyAction}
      />
    </div>
  );
};

export default AdminDashboard;
