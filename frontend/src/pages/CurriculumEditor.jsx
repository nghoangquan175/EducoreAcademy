import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Edit, Save, X, GripVertical, Check, 
  ChevronDown, ChevronUp, PlayCircle, FileText, Video
} from 'lucide-react';
import './CurriculumEditor.css';

const CurriculumEditor = ({ courseId, onClose }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [tempData, setTempData] = useState({}); // For inline editing titles

  useEffect(() => {
    fetchFullCurriculum();
  }, [courseId]);

  const fetchFullCurriculum = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/courses/instructor/${courseId}/full-curriculum`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Không thể tải giáo trình");
    } finally {
      setLoading(false);
    }
  };

  // --- CHAPTER HANDLERS ---
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const order = course.chapters ? course.chapters.length + 1 : 1;
      await axios.post(`http://localhost:5000/api/courses/${courseId}/chapters`, {
        title: newChapterTitle,
        chapterOrder: order
      }, { headers: { Authorization: `Bearer ${token}` }});
      setNewChapterTitle('');
      fetchFullCurriculum();
    } catch (error) {
       alert("Lỗi khi thêm chương");
    }
  };

  const handleUpdateChapter = async (chapterId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/courses/chapters/${chapterId}`, {
        title: tempData[chapterId]
      }, { headers: { Authorization: `Bearer ${token}` }});
      setEditingChapterId(null);
      fetchFullCurriculum();
    } catch (error) {
      alert("Lỗi khi cập nhật chương");
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Bạn có chắc muốn xóa chương này? Tất cả bài học bên trong sẽ bị mất.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/chapters/${chapterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFullCurriculum();
    } catch (error) {
      alert("Lỗi khi xóa chương");
    }
  };

  // --- LESSON HANDLERS ---
  const handleAddLesson = async (chapterId) => {
    const title = window.prompt("Nhập tên bài học mới:");
    if (!title) return;
    try {
      const token = localStorage.getItem('token');
      const chapter = course.chapters.find(c => c.id === chapterId);
      const order = chapter.lessons ? chapter.lessons.length + 1 : 1;
      await axios.post(`http://localhost:5000/api/courses/chapters/${chapterId}/lessons`, {
        title,
        lessonOrder: order,
        isFree: false
      }, { headers: { Authorization: `Bearer ${token}` }});
      fetchFullCurriculum();
    } catch (error) {
      alert("Lỗi khi thêm bài học");
    }
  };

  const handleUpdateLesson = async (lessonId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/courses/lessons/${lessonId}`, {
        ...tempData[lessonId]
      }, { headers: { Authorization: `Bearer ${token}` }});
      setEditingLessonId(null);
      fetchFullCurriculum();
    } catch (error) {
       alert("Lỗi khi cập nhật bài học");
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Xóa bài học này?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFullCurriculum();
    } catch (error) {
      alert("Lỗi khi xóa bài học");
    }
  };

  if (loading) return <div className="curriculum-loading">Đang tải giáo trình...</div>;

  return (
    <div className="curriculum-editor-container inst-content-fade-in">
      <div className="inst-section-header">
        <h2 className="inst-content-title">Quản lý Giáo trình</h2>
        <button className="inst-btn view" onClick={onClose}>Quay lại</button>
      </div>
      <p className="inst-section-desc">Thiết kế cấu trúc khóa học của bạn bằng cách thêm chương và bài học. Kéo thả để sắp xếp (v1.0 - inline update).</p>

      <div className="chapters-list">
        {course.chapters && course.chapters.map((chapter) => (
          <div key={chapter.id} className="chapter-edit-card shadow-sm">
            <div className="chapter-edit-header">
              <div className="chapter-title-group">
                <GripVertical size={20} className="drag-handle" />
                {editingChapterId === chapter.id ? (
                  <div className="inline-edit-group">
                    <input 
                      autoFocus
                      defaultValue={chapter.title}
                      onChange={(e) => setTempData({...tempData, [chapter.id]: e.target.value})}
                      className="inline-input"
                    />
                    <button className="icon-save-btn" onClick={() => handleUpdateChapter(chapter.id)}><Check size={18} /></button>
                    <button className="icon-cancel-btn" onClick={() => setEditingChapterId(null)}><X size={18} /></button>
                  </div>
                ) : (
                  <h3 onClick={() => setEditingChapterId(chapter.id)} style={{ cursor: 'pointer' }}>
                    Chương {chapter.chapterOrder}: {chapter.title}
                  </h3>
                )}
              </div>
              <div className="chapter-actions">
                <button className="chapter-action-btn delete" onClick={() => handleDeleteChapter(chapter.id)} title="Xóa chương">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="lessons-edit-list">
              {chapter.lessons && chapter.lessons.map((lesson) => (
                <div key={lesson.id} className="lesson-edit-item">
                  <div className="lesson-info">
                    {editingLessonId === lesson.id ? (
                      <div className="lesson-full-edit-form">
                        <div className="form-grid">
                          <input 
                            placeholder="Tên bài học"
                            defaultValue={lesson.title}
                            onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), title: e.target.value}})}
                          />
                          <input 
                            placeholder="Video URL (Cloudinary/YouTube)"
                            defaultValue={lesson.videoUrl}
                            onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), videoUrl: e.target.value}})}
                          />
                          <div className="flex-row">
                             <input 
                                placeholder="Thời lượng (vd: 10:20)"
                                defaultValue={lesson.duration}
                                onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), duration: e.target.value}})}
                             />
                             <label className="free-preview-toggle">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={lesson.isFree} 
                                  onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), isFree: e.target.checked}})}
                                />
                                Học thử
                             </label>
                          </div>
                        </div>
                        <div className="lesson-edit-footer">
                          <button className="btn-small save" onClick={() => handleUpdateLesson(lesson.id)}>Lưu</button>
                          <button className="btn-small cancel" onClick={() => setEditingLessonId(null)}>Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <PlayCircle size={16} className="lesson-icon" />
                        <span className="lesson-name">{lesson.title}</span>
                        {lesson.isFree && <span className="badge preview">Học thử</span>}
                        <span className="lesson-time">{lesson.duration || '--:--'}</span>
                      </>
                    )}
                  </div>
                  {!editingLessonId && (
                    <div className="lesson-actions">
                      <button className="lesson-action-btn edit" onClick={() => {
                        setEditingLessonId(lesson.id);
                        setTempData({...tempData, [lesson.id]: {
                          title: lesson.title,
                          videoUrl: lesson.videoUrl,
                          duration: lesson.duration,
                          isFree: lesson.isFree
                        }});
                      }}>
                        <Edit size={16} />
                      </button>
                      <button className="lesson-action-btn delete" onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button className="add-lesson-btn" onClick={() => handleAddLesson(chapter.id)}>
                <Plus size={16} /> Thêm bài học mới
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="add-chapter-foot shadow-sm">
        <input 
          type="text" 
          placeholder="Tên chương mới... (vd: Giới thiệu căn bản)" 
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
        />
        <button className="inst-add-btn primary" onClick={handleAddChapter}>
          <Plus size={18} /> Thêm Chương
        </button>
      </div>
    </div>
  );
};

export default CurriculumEditor;
