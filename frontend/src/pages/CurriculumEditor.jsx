import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Edit, Save, X, GripVertical, Check, 
  ChevronDown, ChevronUp, PlayCircle, FileText, Video, Paperclip
} from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
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
    content: '',
    attachmentUrl: '',
    videoSource: 'upload'
  });
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
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

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const totalSeconds = parseInt(seconds);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        content: '',
        attachmentUrl: '',
        videoSource: 'upload'
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
      setNewLesson(prev => ({ ...prev, videoUrl: res.data.url, duration: String(res.data.duration || 0) }));
    } catch (error) {
      console.error("Upload video error:", error);
      alert('Tải video thất bại');
    } finally {
      setUploadingLessonVideo(false);
    }
  };

  const handleLessonAttachmentUpload = async (e, lessonId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('attachment', file);

    setUploadingAttachment(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/upload/attachment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      if (lessonId) {
          setTempData(prev => ({...prev, [lessonId]: {...(prev[lessonId] || {}), attachmentUrl: res.data.url}}));
      } else {
          setNewLesson(prev => ({ ...prev, attachmentUrl: res.data.url }));
      }
    } catch (error) {
      console.error("Upload attachment error:", error);
      alert('Tải file đính kèm thất bại');
    } finally {
      setUploadingAttachment(false);
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
                      onChange={(e) => setTempData(prev => ({...prev, [chapter.id]: e.target.value}))}
                      className="cur-inline-input"
                    />
                    <button className="cur-icon-save-btn" onClick={() => handleUpdateChapter(chapter.id)}><Check size={18} /></button>
                    <button className="cur-icon-cancel-btn" onClick={() => setEditingChapterId(null)}><X size={18} /></button>
                  </div>
                ) : (
                  <h3 onClick={() => setEditingChapterId(chapter.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Chương {chapter.chapterOrder}: {chapter.title}
                    <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                       {formatDuration(chapter.duration)}
                    </span>
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
                            onChange={(e) => setTempData(prev => ({...prev, [lesson.id]: {...(prev[lesson.id] || {}), title: e.target.value}}))}
                          />
                          <div className="cur-upload-row" style={{ marginTop: '10px' }}>
                            <div className="cur-lesson-upload-area">
                              <label className="cur-field-label">Video bài học:</label>
                              <input 
                                type="file" 
                                id={`lesson-video-edit-${lesson.id}`} 
                                accept="video/*" 
                                onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const formData = new FormData();
                                  formData.append('video', file);
                                  setUploadingLessonVideo(true);
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await axios.post('http://localhost:5000/api/upload/video', formData, {
                                      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
                                    });
                                    setTempData(prev => ({...prev, [lesson.id]: {...(prev[lesson.id] || {}), videoUrl: res.data.url, duration: String(res.data.duration || 0)}}));
                                  } catch (err) { alert('Tải video thất bại'); }
                                  finally { setUploadingLessonVideo(false); }
                                }} 
                                style={{ display: 'none' }}
                              />
                              <label htmlFor={`lesson-video-edit-${lesson.id}`} className="cur-lesson-upload-label">
                                <Video size={32} />
                                <span>{uploadingLessonVideo ? 'Đang tải...' : (tempData[lesson.id]?.videoUrl || lesson.videoUrl) ? 'Thay đổi video' : 'Tải lên video'}</span>
                              </label>
                              {(tempData[lesson.id]?.videoUrl || lesson.videoUrl) && <div className="cur-upload-status success">
                                <Check size={16} /> Đã có video
                              </div>}
                              <small className="cur-upload-note">Định dạng: mp4, avi, mov. Tối đa 100MB.</small>
                            </div>

                            <div className="cur-lesson-upload-area">
                              <label className="cur-field-label">Tài liệu đính kèm (PDF, DOC):</label>
                              <input type="file" id={`lesson-doc-edit-${lesson.id}`} accept=".pdf,.doc,.docx" onChange={(e) => handleLessonAttachmentUpload(e, lesson.id)} style={{ display: 'none' }} />
                              <label htmlFor={`lesson-doc-edit-${lesson.id}`} className="cur-lesson-upload-label">
                                <Paperclip size={32} />
                                <span>{uploadingAttachment ? 'Đang tải...' : (tempData[lesson.id]?.attachmentUrl || lesson.attachmentUrl) ? 'Thay đổi tài liệu' : 'Tải lên tài liệu'}</span>
                              </label>
                              {(tempData[lesson.id]?.attachmentUrl || lesson.attachmentUrl) && <div className="cur-upload-status success">
                                <Check size={16} /> Đã có tài liệu
                              </div>}
                              <small className="cur-upload-note">Định dạng: pdf, doc, docx. Tối đa 10MB.</small>
                            </div>
                          </div>
                          
                          <div className="cur-content-row" style={{ marginTop: '15px' }}>
                             <label className="cur-field-label">Nội dung bài viết:</label>
                             <RichTextEditor 
                               value={(tempData[lesson.id]?.content !== undefined) ? tempData[lesson.id].content : (lesson.content || '')} 
                               onChange={(content) => setTempData(prev => ({...prev, [lesson.id]: {...(prev[lesson.id] || {}), content}}))} 
                             />
                          </div>
                        </div>
                        <div className="cur-lesson-edit-footer">
                          <button className="cur-btn-small save" onClick={() => handleUpdateLesson(lesson.id)} disabled={uploadingLessonVideo || uploadingAttachment || (!(tempData[lesson.id]?.videoUrl || lesson.videoUrl) && !(((tempData[lesson.id]?.content !== undefined) ? tempData[lesson.id].content : lesson.content) || '').replace(/<[^>]*>?/gm, '').trim())}>Lưu</button>
                          <button className="cur-btn-small cancel" onClick={() => setEditingLessonId(null)}>Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <PlayCircle size={16} className="cur-lesson-icon" />
                        <span className="cur-lesson-name">{lesson.title}</span>
                        <span className="cur-lesson-time">{formatDuration(tempData[lesson.id]?.duration || lesson.duration)}</span>
                      </>
                    )}
                  </div>
                  {!editingLessonId && (
                    <div className="cur-lesson-actions">
                      <button className="cur-lesson-action-btn edit" onClick={() => {
                        setEditingLessonId(lesson.id);
                        setTempData(prev => ({...prev, [lesson.id]: {
                          title: lesson.title,
                          videoUrl: lesson.videoUrl,
                          content: lesson.content || '',
                          attachmentUrl: lesson.attachmentUrl || '',
                          duration: lesson.duration,
                          isFree: lesson.isFree
                        }}));
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
                        onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                        className="title-input"
                      />
                    </div>
                    
                    <div className="cur-video-source-box">
                      <div className="cur-upload-row">
                        <div className="cur-lesson-upload-area">
                          <label className="cur-field-label">Video bài học:</label>
                          <input 
                            type="file" 
                            id="lesson-video-upload" 
                            accept="video/*" 
                            onChange={handleLessonVideoUpload} 
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="lesson-video-upload" className="cur-lesson-upload-label">
                            <Video size={32} />
                            <span>{uploadingLessonVideo ? 'Đang tải video lên...' : newLesson.videoUrl ? 'Video đã tải lên thành công' : 'Nhấn để tải video bài học lên'}</span>
                          </label>
                          {newLesson.videoUrl && <div className="cur-upload-status success">
                             <Check size={16} /> Link video đã sẵn sàng
                          </div>}
                          <small className="cur-upload-note">Định dạng: mp4, avi, mov. Tối đa 100MB.</small>
                        </div>

                        <div className="cur-lesson-upload-area">
                          <label className="cur-field-label">Tài liệu đính kèm (PDF, DOC):</label>
                          <input type="file" id="lesson-doc-upload" accept=".pdf,.doc,.docx" onChange={(e) => handleLessonAttachmentUpload(e)} style={{ display: 'none' }} />
                          <label htmlFor="lesson-doc-upload" className="cur-lesson-upload-label">
                            <Paperclip size={32} />
                            <span>{uploadingAttachment ? 'Đang tải tài liệu lên...' : newLesson.attachmentUrl ? 'Tài liệu đã tải lên thành công' : 'Nhấn để tải tài liệu đính kèm lên'}</span>
                          </label>
                          {newLesson.attachmentUrl && <div className="cur-upload-status success">
                             <Check size={16} /> Tài liệu đã sẵn sàng
                          </div>}
                          <small className="cur-upload-note">Định dạng: pdf, doc, docx. Tối đa 10MB.</small>
                        </div>
                      </div>

                      <div className="cur-content-row" style={{ marginTop: '5px' }}>
                        <label className="cur-field-label">Nội dung bài viết:</label>
                        <RichTextEditor value={newLesson.content} onChange={(content) => setNewLesson(prev => ({ ...prev, content }))} />
                      </div>
                    </div>

                    <div className="cur-form-footer-row" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                      <div className="add-lesson-actions">
                        <button className="cur-btn-small save" onClick={() => handleAddLesson(chapter.id)} disabled={uploadingLessonVideo || uploadingAttachment || (!newLesson.videoUrl && !(newLesson.content || '').replace(/<[^>]*>?/gm, '').trim())}>Thêm Bài Học</button>
                        <button className="cur-btn-small cancel" onClick={() => setAddingLessonToChapterId(null)}>Hủy</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button className="cur-add-lesson-btn" onClick={() => {
                  setAddingLessonToChapterId(chapter.id);
                  setNewLesson({ title: '', duration: '', isFree: false, videoUrl: '', content: '', attachmentUrl: '', videoSource: 'upload' });
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
