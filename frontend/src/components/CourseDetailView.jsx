import React from 'react';
import { ArrowLeft, Clock, HelpCircle, Play } from 'lucide-react';
import './CourseDetailView.css';

const CourseDetailView = ({ courseData, onBack, actions, isReviewMode = false }) => {
  if (!courseData) return null;

  const totalLessons = courseData.chapters?.reduce((acc, c) => acc + (c.lessons?.length || 0), 0) || 0;
  const revenue = (courseData.studentsCount || 0) * (courseData.price || 0);

  return (
    <div className="course-detail-view-container admin-content-fade-in">
      <div className="section-header">
        <div className="review-header">
          {onBack && (
            <button className="review-back-btn" onClick={onBack} title="Quay lại">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="content-title">
            {isReviewMode ? 'Review' : 'Chi tiết'} Khóa học: {courseData.title}
          </h2>
          <span className={`status-badge status-${courseData.published} header-status-badge`}>
            {Number(courseData.published) === 0 ? 'Nháp' : 
             Number(courseData.published) === 1 ? 'Chờ duyệt' : 
             Number(courseData.published) === 2 ? 'Đã xuất bản' : 
             Number(courseData.published) === 3 ? 'Bị từ chối' : 'Tạm gỡ'}
          </span>
        </div>
      </div>

      <div className="course-review-grid">
        <div className="course-review-main">
          <div className="review-card">
            <div className="review-course-header">
              <img src={courseData.thumbnail || 'https://via.placeholder.com/320x180'} alt="" className="review-thumb" />
              <div className="review-info">
                <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '8px' }}>{courseData.title}</h3>
                <p className="instructor-info" style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '12px' }}>
                  Giảng viên: <strong style={{ color: '#4f46e5' }}>{courseData.instructor?.name}</strong> ({courseData.instructor?.email || courseData.instructorId})
                </p>
                <div className="review-meta" style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <span className="course-category-badge">{courseData.category}</span>
                  <span className="price-tag" style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                    {courseData.isPro ? (courseData.price ? `${courseData.price.toLocaleString()}đ` : 'Trả phí') : 'Miễn phí'}
                  </span>
                  <span className="level-tag" style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                    {courseData.level}
                  </span>
                </div>
                <p className="course-desc-preview" style={{ color: '#475569', fontSize: '0.875rem', lineHeight: '1.6' }}>{courseData.description}</p>
              </div>
            </div>
          </div>

          <div className="review-curriculum" style={{ marginTop: '25px' }}>
            <h3 className="review-sub-title" style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>Nội dung khóa học</h3>
            {courseData.chapters?.length > 0 ? (
              <div className="review-chapters" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {courseData.chapters.map((chapter, cIdx) => (
                  <div key={chapter.id} className="review-chapter-card">
                    <div className="chapter-header">
                      <h4 className="chapter-title" style={{ fontSize: '0.95rem', color: '#334155' }}>Chương {cIdx + 1}: {chapter.title}</h4>
                      <span className="lesson-count">{chapter.lessons?.length || 0} bài học</span>
                    </div>
                    <div className="review-lessons">
                      {chapter.lessons?.map((lesson, lIdx) => (
                        <div key={lesson.id} className="review-lesson-item">
                          <div className="lesson-main-info">
                            <span className="lesson-order">{lIdx + 1}</span>
                            <span className="lesson-title">{lesson.title}</span>
                            {lesson.isFree && <span className="free-badge">Học thử</span>}
                          </div>
                          <div className="lesson-meta-info">
                            <span className="lesson-duration"><Clock size={14} /> {lesson.duration}p</span>
                            {lesson.quiz && <span className="quiz-badge"><HelpCircle size={14} /> Có quiz</span>}
                            {lesson.videoUrl && <button className="preview-video-btn" onClick={() => window.open(lesson.videoUrl, '_blank')}><Play size={12} /> Preview</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Khóa học này chưa có nội dung chương hồi.</div>
            )}
          </div>
        </div>

        <div className="course-review-sidebar">
          <div className="review-card stats-card">
            <h4 style={{ fontSize: '1rem', marginBottom: '15px', color: '#1e293b' }}>Thống kê nhanh</h4>
            <div className="stat-row">
              <span style={{ color: '#64748b' }}>Số bài học:</span>
              <strong style={{ color: '#1e293b' }}>{totalLessons}</strong>
            </div>
            <div className="stat-row">
              <span style={{ color: '#64748b' }}>Tổng thời lượng:</span>
              <strong style={{ color: '#1e293b' }}>{courseData.duration || 0} phút</strong>
            </div>
            <div className="stat-row">
              <span style={{ color: '#64748b' }}>Trạng thái:</span>
              <span className={`status-badge status-${courseData.published}`}>
                {Number(courseData.published) === 0 ? 'Nháp' : 
                 Number(courseData.published) === 1 ? 'Chờ duyệt' : 
                 Number(courseData.published) === 2 ? 'Đã xuất bản' : 
                 Number(courseData.published) === 3 ? 'Bị từ chối' : 'Tạm gỡ'}
              </span>
            </div>
            
            {!isReviewMode && (Number(courseData.published) === 2 || Number(courseData.published) === 4) && courseData.isPro && (
              <div className="stat-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ color: '#64748b' }}>Doanh thu:</span>
                <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>
                  {(revenue || 0).toLocaleString('vi-VN')}₫
                </strong>
              </div>
            )}

            {actions && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginTop: '15px' }}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailView;
