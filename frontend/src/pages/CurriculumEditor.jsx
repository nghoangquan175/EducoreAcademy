import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Edit, Save, X, GripVertical, Check, 
  ChevronDown, ChevronUp, PlayCircle, FileText, Video
} from 'lucide-react';
import './CurriculumEditor.css';
import QuizModal from './QuizModal';

const CurriculumEditor = ({ courseId, onClose }) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [addingLessonToChapterId, setAddingLessonToChapterId] = useState(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    duration: '',
    isFree: false,
    videoUrl: '',
    videoSource: 'link' // 'link' or 'upload'
  });
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);
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
    if (!newLesson.title.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const chapter = course.chapters.find(c => c.id === chapterId);
      const order = chapter.lessons ? chapter.lessons.length + 1 : 1;
      await axios.post(`http://localhost:5000/api/courses/chapters/${chapterId}/lessons`, {
        ...newLesson,
        lessonOrder: order
      }, { headers: { Authorization: `Bearer ${token}` }});
      
      setNewLesson({
        title: '',
        duration: '',
        isFree: false,
        videoUrl: '',
        videoSource: 'link'
      });
      setAddingLessonToChapterId(null);
      fetchFullCurriculum();
    } catch (error) {
      alert("Lỗi khi thêm bài học");
    }
  };

  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setUploadingLessonVideo(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setNewLesson({ ...newLesson, videoUrl: res.data.url });
    } catch (error) {
      console.error("Upload video error:", error);
      alert('Tải video thất bại');
    } finally {
      setUploadingLessonVideo(false);
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

  if (loading) return <div className="cur-curriculum-loading">Đang tải giáo trình...</div>;

  return (
    <div className="cur-curriculum-editor-container inst-content-fade-in">
      <div className="inst-section-header">
        <h2 className="inst-content-title">Quản lý Giáo trình</h2>
        <button className="inst-btn view" onClick={onClose}>Quay lại</button>
      </div>
      <p className="inst-section-desc">Thiết kế cấu trúc khóa học của bạn bằng cách thêm chương và bài học. Kéo thả để sắp xếp (v1.0 - inline update).</p>

      <div className="cur-chapters-list">
        {course.chapters && course.chapters.map((chapter) => (
          <div key={chapter.id} className="cur-chapter-edit-card shadow-sm">
            <div className="cur-chapter-edit-header">
              <div className="cur-chapter-title-group">
                <GripVertical size={20} className="cur-drag-handle" />
                {editingChapterId === chapter.id ? (
                  <div className="cur-inline-edit-group">
                    <input 
                      autoFocus
                      defaultValue={chapter.title}
                      onChange={(e) => setTempData({...tempData, [chapter.id]: e.target.value})}
                      className="cur-inline-input"
                    />
                    <button className="cur-icon-save-btn" onClick={() => handleUpdateChapter(chapter.id)}><Check size={18} /></button>
                    <button className="cur-icon-cancel-btn" onClick={() => setEditingChapterId(null)}><X size={18} /></button>
                  </div>
                ) : (
                  <h3 onClick={() => setEditingChapterId(chapter.id)} style={{ cursor: 'pointer' }}>
                    Chương {chapter.chapterOrder}: {chapter.title}
                  </h3>
                )}
              </div>
              <div className="cur-chapter-actions">
                <button className="cur-chapter-action-btn delete" onClick={() => handleDeleteChapter(chapter.id)} title="Xóa chương">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="cur-lessons-edit-list">
              {chapter.lessons && chapter.lessons.map((lesson) => (
                <div key={lesson.id} className="cur-lesson-edit-item">
                  <div className="cur-lesson-info">
                    {editingLessonId === lesson.id ? (
                      <div className="cur-lesson-full-edit-form">
                        <div className="cur-form-grid">
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
                          <div className="cur-flex-row">
                             <input 
                                placeholder="Thời lượng (vd: 10:20)"
                                defaultValue={lesson.duration}
                                onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), duration: e.target.value}})}
                             />
                             <label className="cur-free-preview-toggle">
                                <input 
                                  type="checkbox" 
                                  defaultChecked={lesson.isFree} 
                                  onChange={(e) => setTempData({...tempData, [lesson.id]: {...(tempData[lesson.id] || {}), isFree: e.target.checked}})}
                                />
                                Học thử
                             </label>
                          </div>
                        </div>
                        <div className="cur-lesson-edit-footer">
                          <button className="cur-btn-small save" onClick={() => handleUpdateLesson(lesson.id)}>Lưu</button>
                          <button className="cur-btn-small cancel" onClick={() => setEditingLessonId(null)}>Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <PlayCircle size={16} className="cur-lesson-icon" />
                        <span className="cur-lesson-name">{lesson.title}</span>
                        {lesson.isFree && <span className="cur-badge preview">Học thử</span>}
                        <span className="cur-lesson-time">{lesson.duration || '--:--'}</span>
                      </>
                    )}
                  </div>
                  {!editingLessonId && (
                    <div className="cur-lesson-actions">
                      <button className="cur-lesson-action-btn edit" onClick={() => {
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
                      <button className="cur-lesson-action-btn delete" onClick={() => handleDeleteLesson(lesson.id)}>
                        <Trash2 size={16} />
                      </button>
                      <button 
                        className="cur-lesson-action-btn quiz" 
                        title="Quản lý bài kiểm tra"
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          setShowQuizModal(true);
                        }}
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {addingLessonToChapterId === chapter.id ? (
                <div className="cur-add-lesson-inline-form-full">
                  <div className="cur-form-grid">
                    <div className="cur-form-group-row">
                      <input 
                        autoFocus
                        placeholder="Tên bài học mới..."
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                        className="title-input"
                      />
                      <input 
                        placeholder="Thời lượng (vd: 12:45)"
                        value={newLesson.duration}
                        onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                        className="duration-input"
                      />
                    </div>
                    
                    <div className="cur-video-source-box">
                      <div className="cur-source-tabs">
                        <button 
                          className={`cur-source-tab ${newLesson.videoSource === 'link' ? 'active' : ''}`}
                          onClick={() => setNewLesson({ ...newLesson, videoSource: 'link', videoUrl: '' })}
                        >
                          Dán link video
                        </button>
                        <button 
                          className={`cur-source-tab ${newLesson.videoSource === 'upload' ? 'active' : ''}`}
                          onClick={() => setNewLesson({ ...newLesson, videoSource: 'upload', videoUrl: '' })}
                        >
                          Tải lên video
                        </button>
                      </div>
                      
                      {newLesson.videoSource === 'link' ? (
                        <input 
                          placeholder="Dán link video (Cloudinary/YouTube...)"
                          value={newLesson.videoUrl}
                          onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                        />
                      ) : (
                        <div className="cur-lesson-upload-area">
                          <input 
                            type="file" 
                            id="lesson-video-upload" 
                            accept="video/*" 
                            onChange={handleLessonVideoUpload} 
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="lesson-video-upload" className="cur-lesson-upload-label">
                            {uploadingLessonVideo ? 'Đang tải lên...' : newLesson.videoUrl ? 'Đã tải xong' : 'Chọn video'}
                          </label>
                          {newLesson.videoUrl && <span className="cur-upload-success-check"><Check size={16} /></span>}
                        </div>
                      )}
                    </div>

                    <div className="cur-form-footer-row">
                      <label className="cur-free-preview-toggle">
                        <input 
                          type="checkbox" 
                          checked={newLesson.isFree} 
                          onChange={(e) => setNewLesson({ ...newLesson, isFree: e.target.checked })}
                        />
                        Học thử
                      </label>
                      <div className="add-lesson-actions">
                        <button className="cur-btn-small save" onClick={() => handleAddLesson(chapter.id)} disabled={uploadingLessonVideo}>Thêm Bài Học</button>
                        <button className="cur-btn-small cancel" onClick={() => setAddingLessonToChapterId(null)}>Hủy</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button className="cur-add-lesson-btn" onClick={() => {
                  setAddingLessonToChapterId(chapter.id);
                  setNewLesson({ title: '', duration: '', isFree: false, videoUrl: '', videoSource: 'link' });
                }}>
                  <Plus size={16} /> Thêm bài học mới
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="cur-add-chapter-foot shadow-sm">
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
      {showQuizModal && (
        <QuizModal 
          lessonId={selectedLessonId} 
          onClose={() => {
            setShowQuizModal(false);
            setSelectedLessonId(null);
          }} 
        />
      )}
    </div>
  );
};

export default CurriculumEditor;
