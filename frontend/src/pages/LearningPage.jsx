import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { FaChevronLeft, FaList, FaAngleDown, FaAngleUp, FaPlayCircle, FaCheckCircle, FaLock } from 'react-icons/fa';
import { Sun, Moon, LayoutDashboard } from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import QuizPlayer from './QuizPlayer';
import ConfirmDialog from '../components/ConfirmDialog';
import './LearningPage.css';

const LearningPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeChapters, setActiveChapters] = useState([]); 
  const [showQuiz, setShowQuiz] = useState(false);
  const [passedLessons, setPassedLessons] = useState([]);
  const [latestAttempt, setLatestAttempt] = useState(null);
  const [videoFinished, setVideoFinished] = useState(false);
  const [quizInitialMode, setQuizInitialMode] = useState(false); // false = take, true = review
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: () => {}, 
    type: 'warning' 
  });

  // Flatten lessons for sequence tracking
  const allLessons = useMemo(() => {
    if (!course || !course.chapters) return [];
    const flat = [];
    course.chapters.forEach(chapter => {
      if (chapter.lessons) {
        chapter.lessons.forEach(lesson => {
          flat.push({ ...lesson, chapterId: chapter.id });
        });
      }
    });
    return flat;
  }, [course]);

  // Derived state for current lesson and chapter title
  const { currentLesson, currentChapterTitle } = useMemo(() => {
    let lesson = null;
    let title = "";
    if (course?.chapters) {
      for (const chapter of course.chapters) {
        if (chapter.lessons) {
          const found = chapter.lessons.find(l => l.id.toString() === lessonId);
          if (found) {
            lesson = found;
            title = chapter.title;
            break;
          }
        }
      }
    }
    return { currentLesson: lesson, currentChapterTitle: title };
  }, [course, lessonId]);

  const isLastLesson = useMemo(() => {
    if (allLessons.length === 0) return false;
    return allLessons[allLessons.length - 1].id.toString() === lessonId;
  }, [allLessons, lessonId]);

  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const [courseRes, passedRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/courses/${courseId}/learn`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`http://localhost:5000/api/quizzes/course/${courseId}/passed-lessons`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ]);
        
        setCourse(courseRes.data);
        
        // Fetch completed lessons from backend (Progress table)
        // Note: Using the same endpoint but it should ideally return all Progress.
        // For now, I'll ensure passedRes.data includes all completed lessons.
        setPassedLessons(passedRes.data || []);
        
        // If no lessonId provided, redirect to the latest unpassed lesson
        if (!lessonId && courseRes.data.chapters && courseRes.data.chapters.length > 0) {
          // Flatten all lessons to find the first unpassed one
          const flattenedLessons = [];
          courseRes.data.chapters.forEach(chap => {
            if (chap.lessons) {
              chap.lessons.forEach(l => flattenedLessons.push(l));
            }
          });

          if (flattenedLessons.length > 0) {
            // Find the first lesson that is NOT in passedLessons
            // Also check lesson.completed from the progress map if available
            const latestUnpassed = flattenedLessons.find(l => !passedRes.data.includes(l.id));
            
            // Redirect to latestUnpassed or the last lesson if all are passed
            const targetLesson = latestUnpassed || flattenedLessons[flattenedLessons.length - 1];
            
            navigate(`/learn/${courseId}/lesson/${targetLesson.id}`, { replace: true });
            return;
          }
        }

        // Open the chapter that contains the current lesson
        let foundChapterId = null;
        if (courseRes.data.chapters) {
          for (const chap of courseRes.data.chapters) {
            if (chap.lessons && chap.lessons.find(l => l.id.toString() === lessonId)) {
              foundChapterId = chap.id;
              break;
            }
          }
        }
        if (foundChapterId) {
          setActiveChapters([foundChapterId]);
        } else if (courseRes.data.chapters && courseRes.data.chapters.length > 0) {
          setActiveChapters([courseRes.data.chapters[0].id]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, lessonId]);

  useEffect(() => {
    if (searchParams.get('quiz') === 'true' && currentLesson?.quiz) {
       setShowQuiz(true);
       if (searchParams.get('mode') === 'review') {
         setQuizInitialMode(true);
       } else {
         setQuizInitialMode(false);
       }
    }
  }, [searchParams, currentLesson]);

  useEffect(() => {
    const fetchLatestAttempt = async () => {
      if (!currentLesson?.quiz) return;
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/quizzes/lesson/${currentLesson.id}/latest-attempt`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLatestAttempt(data);
      } catch (err) {
        console.error("Lỗi khi tải kết quả gần nhất:", err);
      }
    };
    if (currentLesson) fetchLatestAttempt();
  }, [currentLesson, showQuiz]);

  if (loading) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu khóa học...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px', textAlign: 'center' }}>{error}</div>;
  if (!course) return null;

  // Fallback nếu không tìm thấy bài học
  if (!currentLesson) {
    return <div style={{ color: 'white', padding: '20px' }}>Không tìm thấy bài học này!</div>;
  }

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

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

  const handleMarkFinished = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/courses/lessons/${lessonId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Explicitly update activity
      axios.post(`http://localhost:5000/api/courses/${courseId}/activity`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(e => console.error("Activity ping failed:", e));

      if (response.data.progress.completed && !passedLessons.includes(parseInt(lessonId))) {
        setPassedLessons([...passedLessons, parseInt(lessonId)]);
      }
      
      // Update the current lesson's videoWatched status in the course state
      if (course) {
        setCourse(prev => {
          const newCourse = { ...prev };
          newCourse.chapters.forEach(chap => {
            chap.lessons.forEach(l => {
              if (l.id.toString() === lessonId) {
                l.videoWatched = true;
                l.completed = response.data.progress.completed;
              }
            });
          });
          return newCourse;
        });
      }
    } catch (err) {
      console.error("Lỗi khi đánh dấu hoàn thành bài học:", err);
      alert("Không thể đánh dấu hoàn thành bài học này.");
    }
  };

  const handleLessonSelect = (lesson) => {
    // Tạm thời chưa xử lý khóa ở frontend cho admin/người dạy.
    // Nếu có logic "isLocked" thật, thì check ở đây.
    setShowQuiz(false);
    setVideoFinished(false);
    setLatestAttempt(null);
    navigate(`/learn/${courseId}/lesson/${lesson.id}`);
  };

  const handleNextLesson = async () => {
    // Nếu là bài học video, tự động đánh dấu hoàn thành trước khi sang bài mới
    if (!currentLesson.quiz) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:5000/api/courses/lessons/${lessonId}/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Explicitly update activity
        axios.post(`http://localhost:5000/api/courses/${courseId}/activity`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => console.error("Activity ping failed:", e));

        if (!passedLessons.includes(parseInt(lessonId))) {
          setPassedLessons([...passedLessons, parseInt(lessonId)]);
        }
      } catch (err) {
        console.error("Lỗi khi đánh dấu hoàn thành bài học:", err);
      }
    }

    const currentIndex = allLessons.findIndex(l => l.id.toString() === lessonId);
    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      setShowQuiz(false);
      setVideoFinished(false);
      setLatestAttempt(null);
      navigate(`/learn/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const handleCompleteCourse = () => {
    navigate(`/course-completed/${courseId}`);
  };

  return (
    <div className="learning-container">
      {/* TOPBAR */}
      <div className="learning-topbar">
        <div className="topbar-left">
          <button onClick={() => navigate(-1)} className="back-btn" title="Quay lại">
            <FaChevronLeft />
          </button>
          <Link to="/student-dashboard" className="back-to-dashboard-icon" title="Về bảng điều khiển">
            <LayoutDashboard size={20} />
          </Link>
          <div className="topbar-brand-title">
            {/* <span className="brand-logo">EA.</span> */}
            <span className="course-title">{course.title}</span>
          </div>
        </div>
        <div className="topbar-right">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            <FaList />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`learning-main-wrapper ${(isSidebarOpen && !showQuiz) ? 'sidebar-open' : 'sidebar-closed'}`}>
        
        {/* LEFT COLUMN: VIDEO PLAYER OR QUIZ */}
        <div className="learning-content-area">
          {showQuiz && currentLesson.quiz ? (
            <div className="quiz-focused-container">
              <div className="quiz-header-minimal">
                <span className="quiz-label">Đang làm bài kiểm tra</span>
                <h1 className="learning-lesson-title">{currentLesson.title}</h1>
                <p className="learning-chapter-title">Chương: {currentChapterTitle}</p>
              </div>
              <QuizPlayer 
                lessonId={currentLesson.id} 
                initialReviewMode={quizInitialMode}
                onPass={() => {
                  setPassedLessons([...passedLessons, currentLesson.id]);
                }} 
                onNextLesson={handleNextLesson}
                onBackToVideo={() => setShowQuiz(false)}
                isLastLesson={isLastLesson}
                onCompleteCourse={handleCompleteCourse}
              />
            </div>
          ) : (
            <>
              <div className="learning-video-container">
                {currentLesson.videoUrl ? (
                  isYouTubeUrl(currentLesson.videoUrl) ? (
                    <ReactPlayer 
                      url={currentLesson.videoUrl}
                      className="learning-react-player"
                      controls
                      playing
                      width="100%"
                      height="100%"
                      onEnded={() => {
                        setVideoFinished(true);
                        handleMarkFinished();
                      }}
                    />
                  ) : (
                    <video 
                      key={currentLesson.videoUrl}
                      controls 
                      autoPlay 
                      className="native-video-player"
                      onEnded={() => {
                        setVideoFinished(true);
                        handleMarkFinished();
                      }}
                    >
                      <source src={currentLesson.videoUrl} type="video/mp4" />
                      Trình duyệt của bạn không hỗ trợ thẻ video.
                    </video>
                  )
                ) : (
                  <div className="no-video-placeholder">
                    <FaPlayCircle size={64} />
                    <p>Bài học này chưa có nội dung video.</p>
                  </div>
                )}
              </div>
              
              <div className="learning-lesson-info">
                <div className="lesson-header-flex">
                  <h1 className="learning-lesson-title">{currentLesson.title}</h1>
                  {currentLesson.quiz && (
                    <div className="quiz-status-pill">
                      {latestAttempt ? (
                        <div className={`attempt-summary ${latestAttempt.status}`}>
                          Đã làm: {latestAttempt.score}% ({latestAttempt.status === 'passed' ? 'Đạt' : 'Chưa đạt'})
                        </div>
                      ) : (
                        <div className="no-attempt">Chưa làm bài kiểm tra</div>
                      )}
                    </div>
                  )}
                </div>
                <p className="learning-chapter-title">Thuộc: {currentChapterTitle}</p>
                
                {/* Manual Quiz Start Logic */}
                {currentLesson.quiz && (videoFinished || currentLesson.videoWatched || latestAttempt || passedLessons.includes(parseInt(lessonId)) || passedLessons.includes(currentLesson.id)) && (
                  <div className="quiz-entry-card">
                    <h3>Bài kiểm tra: {currentLesson.title}</h3>
                    <p>Hoàn thành để củng cố kiến thức đã học trong video này.</p>
                    <div className="quiz-entry-actions">
                      <button 
                        className="btn-take-quiz-now" 
                        onClick={() => {
                          if (latestAttempt) {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Làm lại bài kiểm tra',
                              message: 'Bạn có chắc chắn muốn làm lại bài kiểm tra này? Kết quả mới sẽ được ghi nhận sau khi bạn hoàn thành.',
                              type: 'warning',
                              onConfirm: () => {
                                setQuizInitialMode(false);
                                setShowQuiz(true);
                              }
                            });
                          } else {
                            setQuizInitialMode(false);
                            setShowQuiz(true);
                          }
                        }}
                      >
                        {latestAttempt ? 'Làm lại bài kiểm tra' : 'Bắt đầu làm bài kiểm tra'}
                      </button>

                      {latestAttempt && (
                        <button 
                          className="btn-review-quiz-manual" 
                          onClick={() => {
                            setQuizInitialMode(true);
                            setShowQuiz(true);
                          }}
                        >
                          Xem lại kết quả
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Mark as finished if no quiz */}
                {!currentLesson.quiz && videoFinished && !passedLessons.includes(currentLesson.id) && (
                   <div className="no-quiz-completion">
                      <p>Bạn đã xem xong video!</p>
                      <button className="btn-mark-finished" onClick={handleMarkFinished}>
                         Đánh dấu hoàn thành bài học
                      </button>
                   </div>
                )}

                {isLastLesson && (passedLessons.includes(parseInt(lessonId)) || passedLessons.includes(currentLesson.id)) && (
                   <div className="course-completion-final">
                      <p>🎉 Chúc mừng! Bạn đã hoàn thành tất cả bài học.</p>
                      <button className="btn-complete-course-final" onClick={handleCompleteCourse}>
                         NHẬN CHỨNG CHỈ & ĐÁNH GIÁ
                      </button>
                   </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: SIDEBAR CURRICULUM */}
        {!showQuiz && (
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
                            const lessonIndex = allLessons.findIndex(l => l.id === lesson.id);
                            
                            const isPassed = passedLessons.includes(lesson.id);
                            const isCompleted = isPassed; 
                            
                            // Unlock conditions:
                            const isFirstOverall = lessonIndex === 0;
                            const isFree = lesson.isFree;
                            const prevLessonPassed = lessonIndex > 0 && passedLessons.includes(allLessons[lessonIndex - 1].id);
                            
                            const isLocked = !isFirstOverall && !isFree && !prevLessonPassed && !isPassed; 
                            
                            return (
                              <div 
                                key={lesson.id} 
                                className={`learning-lesson-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                onClick={() => !isLocked && handleLessonSelect(lesson)}
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
        )}

      </div>
      <ConfirmDialog 
        {...confirmDialog} 
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
      />
    </div>
  );
};

export default LearningPage;
