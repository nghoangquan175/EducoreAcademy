import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, ChevronRight, Gift } from 'lucide-react';
import { fetchCoursesAPI, fetchCategoriesAPI } from '../services/courseService';
// Tái sử dụng chung style với ProCourses (hoặc sao chép chỉnh màu nếu muốn)
import './ProCourses.css';
import './FreeCourses.css';

const formatPrice = (price) => {
  if (price === 0 || !price) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const StarRating = ({ rating }) => (
  <span className="pc-stars">
    <Star size={13} fill="#eab308" stroke="none" />
    <span>{rating.toFixed(1)}</span>
  </span>
);

const CourseCard = ({ course, onClick }) => (
  <div className="pc-card" onClick={() => onClick(course.id)} role="button" tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick(course.id)}>
    {/* Thumbnail */}
    <div className="pc-card-thumb">
      <img src={course.thumbnail} alt={course.title} loading="lazy" />
      <span className={`pc-level pc-level--${course.level?.toLowerCase()}`}>{course.level}</span>
    </div>

    {/* Body */}
    <div className="pc-card-body">
      <span className="pc-category-pill fc-category-pill">{course.category}</span>
      <h3 className="pc-card-title">{course.title}</h3>
      <p className="pc-card-desc">{course.description}</p>

      {/* Meta */}
      <div className="pc-meta">
        <StarRating rating={course.rating || 0} />
        <span className="pc-meta-dot" />
        <Users size={13} />
        <span>{(course.studentsCount || 0).toLocaleString('vi-VN')}</span>
        <span className="pc-meta-dot" />
        <Clock size={13} />
        <span>{course.duration}</span>
      </div>

      {/* Footer */}
      <div className="pc-card-footer">
        <span className="pc-price fc-price">{formatPrice(course.price)}</span>
        <button className="pc-enroll-btn fc-enroll-btn">
          Học ngay <ChevronRight size={15} />
        </button>
      </div>
    </div>
  </div>
);

const FreeCourses = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(['Tất cả']);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load categories once (only for free courses)
  useEffect(() => {
    fetchCategoriesAPI('free')
      .then(({ data }) => setCategories(data))
      .catch(console.error);
  }, []);

  // Load courses whenever category changes, fetch ONLY free courses
  useEffect(() => {
    setLoading(true);
    fetchCoursesAPI(activeCategory, 'free')
      .then(({ data }) => setCourses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <section className="pc-section fc-section">
      <div className="pc-container">
        {/* Header */}
        <div className="pc-header">
          <div className="pc-header-left">
            <div className="pc-badge fc-badge">
              <Gift size={14} />
              <span>FREE</span>
            </div>
            <h2 className="pc-title">Khoá học Miễn phí</h2>
            <p className="pc-subtitle">
              Bắt đầu hành trình của bạn với các khoá học chất lượng hoàn toàn miễn phí.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="pc-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`pc-tab ${activeCategory === cat ? 'pc-tab--active fc-tab--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="pc-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pc-card-skeleton" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="pc-empty">Chưa có khoá học miễn phí trong danh mục này.</div>
        ) : (
          <div className="pc-grid">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={(id) => navigate(`/course/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FreeCourses;
