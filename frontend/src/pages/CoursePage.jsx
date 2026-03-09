import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FaPlayCircle, FaLock, FaRegClock, FaGlobe, FaCertificate, FaAngleDown, FaAngleUp } from 'react-icons/fa';
import './CoursePage.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChapters, setActiveChapters] = useState([]); // Mở danh sách bài học sau

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/courses/${id}/curriculum`);
        setCourse(data);
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

  const toggleChapter = (chapterId) => {
    setActiveChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(c => c !== chapterId) 
        : [...prev, chapterId]
    );
  };

  const handleEnroll = () => {
    if (!user) {
      // Báo user phải đăng nhập, kèm link để lúc login xong quay về đây
      // (Tính năng quay về tuỳ server/auth context hỗ trợ, ở đây tạm pass state)
      navigate('/login', { state: { from: location } });
      return;
    }

    if (course.price === 0) {
      // Khóa miễn phí -> Vào học ngay
      const firstLessonLink = course.chapters?.[0]?.lessons?.[0] 
        ? `/learn/${course.id}/lesson/${course.chapters[0].lessons[0].id}`
        : '#';
      navigate(firstLessonLink);
    } else {
      // Khóa trả phí -> Thanh toán
      navigate(`/checkout/${course.id}`);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!course) return null;

  // Calculate total lessons dynamically
  const totalLessons = course.chapters ? course.chapters.reduce((acc, chap) => acc + (chap.lessons ? chap.lessons.length : 0), 0) : 0;
  // Use course.previewVideoUrl, fallback to first lesson, then fallback to dummy video
  const previewVideoUrl = course.previewVideoUrl || 
                          (course.chapters && course.chapters[0] && course.chapters[0].lessons[0] 
                            ? course.chapters[0].lessons[0].videoUrl 
                            : 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  
  return (
    <div className="course-detail-container">
      <div className="course-main-body container">
        {/* LEFT COLUMN - CONTENT */}
        <div className="course-left-column">

          {/* Moved from Header Banner */}
          <div className="course-header-content">
            <div className="breadcrumb">
              <Link to="/">Trang chủ</Link> <span>/</span> 
              <Link to="/courses">Khóa học</Link> <span>/</span> 
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
              <span> Thời lượng {course.duration || '0 giờ'}</span>
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

        </div>

        {/* RIGHT COLUMN - SIDEBAR PAYMENT */}
        <div className="course-right-sidebar">
          
          {/* VIDEO LÊN ĐẦU, NGOÀI BOX MUA HÀNG */}
          <div className="sidebar-video-section">
            <div className="video-player-wrapper">
              <ReactPlayer 
                url={previewVideoUrl} 
                controls={true}
                width="100%"
                height="100%"
                className="react-player"
                light={false} 
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
              {course.price === 0 ? 'VÀO HỌC NGAY' : 'ĐĂNG KÝ NGAY'}
            </button>
            <p className="guarantee-text">Đảm bảo hoàn tiền trong 30 ngày</p>

            <div className="course-features">
              <h3 className="features-title">Khóa học này bao gồm:</h3>
              <ul className="features-list">
                <li><FaRegClock /> {course.duration || '0 giờ'} học liệu qua video</li>
                <li><FaPlayCircle /> {totalLessons} bài học chất lượng</li>
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
