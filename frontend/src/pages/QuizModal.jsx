import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, HelpCircle } from 'lucide-react';
import axios from 'axios';
import './QuizModal.css';

const QuizModal = ({ lessonId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passingScore, setPassingScore] = useState(80);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchQuiz();
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/quizzes/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPassingScore(data.passingScore);
      setQuestions(data.questions || []);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Lỗi khi tải bài kiểm tra:", error);
      }
      // If 404, just keep empty questions
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      text: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    }]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      alert("Vui lòng thêm ít nhất một câu hỏi");
      return;
    }
    
    // Validate
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].text.trim()) {
            alert(`Câu hỏi ${i + 1} chưa có nội dung`);
            return;
        }
        if (questions[i].options.some(opt => !opt.trim())) {
            alert(`Câu hỏi ${i + 1} có lựa chọn chưa điền nội dung`);
            return;
        }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/quizzes`, {
        lessonId,
        passingScore,
        questions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Lưu bài kiểm tra thành công!");
      onClose();
    } catch (error) {
      alert("Lỗi khi lưu bài kiểm tra: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal-content">
        <div className="quiz-modal-header">
          <h3><HelpCircle size={20} /> Quản lý bài kiểm tra trắc nghiệm</h3>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="quiz-modal-body">
          <div className="quiz-config">
            <label>Điểm đạt (%) : </label>
            <input 
              type="number" 
              value={passingScore} 
              onChange={(e) => setPassingScore(e.target.value)} 
              min="0" 
              max="100"
            />
          </div>

          <div className="questions-list">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-item">
                <div className="question-item-header">
                  <h4>Câu hỏi {qIndex + 1}</h4>
                  <button className="remove-q-btn" onClick={() => handleRemoveQuestion(qIndex)}>
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
                
                <textarea 
                  placeholder="Nhập nội dung câu hỏi..."
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  rows="2"
                />

                <div className="options-grid">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="option-input-group">
                      <input 
                        type="radio" 
                        name={`correct-${qIndex}`} 
                        checked={q.correctOptionIndex === oIndex}
                        onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                      />
                      <input 
                        type="text" 
                        placeholder={`Lựa chọn ${oIndex + 1}`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="add-q-btn" onClick={handleAddQuestion}>
            <Plus size={18} /> Thêm câu hỏi mới
          </button>
        </div>

        <div className="quiz-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
