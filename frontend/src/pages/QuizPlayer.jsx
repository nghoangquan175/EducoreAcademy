import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, HelpCircle } from 'lucide-react';
import axios from 'axios';
import './QuizPlayer.css';

const QuizPlayer = ({ lessonId, onPass, onNextLesson, initialReviewMode }) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(initialReviewMode || false);

  useEffect(() => {
    setReviewMode(initialReviewMode || false);
  }, [initialReviewMode]);

  useEffect(() => {
    fetchQuiz();
    setResult(null);
    setAnswers({});
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch Quiz
      const quizRes = await axios.get(`http://localhost:5000/api/quizzes/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuiz(quizRes.data);

      // Fetch Latest Attempt if exists and we are in review mode
      const attemptRes = await axios.get(`http://localhost:5000/api/quizzes/lesson/${lessonId}/latest-attempt`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (attemptRes.data && initialReviewMode) {
        setResult(attemptRes.data);
        const savedAnswers = {};
        attemptRes.data.userAnswers.forEach((ans, idx) => {
          savedAnswers[idx] = ans;
        });
        setAnswers(savedAnswers);
      }
    } catch (error) {
      console.error("Lỗi khi tải bài kiểm tra:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qIndex, oIndex) => {
    if (result) return;
    setAnswers({ ...answers, [qIndex]: oIndex });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      alert("Vui lòng trả lời hết các câu hỏi!");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`http://localhost:5000/api/quizzes/${quiz.id}/submit`, {
        answers: Object.values(answers)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResult(data);
      if (data.status === 'passed') {
        onPass();
      }
    } catch (error) {
      alert("Lỗi khi nộp bài: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setReviewMode(false);
  };

  if (loading) return <div className="quiz-player-loading">Đang tải câu hỏi...</div>;
  if (!quiz) return null;

  if (result && !reviewMode) {
    return (
      <div className={`quiz-result-container ${result.status}`}>
        {result.status === 'passed' ? (
          <div className="result-card">
            <CheckCircle2 size={64} className="icon-success" />
            <h2>Chúc mừng! Bạn đã vượt qua</h2>
            <div className="score-badge">{result.score}%</div>
            <p>Bạn đã hoàn thành bài kiểm tra.</p>
            <div className="result-actions">
              <button className="btn-review" onClick={() => setReviewMode(true)}>
                Xem lại đáp án
              </button>
              <button className="btn-retry" onClick={handleRetake}>
                Làm lại bài
              </button>
              {onNextLesson && (
                <button className="btn-continue" onClick={onNextLesson}>
                  Bài học tiếp theo <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="result-card">
            <XCircle size={64} className="icon-fail" />
            <h2>Rất tiếc! Bạn chưa đạt</h2>
            <div className="score-badge fail">{result.score}%</div>
            <p>Bạn cần đạt ít nhất {quiz.passingScore}% để vượt qua.</p>
            <div className="result-actions">
              <button className="btn-review" onClick={() => setReviewMode(true)}>
                Xem lại lỗi
              </button>
              <button className="btn-retry" onClick={handleRetake}>
                Thử lại ngay
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-player-container">
      <div className="quiz-player-header">
        <HelpCircle size={24} />
        <div>
          <h3>{reviewMode ? 'Xem lại bài kiểm tra' : 'Kiểm tra kiến thức'}</h3>
          <p>{reviewMode ? `Điểm đạt được: ${result.score}%` : `Hoàn thành đúng trên ${quiz.passingScore}% để tiếp tục`}</p>
        </div>
      </div>

      <div className="quiz-questions">
        {quiz.questions.map((q, qIndex) => {
          const isCorrect = answers[qIndex] === q.correctOptionIndex;
          
          return (
            <div key={qIndex} className={`quiz-question-card ${reviewMode ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
              <h4>Câu {qIndex + 1}: {q.text}</h4>
              <div className="quiz-options">
                {q.options.map((opt, oIndex) => {
                  let statusClass = "";
                  if (reviewMode) {
                    if (oIndex === q.correctOptionIndex) statusClass = "correct-opt";
                    if (answers[qIndex] === oIndex && !isCorrect) statusClass = "wrong-opt";
                  }

                  return (
                    <div 
                      key={oIndex} 
                      className={`quiz-option-item ${answers[qIndex] === oIndex ? 'selected' : ''} ${statusClass}`}
                      onClick={() => !reviewMode && handleOptionSelect(qIndex, oIndex)}
                    >
                      <div className="option-radio"></div>
                      <span>{opt}</span>
                      {reviewMode && oIndex === q.correctOptionIndex && (
                        <CheckCircle2 size={16} className="feedback-icon" />
                      )}
                      {reviewMode && answers[qIndex] === oIndex && !isCorrect && (
                        <XCircle size={16} className="feedback-icon" />
                      )}
                    </div>
                  );
                })}
              </div>
              {reviewMode && (
                <div className={`question-feedback ${isCorrect ? 'passed' : 'failed'}`}>
                  {isCorrect ? 'Chính xác!' : `Sai rồi. Đáp án đúng là: ${q.options[q.correctOptionIndex]}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!reviewMode && (
        <div className="quiz-player-footer">
          <button 
            className="btn-submit-quiz" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Đang chấm điểm...' : 'Nộp bài và Kiểm tra'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
