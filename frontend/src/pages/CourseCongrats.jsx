import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Home, BookOpen, Star, Share2, Award } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import './CourseCongrats.css';

const CourseCongrats = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
    
    // Trigger confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [courseId]);

  if (loading) return <div className="congrats-status">Đang tải kết quả...</div>;

  return (
    <div className="congrats-container">
      <div className="congrats-glass-card">
        <div className="confetti-cannon-top"></div>
        
        <div className="congrats-content">
          <div className="trophy-wrapper">
            <div className="trophy-glow"></div>
            <Trophy size={100} className="trophy-icon" />
            <div className="award-badge">
              <Award size={24} />
            </div>
          </div>

          <div className="congrats-text">
            <h1 className="main-congrats-title">CHÚC MỪNG BẠN!</h1>
            <p className="sub-congrats-text">Bạn đã xuất sắc hoàn thành khóa học</p>
            <h2 className="course-completed-title">{course?.title}</h2>
          </div>

          <div className="stats-celebration">
            <div className="stat-pill">
              <Star size={18} fill="#fbce1c" color="#fbce1c" />
              <span>Khóa học chất lượng cao</span>
            </div>
          </div>

          <div className="congrats-actions">
            <button className="btn-dashboard-back" onClick={() => navigate('/student-dashboard')}>
              <Home size={20} /> Quay lại Dashboard
            </button>
            <button className="btn-review-shared" onClick={() => navigate(`/course/${courseId}/review`)}>
              <Star size={20} /> Đánh giá khóa học
            </button>
            <button className="btn-review-shared" onClick={() => navigate(`/course/${courseId}`)} style={{ background: 'rgba(255,255,255,0.1)' }}>
              <BookOpen size={20} /> Xem lại khóa học
            </button>
          </div>
          
          <div className="share-feedback">
            <button className="btn-share-achievement">
              <Share2 size={16} /> Chia sẻ niềm vui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCongrats;
