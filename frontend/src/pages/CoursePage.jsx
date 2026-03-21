import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FaPlayCircle, FaLock, FaRegClock, FaGlobe, FaCertificate, FaAngleDown, FaAngleUp, FaArrowLeft } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import './CoursePage.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

import { fetchCurriculumAPI, fetchCourseReviewsAPI, addCourseReviewAPI } from '../services/courseService';
import toast from 'react-hot-toast';
import { FaStar, FaRegStar } from 'react-icons/fa';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChapters, setActiveChapters] = useState([]); // Mở danh sách bài học sau

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await fetchCurriculumAPI(id);
        
         // Logic mới: Không tự động chuyển hướng nữa để user có thể xem review
         // Nhưng ta vẫn cần lưu trạng thái enrolled
 
         setCourse(data);
         loadReviews(id);
         // Default open the first chapter
         if (data.chapters && data.chapters.length > 0) {
           setActiveChapters([data.chapters[0].id]);
         }
         setLoading(false);
       } catch (err) {
         setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
         setLoading(false);
       }
     };
     fetchCourse();
   }, [id]);
 
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
 
  const loadReviews = async (courseId, pageNum = 1) => {
    try {
      if (pageNum === 1) setLoadingReviews(true);
      else setLoadingMoreReviews(true);

      const res = await fetchCourseReviewsAPI(courseId, pageNum, 10);
      
      if (pageNum === 1) {
        setReviews(res.data.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(res.data.reviews || [])]);
      }
      
      setReviewsPage(pageNum);
      setHasMoreReviews(pageNum < (res.data.totalPages || 1));
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoadingReviews(false);
      setLoadingMoreReviews(false);
    }
  };

  const handleReviewsScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMoreReviews && !loadingMoreReviews && !loadingReviews && reviewsPage) {
        loadReviews(id, reviewsPage + 1);
      }
    }
  };
 
  const toggleChapter = (chapterId) => {
    setActiveChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(c => c !== chapterId) 
        : [...prev, chapterId]
    );
  };

  const handleEnroll = async () => {
    if (!user) {
      const firstLessonLink = course.chapters?.[0]?.lessons?.[0] 
        ? `/learn/${course.id}/lesson/${course.chapters[0].lessons[0].id}`
        : '#';
      navigate('/login', { 
        state: { 
          returnUrl: course.price === 0 ? firstLessonLink : `/checkout/${course.id}`,
          action: course.price === 0 ? 'enroll_free' : 'checkout',
          courseId: course.id
        } 
      });
      return;
    }

    if (course.price === 0) {
      try {
        await axios.post(`http://localhost:5000/api/courses/${course.id}/enroll`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const firstLessonLink = course.chapters?.[0]?.lessons?.[0] 
          ? `/learn/${course.id}/lesson/${course.chapters[0].lessons[0].id}`
          : '#';
        navigate(firstLessonLink);
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi khi đăng ký khóa học');
      }
    } else {
      navigate(`/checkout/${course.id}`);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!course) return null;

  // Calculate total lessons dynamically
  const totalLessons = course?.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;
  const isCompleted = course?.progressPercent === 100;
  // Use course.previewVideoUrl, fallback to first lesson, then fallback to dummy video
  let previewVideoUrl = course.previewVideoUrl || 
                          (course.chapters && course.chapters[0] && course.chapters[0].lessons[0] 
                            ? course.chapters[0].lessons[0].videoUrl 
                            : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  
  if (previewVideoUrl && previewVideoUrl.startsWith('http://')) {
    previewVideoUrl = previewVideoUrl.replace('http://', 'https://');
  }
  
  return (
    <div className="course-detail-container">
      <div className="course-main-body container">
        {/* LEFT COLUMN - CONTENT */}
        <div className="course-left-column">

          {/* Moved from Header Banner */}
          <div className="course-header-content">
            <button 
              className="btn-back-home" 
              onClick={() => navigate('/')}
            >
              <FaArrowLeft /> Quay lại trang chủ
            </button>
            <div className="breadcrumb">
              <Link to="/">Trang chủ</Link> <span>/</span>               <span>Khóa học</span> <span>/</span> 
              <span className="current">{course.category || 'Phát triển Web'}</span>
            </div>
            <h1 className="course-main-title">{course.title}</h1>
            <p className="course-short-desc">{course.description}</p>
            <div className="course-meta">
              <span className="rating">⭐ {course.rating || 4.8} ({course.studentsCount || 0} học viên)</span>
              <span className="instructor">Giảng viên: <strong>{course.instructor?.name || 'Giảng viên'}</strong></span>
            </div>
          </div>
          
          <div className="course-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Nội dung khóa học</h2>
            <div className="curriculum-stats">
              <span>{course.chapters?.length || 0} chương</span> • 
              <span> {totalLessons} bài học</span> • 
              <span> {course.videoCount || 0} bài học video</span> •
              <span> {course.quizCount || 0} bài kiểm tra</span>
            </div>

            <div className="curriculum-accordion">
              {course.chapters && course.chapters.map((chapter) => {
                const isOpen = activeChapters.includes(chapter.id);
                return (
                  <div key={chapter.id} className={`chapter-item ${isOpen ? 'open' : ''}`}>
                    <div 
                      className="chapter-header" 
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <div className="chapter-title-group">
                        {isOpen ? <FaAngleUp /> : <FaAngleDown />}
                        <h3>{chapter.title}</h3>
                      </div>
                      <span className="chapter-meta">
                        {chapter.lessons ? chapter.lessons.length : 0} bài học
                      </span>
                    </div>

                    {isOpen && chapter.lessons && (
                      <div className="chapter-body">
                        {chapter.lessons.map(lesson => (
                          <div key={lesson.id} className="lesson-item">
                            <div className="lesson-title-group">
                              {lesson.isFree ? (
                                <FaPlayCircle className="icon-play" />
                              ) : (
                                <FaLock className="icon-lock" />
                              )}
                              <span className={lesson.isFree ? 'text-free' : 'text-locked'}>
                                {lesson.title}
                              </span>
                            </div>
                            <div className="lesson-meta-group">
                              {lesson.isFree && <span className="badge-preview">Học thử</span>}
                              <span className="lesson-duration">{lesson.duration || '00:00'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
 
          {/* Reviews Section */}
          <div className="course-section reviews-section">
            <h2 className="section-title">Đánh giá từ người học</h2>
            
            {course.isEnrolled && isCompleted && (
              <div className="write-review-prompt">
                <div className="prompt-content">
                  <h3>Bạn thấy khóa học này thế nào?</h3>
                  <p>Chia sẻ cảm nhận của bạn để giúp các học viên khác nhé!</p>
                </div>
                <button 
                  className="btn-go-to-review" 
                  onClick={() => navigate(`/course/${id}/review`)}
                >
                  <FaStar style={{ marginRight: '8px' }} /> Viết đánh giá
                </button>
              </div>
            )}
 
            <div className="reviews-list" onScroll={handleReviewsScroll}>
              {reviews.length === 0 ? (
                <p className="no-reviews">Chưa có đánh giá nào cho khóa học này.</p>
              ) : (
                <>
                  {reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <img src={review.user?.avatar || "https://i.pravatar.cc/150"} alt="avatar" className="review-avatar" />
                      <div className="review-content">
                        <div className="review-user-name">{review.user?.name}</div>
                        <div className="review-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={review.rating >= s ? 'star active' : 'star'}>
                              <FaStar />
                            </span>
                          ))}
                        </div>
                        <p className="review-text">{review.comment}</p>
                        <span className="review-date">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  ))}
                  {loadingMoreReviews && (
                    <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--brand-primary)' }}>
                      <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
 
        </div>

        {/* RIGHT COLUMN - SIDEBAR PAYMENT */}
        <div className="course-right-sidebar">
          
          {/* VIDEO LÊN ĐẦU, NGOÀI BOX MUA HÀNG */}
          <div className="sidebar-video-section">
            <div className="video-player-wrapper">
              <video 
                src={previewVideoUrl} 
                controls
                width="100%"
                height="100%"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />
            </div>
          </div>

          <div className="purchase-card sticky">
            <div className="price-container">
              <h2 className="current-price">{course.price === 0 ? 'Miễn phí' : formatCurrency(course.price || 0)}</h2>
              {course.price > 0 && <span className="original-price">{formatCurrency(course.price * 1.5)}</span>}
              {course.price > 0 && <span className="discount-badge">Giảm giá</span>}
            </div>

            <button 
              onClick={handleEnroll} 
               className="btn-enroll primary" 
               style={{ display: 'block', width: '100%', textAlign: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
             >
               {course.isEnrolled ? 'TIẾP TỤC HỌC' : (course.price === 0 ? 'VÀO HỌC NGAY' : 'ĐĂNG KÝ NGAY')}
             </button>
            {course.price > 0 && <p className="guarantee-text">Đảm bảo hoàn tiền trong 30 ngày</p>}

            <div className="course-features">
              <h3 className="features-title">Khóa học này bao gồm:</h3>
              <ul className="features-list">
                <li><FaPlayCircle /> {course.videoCount || 0} bài học video chất lượng</li>
                <li><FaStar /> {course.quizCount || 0} bài kiểm tra kiến thức</li>
                <li><FaGlobe /> Ngôn ngữ: Tiếng Việt</li>
                <li><FaCertificate /> Cấp chứng chỉ hoàn thành</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CoursePage;
