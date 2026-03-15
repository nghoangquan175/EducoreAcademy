import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText,
  PlayCircle,
  LayoutDashboard, 
  BookOpen, 
  History,
  Trophy,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Search,
  Calendar,
  Bell,
  BookMarked,
  Video,
  HelpCircle,
  BarChart3,
  CreditCard,
  Settings,
  ShieldCheck,
  Check,
  Clock,
  Trash2,
  Plus,
  ChevronLeft,
  Sun,
  Moon
} from 'lucide-react';

import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from '../components/NotificationBell';

import './StudentDashboard.css';


const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedLessons: 0,
    points: 0,
    badges: 0
  });
  const [courses, setCourses] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'in-progress', 'completed'
  const [courseSearch, setCourseSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Global Search states
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [showGlobalSearchDropdown, setShowGlobalSearchDropdown] = useState(false);
  const globalSearchRef = useRef(null);

  const [showCalendar, setShowCalendar] = useState(false);

  const [quizAttempts, setQuizAttempts] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [upcomingGoals, setUpcomingGoals] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ top5: [], myRank: { rank: '?', points: 0 } });
  
  // Helper to get local YYYY-MM-DD
  const getLocalDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [viewDate, setViewDate] = useState(new Date()); // Controls visible month
  const [studyGoals, setStudyGoals] = useState([]);
  const [goalsSummary, setGoalsSummary] = useState([]); 
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', type: 'Task', time: '09:00', color: '#3b82f6' });
  
  const hasGreeted = useRef(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();


  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Khóa học', icon: <BookOpen size={20} /> },
    { id: 'material', label: 'Tài liệu', icon: <BookMarked size={20} /> },
    { id: 'lectures', label: 'Bài giảng', icon: <Video size={20} /> },
    { id: 'tests', label: 'Bài tập & Báo cáo', icon: <BarChart3 size={20} /> },
    { id: 'doubt', label: 'Giải đáp', icon: <HelpCircle size={20} /> },
    { id: 'payment', label: 'Thanh toán', icon: <CreditCard size={20} /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    fetchDashboardData();
    if (user?.name && !hasGreeted.current) {
      toast.success(`Chào mừng trở lại, ${user.name}!`, {
        icon: '👋',
        duration: 4000
      });
      hasGreeted.current = true;
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(courseSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [courseSearch]);

  // Global Search Debounce Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (globalSearch.trim().length >= 2) {
        setIsGlobalSearching(true);
        try {
          // Scoped search for student dashboard: only enrolled courses and authored articles
          const res = await axios.get(`http://localhost:5000/api/search?q=${encodeURIComponent(globalSearch)}&studentId=${user?.id}&authorId=${user?.id}`);
          setGlobalSearchResults(res.data);
          setShowGlobalSearchDropdown(true);
        } catch (error) {
          console.error('Global search error:', error);
        } finally {
          setIsGlobalSearching(false);
        }
      }
 else {
        setGlobalSearchResults([]);
        setShowGlobalSearchDropdown(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [globalSearch]);

  // Handle outside click for global search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (globalSearchRef.current && !globalSearchRef.current.contains(event.target)) {
        setShowGlobalSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (showCalendar) {
      // Auto-reset to today when opening
      setSelectedDate(getLocalDateString(new Date()));
      setViewDate(new Date());
      fetchGoalsSummary();
      fetchStudyGoals();
    }
  }, [showCalendar]);

  useEffect(() => {
    if (showCalendar) {
      fetchStudyGoals();
    }
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const safeFetch = async (url, setter) => {
        try {
          const res = await axios.get(url, config);
          setter(res.data);
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
        }
      };

      await Promise.all([
        safeFetch('http://localhost:5000/api/users/student/stats', setStats),
        safeFetch('http://localhost:5000/api/users/student/enrolled-courses', setCourses),
        safeFetch('http://localhost:5000/api/users/student/quiz-attempts', setQuizAttempts),
        safeFetch('http://localhost:5000/api/users/student/pending-quizzes', setPendingQuizzes),
        safeFetch('http://localhost:5000/api/users/student/upcoming-study-goals', setUpcomingGoals),
        safeFetch('http://localhost:5000/api/users/student/leaderboard', setLeaderboard)
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/users/student/study-goals?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudyGoals(res.data);
    } catch (error) {
      console.error('Error fetching study goals:', error);
    }
  };

  const fetchGoalsSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users/student/study-goals/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoalsSummary(res.data);
    } catch (error) {
      console.error('Error fetching goals summary:', error);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/users/student/study-goals', 
        { ...newGoal, date: selectedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudyGoals([...studyGoals, res.data].sort((a, b) => a.time.localeCompare(b.time)));
      setIsAddingGoal(false);
      setNewGoal({ title: '', type: 'Task', time: '09:00', color: '#3b82f6' });
      fetchGoalsSummary();
      // Refetch upcomings for the side रेल
      const token2 = localStorage.getItem('token');
      const upcomingRes = await axios.get('http://localhost:5000/api/users/student/upcoming-study-goals', {
        headers: { Authorization: `Bearer ${token2}` }
      });
      setUpcomingGoals(upcomingRes.data);
    } catch (error) {
      console.error('Error adding study goal:', error);
      alert('Failed to add study goal. Please check your connection or try again.');
    }
  };

  const handleToggleGoal = async (id, isCompleted) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/student/study-goals/${id}`, 
        { isCompleted: !isCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudyGoals(studyGoals.map(g => g.id === id ? { ...g, isCompleted: !isCompleted } : g));
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/users/student/study-goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudyGoals(studyGoals.filter(g => g.id !== id));
      fetchGoalsSummary();
      // Refetch upcomings for the side रेल
      setUpcomingGoals(upcomingGoals.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const recentlyActive = [...courses]
    .sort((a, b) => new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0))[0] || courses[0];

  const renderOverview = () => (
    <div className="std-content-fade-in">
      {/* Analytics Row */}
      <div className="std-analytics-row">
        <div className="std-card">
          <div className="std-card-header">
            <span>Thống kê học tập</span>
          </div>
          <div className="std-stats-grid">
             <div className="std-stat-item">
                <span className="stat-value">{stats.totalCourses}</span>
                <span className="stat-label">Khóa học</span>
             </div>
             <div className="std-stat-item">
                <span className="stat-value">{stats.points}</span>
                <span className="stat-label">Điểm số</span>
             </div>
             <div className="std-stat-item">
                <span className="stat-value">{stats.badges}</span>
                <span className="stat-label">Huy hiệu</span>
             </div>
          </div>
        </div>

        {/* Recently Active Card integrated into Overview */}
        {recentlyActive && (
          <div className="std-card std-hero-card-compact" onClick={() => navigate(`/learn/${recentlyActive.id}`)}>
             <div className="std-card-header">Hoạt động gần đây</div>
             <div className="hero-compact-body">
                <div className="hero-compact-thumb-wrap">
                   <img src={recentlyActive.thumbnail || 'https://via.placeholder.com/100x60'} alt="Course" />
                </div>
                <div className="hero-compact-info">
                   <h4>{recentlyActive.title}</h4>
                   <div className="hero-compact-progress">
                      <div className="progress-bar-mini">
                         <div className="progress-fill-mini" style={{ width: `${recentlyActive.progressPercent}%` }}></div>
                      </div>
                      <span>{recentlyActive.progressPercent}%</span>
                   </div>
                </div>
             </div>
             <button className="std-resume-btn-mini">Tiếp tục học <ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      <div className="std-suggested-row">
        <div className="std-card">
          <div className="std-card-header">Tiến độ bài học</div>
          <div className="mock-circle-chart">
            {stats.totalCourses > 0 ? Math.round((stats.completedLessons / (stats.totalCourses * 10)) * 100) : 0}%
          </div>
          <div className="mock-circle-legend">
            <div className="legend-item"><div className="dot blue-light"></div> Hoàn thành</div>
            <div className="legend-item"><div className="dot blue"></div> Đang học</div>
          </div>
        </div>

        <div className="std-card">
          <div className="std-card-header">Bảng xếp hạng</div>
          <div className="std-perf-list">
            {leaderboard?.top5?.map((item) => (
               <div key={item.userId} className={`perf-item ${item.userId === user?.id ? 'personal' : ''}`}>
                  <div className="perf-user">
                     <div className={`perf-rank rank-${item.rank}`}>
                        {item.rank === 1 ? <Trophy size={14} /> : item.rank}
                     </div>
                     <span className="perf-name">{item.name}</span>
                  </div>
                  <span className="perf-score">{item.points} điểm</span>
               </div>
            ))}
            
            {/* Show my rank if not in top 5 */}
            {leaderboard?.top5 && !leaderboard.top5.some(item => item.userId === user?.id) && (
               <>
                  <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '10px', margin: '4px 0' }}>•••</div>
                  <div className="perf-item personal">
                     <div className="perf-user">
                        <div className="perf-rank rank-me">{leaderboard.myRank.rank}</div>
                        <span className="perf-name">{user?.name} (Bạn)</span>
                     </div>
                     <span className="perf-score">{leaderboard.myRank.points} điểm</span>
                  </div>
               </>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Section */}
      <div className="std-suggested-row">
        <div className="std-card">
           <div className="std-card-header">
              <span>Khóa học của tôi</span>
              <button className="std-view-all-btn" onClick={() => setActiveTab('courses')}>Xem tất cả</button>
           </div>
           <div className="std-suggested-grid">
              {courses.slice(0, 3).map(course => (
                 <div key={course.id} className="std-suggested-item" onClick={() => navigate(`/learn/${course.id}`)} style={{ cursor: 'pointer' }}>
                    <img src={course.thumbnail || 'https://via.placeholder.com/48'} className="std-item-thumb" />
                    <div className="std-item-info">
                       <h4 className="std-item-title">{course.title}</h4>
                       <span className="std-item-author">Giảng viên: {course.instructorName}</span>
                    </div>
                    <ChevronRight size={16} className="std-item-arrow" />
                 </div>
              ))}
           </div>
        </div>
        <div className="std-card">
           <div className="std-card-header">Lịch học hôm nay</div>
           <div className="std-class-card">
              <div className="class-header">
                 <div className="class-icon-box">
                    <BookMarked size={24} />
                 </div>
                 <div className="class-info">
                    <h4 className="class-title">Phát triển Web nâng cao</h4>
                    <span className="class-time">Trực tiếp • 12:00 PM</span>
                 </div>
              </div>
              <div className="class-footer">
                 <span className="class-stat"><Clock size={12} /> 3 Giờ</span>
                 <span className="class-stat"><Check size={12} /> 21 Học viên</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => {
    // Logic for filtering
    const filteredCourses = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(debouncedSearch.toLowerCase());

      if (filterType === 'all') return matchesSearch;
      if (filterType === 'in-progress') return matchesSearch && course.progressPercent < 100;
      if (filterType === 'completed') return matchesSearch && course.progressPercent === 100;
      return matchesSearch;
    });

    return (
      <div className="std-content-fade-in">
         {/* Filter & Search Bar */}
         <div className="std-courses-controls">
            <div className="std-filter-tabs">
               <button 
                  className={`std-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
               >
                  Tất cả
               </button>
               <button 
                  className={`std-filter-btn ${filterType === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setFilterType('in-progress')}
               >
                  Đang học
               </button>
               <button 
                  className={`std-filter-btn ${filterType === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterType('completed')}
               >
                  Đã hoàn thành
               </button>
            </div>
            <div className="std-course-search">
               <Search size={18} />
               <input 
                  type="text" 
                  placeholder="Tìm kiếm trong thư viện của bạn..." 
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
               />
            </div>
         </div>

         {/* Course Grid */}
         <div className="std-courses-grid-premium">
            {filteredCourses.length === 0 ? (
               <div className="std-empty-state">
                  <BookOpen size={48} />
                  <p>Không tìm thấy khóa học nào phù hợp.</p>
               </div>
            ) : (
               filteredCourses.map(course => (
                  <div key={course.id} className="std-course-card-premium">
                     <div className="card-thumb-container">
                        <img src={course.thumbnail || 'https://via.placeholder.com/300x180'} alt={course.title} />
                        {course.progressPercent === 100 && (
                           <div className="completed-badge">
                              <Check size={14} /> Hoàn thành
                           </div>
                        )}
                     </div>
                     <div className="card-body">
                        <span className="card-category">{course.category}</span>
                        <h4 className="card-title">{course.title}</h4>
                        <p className="card-instructor">Prof. {course.instructorName}</p>
                        
                        <div className="card-progress-section">
                           <div className="progress-text">
                              <span>Tiến độ</span>
                              <span>{course.progressPercent}%</span>
                           </div>
                           <div className="progress-bar-mini">
                              <div className="progress-fill-mini" style={{ width: `${course.progressPercent}%` }}></div>
                           </div>
                        </div>

                        <button 
                           onClick={() => navigate(`/learn/${course.id}`)} 
                           className={`card-action-btn ${course.progressPercent === 100 ? 'secondary' : 'primary'}`}
                        >
                           {course.progressPercent === 100 ? 'Xem lại bài học' : 'Học tiếp'}
                        </button>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
    );
  };

  const renderTests = () => (
    <div className="std-content-fade-in">
       <div className="std-section-header">
          <h3>Lịch sử làm bài</h3>
          <p>Xem lại kết quả và tiến độ học tập của bạn.</p>
       </div>
       <div className="std-quiz-history-table">
          <table>
             <thead>
                <tr>
                   <th>Bài học</th>
                   <th>Chương</th>
                   <th>Khóa học</th>
                   <th style={{ textAlign: 'center' }}>Điểm số</th>
                   <th style={{ textAlign: 'center' }}>Kết quả</th>
                   <th style={{ textAlign: 'right' }}>Ngày làm</th>
                </tr>
             </thead>
             <tbody>
                {quizAttempts.length === 0 ? (
                   <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Chưa có lịch sử làm bài.</td></tr>
                ) : (
                  quizAttempts.map(att => (
                    <tr 
                      key={att.id} 
                      onClick={() => navigate(`/learn/${att.courseId}/lesson/${att.lessonId}?quiz=true`)}
                      className="std-clickable-row"
                    >
                       <td>{att.lessonTitle}</td>
                       <td style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>{att.chapterTitle}</td>
                       <td>{att.courseTitle}</td>
                       <td style={{ textAlign: 'center' }}>{att.score}/{att.totalQuestions}</td>
                       <td style={{ textAlign: 'center' }}>
                          <span className={`std-badge ${att.score / att.totalQuestions >= 0.8 ? 'success' : 'warning'}`}>
                             {att.score / att.totalQuestions >= 0.8 ? 'Đạt' : 'Chưa đạt'} ({Math.round((att.score / att.totalQuestions) * 100)}%)
                          </span>
                       </td>
                       <td style={{ textAlign: 'right' }}>
                          {new Date(att.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                       </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderCalendarModal = () => {
    if (!showCalendar) return null;

    const formattedDate = new Date(selectedDate).toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('vi-VN', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // First day of visibility
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
    // Adjust for Monday start (M:0 ... S:6)
    const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

    return (
      <div className="std-modal-overlay" onClick={() => setShowCalendar(false)}>
        <div className="std-calendar-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
             <div className="header-info">
                <h3>Lịch học tập</h3>
                <p>{formattedDate} {getLocalDateString(new Date()) === selectedDate && <span className="today-badge">(Hôm nay)</span>}</p>
             </div>
             <button className="close-btn" onClick={() => setShowCalendar(false)}><X size={20} /></button>
          </div>
          <div className="modal-body-layout">
             <div className="calendar-mini-sidebar">
                <div className="mini-month-header">
                   <button onClick={handlePrevMonth} className="nav-arrow"><ChevronLeft size={16} /></button>
                   <span>{monthName} {year}</span>
                   <button onClick={handleNextMonth} className="nav-arrow"><ChevronRight size={16} /></button>
                </div>
                <div className="mini-days-grid">
                   {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => <span key={d} className="day-label">{d}</span>)}
                   {Array.from({ length: emptyDays }).map((_, i) => <span key={`empty-${i}`} className="day-empty"></span>)}
                   {Array.from({ length: daysInMonth }, (_, i) => {
                      const d = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const hasEvent = goalsSummary.includes(dateStr);
                      const isToday = getLocalDateString(new Date()) === dateStr;
                      return (
                        <button 
                          key={i} 
                          className={`day-btn ${selectedDate === dateStr ? 'active' : ''} ${hasEvent ? 'has-event' : ''} ${isToday ? 'today' : ''}`}
                          onClick={() => setSelectedDate(dateStr)}
                        >
                           {d}
                        </button>
                      );
                   })}
                </div>
             </div>
             <div className="daily-agenda-list">
                <div className="agenda-header">
                   Lịch trình trong ngày
                </div>
                
                <div className="agenda-items">
                   {studyGoals.length === 0 ? (
                      <div className="std-empty-goals">
                         <Calendar size={48} />
                         <p>Chưa có mục tiêu nào trong ngày này.</p>
                      </div>
                   ) : (
                      studyGoals.map((item) => (
                        <div key={item.id} className={`agenda-item ${item.isCompleted ? 'completed' : ''}`}>
                           <div className="item-time">{item.time}</div>
                           <div className="item-content" style={{ borderLeft: `4px solid ${item.color}` }}>
                              <div className="item-main-info">
                                 <input 
                                   type="checkbox" 
                                   checked={item.isCompleted} 
                                   onChange={() => handleToggleGoal(item.id, item.isCompleted)}
                                   className="goal-checkbox"
                                 />
                                 <div>
                                   <h4 style={{ textDecoration: item.isCompleted ? 'line-through' : 'none' }}>{item.title}</h4>
                                   <span className="item-type">{item.type}</span>
                                 </div>
                              </div>
                              <button className="delete-goal-btn" onClick={() => handleDeleteGoal(item.id)}>
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                      ))
                   )}
                </div>

                {isAddingGoal ? (
                   <form className="add-goal-form" onSubmit={handleAddGoal}>
                      <input 
                        type="text" 
                        placeholder="Tiêu đề mục tiêu..." 
                        value={newGoal.title}
                        onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                        required
                        autoFocus
                      />
                      <div className="form-row">
                         <select value={newGoal.type} onChange={e => setNewGoal({...newGoal, type: e.target.value})}>
                            <option>Nhiệm vụ</option>
                            <option>Lớp học trực tuyến</option>
                            <option>Bài tập</option>
                            <option>Cuộc họp</option>
                         </select>
                         <input 
                           type="time" 
                           value={newGoal.time} 
                           onChange={e => setNewGoal({...newGoal, time: e.target.value})}
                         />
                         <input 
                            type="color" 
                            value={newGoal.color} 
                            onChange={e => setNewGoal({...newGoal, color: e.target.value})}
                            className="color-picker"
                         />
                      </div>
                      <div className="form-actions">
                         <button type="button" className="cancel-btn" onClick={() => setIsAddingGoal(false)}>Hủy</button>
                         <button type="submit" className="save-btn">Lưu mục tiêu</button>
                      </div>
                   </form>
                ) : (
                   <button className="add-event-btn" onClick={() => setIsAddingGoal(true)}>+ Thêm mục tiêu mới</button>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="student-dashboard-layout">
      {/* Sidebar */}
      <aside className="std-sidebar">
        <Link to="/" className="std-logo">
          <BookOpen className="std-logo-icon" size={24} />
          <span className="std-logo-text">EducoreAcademy</span>
        </Link>

        <nav className="std-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`std-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span className="std-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6-custom mt-auto-custom">
          <button className="std-nav-item text-red-custom" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="std-main-wrapper">
        <header className="std-topbar">
          <h1 className="std-header-title">Chào mừng trở lại</h1>
          <div className="std-search-box-container" ref={globalSearchRef}>
             <div className={`std-search-box ${showGlobalSearchDropdown ? 'active' : ''}`}>
                <Search size={18} className="std-search-icon" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm khóa học, bài viết..." 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => {
                    if (globalSearch.length >= 2) setShowGlobalSearchDropdown(true);
                  }}
                />
                {isGlobalSearching && <div className="std-search-loader"></div>}
             </div>

             {/* Global Search Results Dropdown */}
             {showGlobalSearchDropdown && globalSearch.length >= 2 && (
                <div className="std-search-dropdown">
                   {globalSearchResults.length > 0 ? (
                      <div className="std-search-results-list">
                         {globalSearchResults.map((item) => (
                             <Link 
                                key={`${item.type}-${item.id}`} 
                                to={item.type === 'course' ? `/learn/${item.id}` : `/article/${item.id}`}
                                className="std-search-item"
                                onClick={() => {
                                   setShowGlobalSearchDropdown(false);
                                   setGlobalSearch('');
                                }}
                             >
                                <div className="std-search-item-icon">
                                   {item.thumbnail ? (
                                     <img src={item.thumbnail} alt={item.title} className="std-search-item-thumb" />
                                   ) : (
                                     item.type === 'course' ? <PlayCircle size={18} /> : <FileText size={18} />
                                   )}
                                </div>
                                <div className="std-search-item-info">
                                   <div className="std-search-item-title">{item.title}</div>
                                   <div className="std-search-item-type">
                                      {item.type === 'course' ? 'Khóa học' : 'Bài viết'}
                                   </div>
                                </div>

                             </Link>
                         ))}
                      </div>
                   ) : (
                      !isGlobalSearching && (
                         <div className="std-search-no-results">
                            Không tìm thấy kết quả cho "{globalSearch}"
                         </div>
                      )
                   )}
                </div>
             )}
          </div>

          <div className="std-actions-right">
             <button className="std-action-btn glass" onClick={() => setShowCalendar(true)}><Calendar size={18} /></button>
             <NotificationBell iconSize={18} buttonClassName="std-action-btn" />
             <button className="std-action-btn dark" onClick={toggleTheme}>
               {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             <div className="std-user-profile-header">

                <img src={user?.avatar || "https://i.pravatar.cc/150"} className="std-header-avatar" />
             </div>
          </div>
        </header>

        <div className="std-dashboard-container">
           <main className="std-content-scroll">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'courses' && renderCourses()}
              {activeTab === 'tests' && renderTests()}
              {['material', 'lectures', 'doubt', 'payment', 'settings'].includes(activeTab) && (
                <div className="std-empty-state">Tính năng đang phát triển!</div>
              )}
           </main>

           {/* Modals */}
           {renderCalendarModal()}

           {/* Right Column */}
           <aside className="std-right-column">
              <section>
                 <div className="std-right-section-title">
                  Sắp tới
                 </div>
                 {upcomingGoals.length === 0 ? (
                    <div className="std-empty-state-mini" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                       <Calendar size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                       <p style={{ fontSize: '13px' }}>Chưa có mục tiêu học tập nào. Hãy lập kế hoạch để bắt đầu nhé!</p>
                    </div>
                 ) : (
                    upcomingGoals.map(goal => (
                       <div key={goal.id} className="std-upcoming-item">
                          <div className="upcoming-header">
                             <h4 className="upcoming-title">{goal.title}</h4>
                             <span className="upcoming-date">
                                {new Date(goal.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                             </span>
                          </div>
                          <p className="upcoming-desc">{goal.type} • {goal.time}</p>
                       </div>
                    ))
                 )}
                 <button className="std-all-events-btn" onClick={() => setShowCalendar(true)}>Quản lý lịch trình</button>
              </section>

              <section>
                 <div className="std-right-section-title">Bài tập chuyên đề</div>
                 {pendingQuizzes.length === 0 ? (
                    <div className="std-empty-state-mini" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                       <BookMarked size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                       <p style={{ fontSize: '13px' }}>Bạn đã hoàn thành tất cả bài tập! Thật tuyệt vời!</p>
                    </div>
                 ) : (
                    pendingQuizzes.map(quiz => (
                       <div 
                         key={quiz.id} 
                         className="std-assignment-item" 
                         onClick={() => navigate(`/learn/${quiz.courseId}/lesson/${quiz.lessonId}?quiz=true`)}
                         style={{ cursor: 'pointer' }}
                       >
                          <div className="std-assignment-info">
                             <h4>{quiz.lessonTitle}</h4>
                             <span className="status-urgent">{quiz.courseTitle} • Đang chờ kiểm tra</span>
                          </div>
                       </div>
                    ))
                 )}
              </section>
           </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
