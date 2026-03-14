import React, { useState, useEffect } from 'react';
import { 
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
  MoreVertical,
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
  ChevronLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState([]);
  
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
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { id: 'material', label: 'Material', icon: <BookMarked size={20} /> },
    { id: 'lectures', label: 'Lectures', icon: <Video size={20} /> },
    { id: 'tests', label: 'Test & Report', icon: <BarChart3 size={20} /> },
    { id: 'doubt', label: 'Doubt', icon: <HelpCircle size={20} /> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    fetchDashboardData();
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
      
      const [statsRes, coursesRes, quizRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/student/stats', config),
        axios.get('http://localhost:5000/api/users/student/enrolled-courses', config),
        axios.get('http://localhost:5000/api/users/student/quiz-attempts', config)
      ]);

      setStats(statsRes.data);
      setCourses(coursesRes.data);
      setQuizAttempts(quizRes.data);
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
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderOverview = () => (
    <div className="std-content-fade-in">
      {/* Welcome Banner */}
      <div className="std-welcome-card">
        <div className="std-welcome-text">
          <h2>Welcome back, {user?.name}!</h2>
          <p>You have {courses.length} courses in progress. Keep up the good work and reach your study goals today!</p>
          <button className="std-continue-btn" onClick={() => setActiveTab('courses')}>Continue Study</button>
        </div>
        
      </div>

      {/* Analytics Row */}
      <div className="std-analytics-row">
        <div className="std-card">
          <div className="std-card-header">
            <span>Statistics</span>
          </div>
          <div className="std-stats-grid">
             <div className="std-stat-item">
                <span className="stat-value">{stats.totalCourses}</span>
                <span className="stat-label">Courses</span>
             </div>
             <div className="std-stat-item">
                <span className="stat-value">{stats.points}</span>
                <span className="stat-label">Points</span>
             </div>
             <div className="std-stat-item">
                <span className="stat-value">{stats.badges}</span>
                <span className="stat-label">Badges</span>
             </div>
          </div>
        </div>

        <div className="std-card">
          <div className="std-card-header">Learning Activity</div>
          <div className="mock-circle-chart">
            {stats.totalCourses > 0 ? Math.round((stats.completedLessons / (stats.totalCourses * 10)) * 100) : 0}%
          </div>
          <div className="mock-circle-legend">
            <div className="legend-item"><div className="dot blue-light"></div> Complete</div>
            <div className="legend-item"><div className="dot blue"></div> In Progress</div>
          </div>
        </div>

        <div className="std-card">
          <div className="std-card-header">Top Performance</div>
          <div className="std-perf-list">
            <div className="perf-item">
               <div className="perf-user">
                  <div className="perf-rank rank-1">1</div>
                  <span className="perf-name">Rahul</span>
               </div>
               <span className="perf-score">48/50</span>
            </div>
            <div className="perf-item personal">
               <div className="perf-user">
                  <div className="perf-rank rank-me">?</div>
                  <span className="perf-name">{user?.name}</span>
               </div>
               <span className="perf-score">{stats.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Section */}
      <div className="std-suggested-row">
        <div className="std-card">
           <div className="std-card-header">
              <span>My Recent Courses</span>
              <button className="std-view-all-btn" onClick={() => setActiveTab('courses')}>View all</button>
           </div>
           <div className="std-suggested-grid">
              {courses.slice(0, 3).map(course => (
                 <div key={course.id} className="std-suggested-item" onClick={() => navigate(`/learn/${course.id}`)} style={{ cursor: 'pointer' }}>
                    <img src={course.thumbnail || 'https://via.placeholder.com/48'} className="std-item-thumb" />
                    <div className="std-item-info">
                       <h4 className="std-item-title">{course.title}</h4>
                       <span className="std-item-author">Instructor: {course.instructorName}</span>
                    </div>
                    <ChevronRight size={16} className="std-item-arrow" />
                 </div>
              ))}
           </div>
        </div>
        <div className="std-card">
           <div className="std-card-header">Today's Class</div>
           <div className="std-class-card">
              <div className="class-header">
                 <div className="class-icon-box">
                    <BookMarked size={24} />
                 </div>
                 <div className="class-info">
                    <h4 className="class-title">Advanced Web Dev</h4>
                    <span className="class-time">Live • 12:00 PM</span>
                 </div>
              </div>
              <div className="class-footer">
                 <span className="class-stat"><Clock size={12} /> 3 Hours</span>
                 <span className="class-stat"><Check size={12} /> 21 Students</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => {
    // Logic for filtering
    const filteredCourses = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(courseSearch.toLowerCase());
      if (filterType === 'all') return matchesSearch;
      if (filterType === 'in-progress') return matchesSearch && course.progressPercent < 100;
      if (filterType === 'completed') return matchesSearch && course.progressPercent === 100;
      return matchesSearch;
    });

    // Recently Active (highest progress but not 100%, or just the first one if all 0 or all 100)
    const recentlyActive = [...courses]
      .filter(c => c.progressPercent < 100)
      .sort((a, b) => b.progressPercent - a.progressPercent)[0] || courses[0];

    return (
      <div className="std-content-fade-in">
         {/* Recently Active Hero */}
         {recentlyActive && (
            <div className="std-recent-hero">
               <div className="hero-content">
                  <span className="hero-tag">Recently Active</span>
                  <h2 className="hero-title">{recentlyActive.title}</h2>
                  <div className="hero-progress-wrapper">
                     <div className="hero-progress-info">
                        <span>Progress</span>
                        <span>{recentlyActive.progressPercent}%</span>
                     </div>
                     <div className="hero-progress-bar">
                        <div className="hero-progress-fill" style={{ width: `${recentlyActive.progressPercent}%` }}></div>
                     </div>
                  </div>
                  <button onClick={() => navigate(`/learn/${recentlyActive.id}`)} className="std-continue-hero-btn">
                     Resume Learning <ChevronRight size={18} />
                  </button>
               </div>
               <div className="hero-image-box">
                  <img src={recentlyActive.thumbnail || 'https://via.placeholder.com/400x250'} alt="Course" />
               </div>
            </div>
         )}

         {/* Filter & Search Bar */}
         <div className="std-courses-controls">
            <div className="std-filter-tabs">
               <button 
                  className={`std-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
               >
                  All Courses
               </button>
               <button 
                  className={`std-filter-btn ${filterType === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setFilterType('in-progress')}
               >
                  In Progress
               </button>
               <button 
                  className={`std-filter-btn ${filterType === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterType('completed')}
               >
                  Completed
               </button>
            </div>
            <div className="std-course-search">
               <Search size={18} />
               <input 
                  type="text" 
                  placeholder="Search in your library..." 
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
                  <p>No courses match your filter or search.</p>
               </div>
            ) : (
               filteredCourses.map(course => (
                  <div key={course.id} className="std-course-card-premium">
                     <div className="card-thumb-container">
                        <img src={course.thumbnail || 'https://via.placeholder.com/300x180'} alt={course.title} />
                        {course.progressPercent === 100 && (
                           <div className="completed-badge">
                              <Check size={14} /> Completed
                           </div>
                        )}
                     </div>
                     <div className="card-body">
                        <span className="card-category">{course.category}</span>
                        <h4 className="card-title">{course.title}</h4>
                        <p className="card-instructor">Prof. {course.instructorName}</p>
                        
                        <div className="card-progress-section">
                           <div className="progress-text">
                              <span>Completion</span>
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
                           {course.progressPercent === 100 ? 'Review Course' : 'Resume'}
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
          <h3>Quiz & Test History</h3>
          <p>Review your past performance and improvements.</p>
       </div>
       <div className="std-quiz-history-table">
          <table>
             <thead>
                <tr>
                   <th>Lesson Title</th>
                   <th>Score</th>
                   <th>Result</th>
                   <th>Date</th>
                </tr>
             </thead>
             <tbody>
                {quizAttempts.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No quiz attempts found.</td></tr>
                ) : (
                  quizAttempts.map(att => (
                    <tr key={att.id}>
                       <td>{att.lessonTitle}</td>
                       <td>{att.score}/{att.totalQuestions}</td>
                       <td>
                          <span className={`std-badge ${att.score / att.totalQuestions >= 0.8 ? 'success' : 'warning'}`}>
                             {Math.round((att.score / att.totalQuestions) * 100)}%
                          </span>
                       </td>
                       <td>{new Date(att.createdAt).toLocaleDateString()}</td>
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

    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleString('en-US', { month: 'long' });
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
                <h3>Study Schedule</h3>
                <p>{formattedDate} {getLocalDateString(new Date()) === selectedDate && <span className="today-badge">(Today)</span>}</p>
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
                   {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <span key={d} className="day-label">{d}</span>)}
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
                   Today's Agenda
                </div>
                
                <div className="agenda-items">
                   {studyGoals.length === 0 ? (
                      <div className="std-empty-goals">
                         <Calendar size={48} />
                         <p>No goals set for this day.</p>
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
                        placeholder="Goal title..." 
                        value={newGoal.title}
                        onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                        required
                        autoFocus
                      />
                      <div className="form-row">
                         <select value={newGoal.type} onChange={e => setNewGoal({...newGoal, type: e.target.value})}>
                            <option>Task</option>
                            <option>Live Class</option>
                            <option>Assignment</option>
                            <option>Meeting</option>
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
                         <button type="button" className="cancel-btn" onClick={() => setIsAddingGoal(false)}>Cancel</button>
                         <button type="submit" className="save-btn">Save Goal</button>
                      </div>
                   </form>
                ) : (
                   <button className="add-event-btn" onClick={() => setIsAddingGoal(true)}>+ Add Study Goal</button>
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
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="std-main-wrapper">
        <header className="std-topbar">
          <h1 className="std-header-title">Welcome back</h1>
          <div className="std-search-box">
             <Search size={18} className="std-search-icon" />
             <input type="text" placeholder="Search anything..." />
          </div>
          <div className="std-actions-right">
             <button className="std-action-btn glass" onClick={() => setShowCalendar(true)}><Calendar size={18} /></button>
             <button className="std-action-btn"><Bell size={18} /></button>
             <button className="std-action-btn dark"><MoreVertical size={18} /></button>
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
                <div className="std-empty-state">Feature coming soon!</div>
              )}
           </main>

           {/* Modals */}
           {renderCalendarModal()}

           {/* Right Column */}
           <aside className="std-right-column">
              <section>
                 <div className="std-right-section-title">
                    <ShieldCheck size={20} className="text-accent" /> Upcomings
                 </div>
                 <div className="std-upcoming-item">
                    <div className="upcoming-header">
                       <h4 className="upcoming-title">Corporate Accounting</h4>
                       <span className="upcoming-date">19 October</span>
                    </div>
                    <p className="upcoming-desc">Class Text 2</p>
                 </div>
                 <div className="std-upcoming-item">
                    <div className="upcoming-header">
                       <h4 className="upcoming-title">Advanced Web Design</h4>
                       <span className="upcoming-date">22 October</span>
                    </div>
                    <p className="upcoming-desc">Module 4 Test</p>
                 </div>
                 <button className="std-all-events-btn">See All Events</button>
              </section>

              <section>
                 <div className="std-right-section-title">Assignments</div>
                 <div className="std-assignment-item">
                    <div className="check-box-filled"><Check size={14} /></div>
                    <div className="std-assignment-info">
                       <h4>React Project</h4>
                       <span className="status-submitted">13 Jun • Submitted</span>
                    </div>
                 </div>
                 <div className="std-assignment-item">
                    <div className="check-box-empty"></div>
                    <div className="std-assignment-info">
                       <h4>Database Design</h4>
                       <span className="status-urgent">12 Oct • Due Tomorrow</span>
                    </div>
                 </div>
                 <div className="std-assignment-item">
                    <div className="check-box-empty"></div>
                    <div className="std-assignment-info">
                       <h4>UI/UX Case Study</h4>
                       <span className="status-warning">14 Oct • Due in 2 days</span>
                    </div>
                 </div>
              </section>
           </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
