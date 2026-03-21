import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, Send, CheckCircle, MessageSquare, Heart, Frown, HelpCircle } from 'lucide-react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import './CourseReview.css';

const CourseReview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourse(data);
        
        // Fetch existing review if any
        const reviewRes = await axios.get(`http://localhost:5000/api/courses/${courseId}/reviews`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Try to find current user's review
        const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userId = profileRes.data.id;
        const myReview = reviewRes.data.find(r => r.userId === userId);
        
        if (myReview) {
            setRating(myReview.rating);
            setReviewComment(myReview.comment);
        }
      } catch (error) {
        console.error("Error fetching course for review:", error);
        const status = error.response?.status;
        if (status === 404) {
            toast.error("Không tìm thấy khóa học");
            navigate('/student-dashboard');
        } else {
            toast.error("Lỗi khi tải thông tin. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/reviews`, 
        { rating, comment: reviewComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubmitted(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#facc15', '#fbbf24', '#f59e0b']
      });
      toast.success("Cảm ơn bạn đã đánh giá khóa học!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="review-page-loading">
      <div className="loading-spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>
  );

  if (submitted) {
    const getSuccessContent = () => {
      if (rating >= 4) {
        return {
          icon: <Heart size={100} fill="#ef4444" color="#ef4444" className="success-icon heart" />,
          title: "Cảm ơn bạn!",
          message: "Đánh giá tuyệt vời của bạn là động lực lớn cho đội ngũ Educore."
        };
      } else if (rating === 3) {
        return {
          icon: <CheckCircle size={100} color="#3b82f6" className="success-icon" />,
          title: "Cảm ơn bạn!",
          message: "Mong bạn có trải nghiệm tốt hơn trong tương lai. Chúng tôi luôn lắng nghe để cải thiện."
        };
      } else {
        return {
          icon: <Frown size={80} className="success-icon sad" />,
          title: "Cảm ơn đóng góp của bạn",
          message: (
            <>
              Chúng tôi sẽ xem xét chất lượng nội dung khóa học. 
              Nếu có bất cứ điều gì cần khiếu nại, vui lòng liên hệ hotline 
              <strong style={{ display: 'block', marginTop: '10px', color: '#ef4444' }}>1900 1017</strong>
            </>
          )
        };
      }
    };

    const content = getSuccessContent();

    return (
      <div className="review-page-container success">
        <div className="review-success-card">
          {content.icon}
          <h1>{content.title}</h1>
          <div className="success-message">{content.message}</div>
          <div className="success-actions">
            <button className="btn-back-course" onClick={() => navigate(`/course/${courseId}`)}>
              Quay lại khóa học
            </button>
            <button className="btn-go-dashboard" onClick={() => navigate('/student-dashboard')}>
              Về Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page-container">
      <button className="review-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} /> Quay lại
      </button>

      <div className="review-layout">
        <div className="review-course-info">
          <div className="review-course-card">
            <img src={course?.thumbnail || 'https://via.placeholder.com/300x180'} alt={course?.title} />
            <div className="course-card-overlay">
                <span className="course-badge">Đang đánh giá</span>
            </div>
            <div className="info-padding">
                <h2>{course?.title}</h2>
                <p>Giảng viên: {course?.instructor?.name}</p>
            </div>
          </div>
          
          <div className="review-guidelines">
            <h3>Lưu ý khi đánh giá:</h3>
            <ul>
                <li>Chia sẻ trải nghiệm thực tế của bạn.</li>
                <li>Nêu rõ những điểm bạn thích hoặc chưa thích.</li>
                <li>Góp ý chân thành để giảng viên cải thiện khóa học.</li>
            </ul>
          </div>
        </div>

        <div className="review-form-container">
          <div className="review-header">
            <MessageSquare size={32} className="header-icon" />
            <div className="header-text">
                <h1>Đánh giá khóa học</h1>
                <p>Trải nghiệm của bạn rất quan trọng với chúng tôi</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="premium-review-form">
            <div className="rating-selector-wrapper">
              <label>Bạn chấm cho khóa học này mấy sao?</label>
              <div className="giant-star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`giant-star ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => {}} // Could add hover effect later
                  >
                    {rating >= star ? <FaStar /> : <FaRegStar />}
                  </button>
                ))}
              </div>
              <div className="rating-label">
                {rating === 5 ? 'Tuyệt vời! 🌟' : 
                 rating === 4 ? 'Rất tốt 👍' : 
                 rating === 3 ? 'Bình thường 👌' : 
                 rating === 2 ? 'Kém 👎' : 'Tệ 😞'}
              </div>
            </div>

            <div className="review-input-wrapper">
              <label>Nhận xét chi tiết</label>
              <textarea
                placeholder="Khóa học này có giúp ích cho bạn không? Nội dung có dễ hiểu không?..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-send-review">
              {submitting ? 'Đang gửi...' : (
                <>
                  Gửi đánh giá ngay <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseReview;
