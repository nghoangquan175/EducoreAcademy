import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { FaChevronLeft, FaList, FaAngleDown, FaAngleUp, FaPlayCircle, FaCheckCircle, FaLock } from 'react-icons/fa';
import './LearningPage.css';

const LearningPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeChapters, setActiveChapters] = useState([]); 

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/courses/${courseId}/curriculum`);
        setCourse(data);
        
        // Open the chapter that contains the current lesson
        let foundChapterId = null;
        if (data.chapters) {
          for (const chap of data.chapters) {
            if (chap.lessons && chap.lessons.find(l => l.id.toString() === lessonId)) {
              foundChapterId = chap.id;
              break;
            }
          }
        }
        if (foundChapterId) {
          setActiveChapters([foundChapterId]);
        } else if (data.chapters && data.chapters.length > 0) {
          setActiveChapters([data.chapters[0].id]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, lessonId]);

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu khóa học...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!course) return null;

  // Tìm lesson hiện tại từ API data
  let currentLesson = null;
  let currentChapterTitle = "";

  if (course.chapters) {
    for (const chapter of course.chapters) {
      if (chapter.lessons) {
        const found = chapter.lessons.find(l => l.id.toString() === lessonId);
        if (found) {
          currentLesson = found;
          currentChapterTitle = chapter.title;
          break;
        }
      }
    }
  }

  // Fallback nếu không tìm thấy bài học
  if (!currentLesson) {
    return <div style={{ color: 'white', padding: '20px' }}>Không tìm thấy bài học này!</div>;
  }

  const toggleChapter = (chapterId) => {
    setActiveChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(c => c !== chapterId) 
        : [...prev, chapterId]
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLessonSelect = (lesson) => {
    // Tạm thời chưa xử lý khóa ở frontend cho admin/người dạy.
    // Nếu có logic "isLocked" thật, thì check ở đây.
    navigate(`/learn/${courseId}/lesson/${lesson.id}`);
  };

  return (
    <div className="learning-container">
      {/* TOPBAR */}
      <div className="learning-topbar">
        <div className="topbar-left">
          <Link to={`/course/${courseId}`} className="back-btn">
            <FaChevronLeft />
          </Link>
          <div className="topbar-brand-title">
            <span className="brand-logo">EA.</span>
            <span className="course-title">{course.title}</span>
          </div>
        </div>
        <div className="topbar-right">
          {/* Progress bar info có thể để đây */}
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            <FaList />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`learning-main-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* LEFT COLUMN: VIDEO PLAYER */}
        <div className="learning-content-area">
          <div className="learning-video-container">
             <ReactPlayer 
                url={currentLesson.videoUrl} 
                controls={true}
                width="100%"
                height="100%"
                className="learning-react-player"
                playing={true} // Tự động chạy
              />
          </div>
          
          <div className="learning-lesson-info">
            <h1 className="learning-lesson-title">{currentLesson.title}</h1>
            <p className="learning-chapter-title">Thuộc: {currentChapterTitle}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR CURRICULUM */}
        <div className="learning-sidebar">
          <div className="sidebar-header">
            <h3>Nội dung khóa học</h3>
          </div>
          <div className="sidebar-curriculum-content">
            {course.chapters && course.chapters.map((chapter) => {
               const isOpen = activeChapters.includes(chapter.id);
               return (
                 <div key={chapter.id} className="learning-chapter-item">
                    <div 
                      className="learning-chapter-header" 
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <div className="title-group">
                        {isOpen ? <FaAngleUp /> : <FaAngleDown />}
                        <h4>{chapter.title}</h4>
                      </div>
                    </div>
                    
                    {isOpen && chapter.lessons && (
                      <div className="learning-chapter-body">
                        {chapter.lessons.map(lesson => {
                          const isActive = lesson.id.toString() === lessonId;
                          
                          // Mock status do DB Progress chưa ghép
                          const isCompleted = false; 
                          const isLocked = !lesson.isFree && !isCompleted; 
                          
                          return (
                            <div 
                              key={lesson.id} 
                              className={`learning-lesson-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                              onClick={() => handleLessonSelect(lesson)}
                            >
                              <div className="lesson-icon-state">
                                {isCompleted ? (
                                  <FaCheckCircle className="icon-completed" />
                                ) : isLocked ? (
                                  <FaLock className="icon-locked" />
                                ) : (
                                  <FaPlayCircle className="icon-playable" />
                                )}
                              </div>
                              <div className="lesson-text-info">
                                <span className="lesson-name">{lesson.title}</span>
                                <span className="lesson-length">{lesson.duration || '00:00'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                 </div>
               );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LearningPage;
