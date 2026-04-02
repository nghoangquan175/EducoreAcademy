import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommentsAPI, addCommentAPI, deleteCommentAPI, toggleCommentReactionAPI } from '../services/articleService';
import { MessageSquare, Send, Trash2, Reply, MoreVertical, Loader2, ThumbsUp, Heart, HelpCircle, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './CommentSection.css';


// Sub-component for Reputation Badge
const ReputationBadge = React.memo(({ score }) => {
  let color = '#10b981'; // green
  let label = 'Uy tín';
  if (score < 50) { color = '#ef4444'; label = 'Cảnh báo'; }
  else if (score < 80) { color = '#f59e0b'; label = 'Tích cực'; }

  return (
    <div className="reputation-badge" style={{ color }} title={`Điểm uy tín: ${score}/100`}>
      <ShieldCheck size={14} />
      <span>{score}</span>
    </div>
  );
});

// Sub-component for the Reply Form to isolate its state
const ReplyForm = ({ onSubmit, onCancel }) => {
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onSubmit(e, replyContent);
    setReplyContent('');
  };

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Viết phản hồi..." 
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        autoFocus
      />
      <button type="submit" disabled={!replyContent.trim()}><Send size={16} /></button>
      <button type="button" className="cancel-reply" onClick={onCancel}>Hủy</button>
    </form>
  );
};

// Sub-component for an Individual Comment Item
const CommentItem = React.memo(({ comment, isReply = false, user, replyingTo, setReplyingTo, handleToggleReaction, handleDeleteComment, handleAddReply }) => (
  <div className={`comment-item ${isReply ? 'reply-item' : ''}`}>
    <img 
      src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'User')}&background=random`} 
      alt="avatar" 
      className="comment-avatar" 
      loading="lazy"
    />
    <div className="comment-content-wrapper">
      <div className="comment-bubble">
        <div className="comment-header-info">
          <span className="comment-user-name">{comment.user?.name}</span>
        </div>
        <div className="comment-text">{comment.content}</div>
      </div>
      
      <div className="comment-footer">
        <div className="comment-reactions-v2">
          <div className="reaction-wrapper">
            {/* Main Display Button */}
            <button 
              className={`reaction-main-btn ${comment.userReaction ? `active-${comment.userReaction.toLowerCase()}` : ''}`}
              onClick={() => handleToggleReaction(comment.id, comment.userReaction || 'LIKE')}
            >
              {comment.userReaction === 'HEART' ? <Heart size={16} fill="currentColor" /> : 
               comment.userReaction === 'HELPFUL' ? <ShieldCheck size={16} fill="currentColor" /> : 
               <ThumbsUp size={16} fill={comment.userReaction === 'LIKE' ? 'currentColor' : 'none'} />}
              
              <span className="reaction-label">
                {comment.userReaction === 'HEART' ? 'Yêu thích' : 
                 comment.userReaction === 'HELPFUL' ? 'Hữu ích' : 'Thích'}
              </span>
            </button>

            {/* Hover Popup Options */}
            <div className="reaction-options-popup">
              <button className="option-btn like" title="Thích" onClick={() => handleToggleReaction(comment.id, 'LIKE')}>
                <ThumbsUp size={20} />
              </button>
              <button className="option-btn heart" title="Yêu thích" onClick={() => handleToggleReaction(comment.id, 'HEART')}>
                <Heart size={20} />
              </button>
              <button className="option-btn helpful" title="Hữu ích" onClick={() => handleToggleReaction(comment.id, 'HELPFUL')}>
                <ShieldCheck size={20} />
              </button>
            </div>
            {/* Counts Summary */}
            {(comment.likeCount + comment.heartCount + comment.helpfulCount) > 0 && (
              <div className="reaction-summary">
                <div className="reaction-icon-group">
                  {comment.likeCount > 0 && <ThumbsUp size={10} className="icon-like" />}
                  {comment.heartCount > 0 && <Heart size={10} className="icon-heart" />}
                  {comment.helpfulCount > 0 && <ShieldCheck size={10} className="icon-helpful" />}
                </div>
                <span className="total-count">
                  {comment.likeCount + comment.heartCount + comment.helpfulCount}
                </span>
              </div>
            )}
          </div>

          {/* Reply Button moved here */}
          {!isReply && user && (
            <button className="action-btn reply-btn-new" onClick={() => setReplyingTo(comment.id)}>
              <Reply size={14} /> Phản hồi
            </button>
          )}
        </div>
        
        <div className="comment-actions">
          <span className="comment-time">
            {new Date(comment.createdAt).toLocaleString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit', 
              day: '2-digit', 
              month: '2-digit' 
            })}
          </span>
          {(user?.id === comment.userId || user?.role === 'admin') && (
            <button className="action-btn delete" onClick={() => handleDeleteComment(comment.id)}>Xóa</button>
          )}
        </div>
      </div>

      {/* Reply Input Form */}
      {replyingTo === comment.id && (
        <ReplyForm 
          onSubmit={(e, content) => handleAddReply(e, comment.id, content)}
          onCancel={() => setReplyingTo(null)}
        />
      )}

      {/* Render nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              isReply={true} 
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              handleToggleReaction={handleToggleReaction}
              handleDeleteComment={handleDeleteComment}
              handleAddReply={handleAddReply}
            />
          ))}
        </div>
      )}
    </div>
  </div>
));

// Sub-component for the Main Comment Form
const MainCommentForm = ({ user, onSubmit, isModerating }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onSubmit(e, newComment);
    setNewComment('');
  };

  return (
    <form className="main-comment-form" onSubmit={handleSubmit}>
      <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="avatar" className="comment-avatar" />
      <div className="comment-input-wrapper">
        <textarea 
          placeholder="Viết bình luận của bạn..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isModerating}
        />
        <button type="submit" disabled={!newComment.trim() || isModerating}>
          {isModerating ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>
    </form>
  );
};



const CommentSection = ({ articleId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null); // id of comment being replied to
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState(null); // { isToxic, reason, source }
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);


  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const data = await fetchCommentsAPI(articleId, pageNum, 10);
      
      if (pageNum === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      setTotalComments(data.totalComments);
      setPage(pageNum);
      setHasMore(pageNum < data.totalPages);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (hasMore && !loadingMore && !loading) {
        loadComments(page + 1);
      }
    }
  };

  const handleAddComment = async (e, content) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      setIsModerating(true);
      const data = await addCommentAPI(articleId, { content });
      
      if (data.moderationResult?.isToxic) {
        setModerationResult(data.moderationResult);
        setShowModerationModal(true);
      } else {
        await loadComments(1);
        toast.success('Đã gửi bình luận');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi bình luận');
    } finally {
      setIsModerating(false);
    }
  };


  const handleAddReply = async (e, parentId, content) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để trả lời');
      return;
    }

    try {
      setIsModerating(true);
      const data = await addCommentAPI(articleId, { content, parentId });
      
      if (data.moderationResult?.isToxic) {
        setModerationResult(data.moderationResult);
        setShowModerationModal(true);
      } else {
        setReplyingTo(null);
        await loadComments(1);
        toast.success('Đã gửi phản hồi');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setIsModerating(false);
    }
  };


  const handleDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteCommentAPI(commentToDelete);
      loadComments(1);
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Lỗi khi xóa bình luận');
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  const handleToggleReaction = async (commentId, type) => {
    if (!user) return toast.error('Vui lòng đăng nhập để phản hồi');
    try {
      const data = await toggleCommentReactionAPI(commentId, type);
      // Update local state for immediate feedback
      setComments(prev => updateCommentReactions(prev, commentId, data));
    } catch (error) {
      toast.error('Lỗi khi phản hồi');
    }
  };

  const updateCommentReactions = (list, id, data) => {
    return list.map(c => {
      if (c.id === id) {
        return { ...c, ...data };
      }
      if (c.replies) {
        return { ...c, replies: updateCommentReactions(c.replies, id, data) };
      }
      return c;
    });
  };



  return (
    <div className="comment-section">
      <div className="comment-header">
        <MessageSquare size={20} />
        <h3>Bình luận ({totalComments})</h3>
      </div>

      {/* Main Comment Form */}
      {user ? (
        <MainCommentForm 
          user={user} 
          onSubmit={handleAddComment} 
          isModerating={isModerating} 
        />
      ) : (
        <div className="login-to-comment-prompt">
          <p>
            Bạn cần <Link to="/login" state={{ returnUrl: window.location.pathname }} className="login-link">đăng nhập</Link> hoặc <Link to="/register" state={{ returnUrl: window.location.pathname }} className="login-link">đăng ký</Link> để tham gia bình luận.
          </p>
        </div>
      )}

      {loading ? (
        <div className="comments-loading">Đang tải bình luận...</div>
      ) : (
        <div className="comments-list" onScroll={handleScroll}>
          {comments.length === 0 ? (
            <div className="no-comments">Hãy là người đầu tiên bình luận bài viết này!</div>
          ) : (
            <>
              {comments.map(comment => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  user={user}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  handleToggleReaction={handleToggleReaction}
                  handleDeleteComment={handleDeleteComment}
                  handleAddReply={handleAddReply}
                />
              ))}
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: '10px', color: 'var(--accent)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Moderation Result Modal */}

      {showModerationModal && (
        <div className="moderation-modal-overlay">
          <div className="moderation-modal">
            <div className={`moderation-modal-header ${moderationResult?.source === 'BLACKLIST' ? 'danger' : 'warning'}`}>
              <AlertTriangle size={24} />
              <h3>Bình luận bị chặn</h3>
            </div>
            <div className="moderation-modal-body">
              <p>Hệ thống tự động đã phát hiện nội dung không phù hợp trong bình luận của bạn.</p>
              <div className="moderation-reason">
                <strong>Lý do:</strong> {moderationResult?.reason}
              </div>
              <div className="moderation-stats">
                <div className="stat-item penalty">
                  <span className="stat-label">Điểm bị trừ:</span>
                  <span className="stat-value">-{moderationResult?.penalty}</span>
                </div>
                <div className="stat-item remaining">
                  <span className="stat-label">Điểm còn lại:</span>
                  <span className="stat-value">{moderationResult?.newScore}/100</span>
                </div>
              </div>
              <p className="moderation-consequence">
                Nếu tiếp tục vi phạm, tài khoản sẽ bị khóa tính năng bình luận.
              </p>
            </div>
            <div className="moderation-modal-footer">
              <button className="btn-close-modal" onClick={() => setShowModerationModal(false)}>Tôi đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="moderation-modal-overlay">
          <div className="moderation-modal delete-modal">
            <div className="moderation-modal-header danger">
              <Trash2 size={24} />
              <h3>Xác nhận xóa</h3>
            </div>
            <div className="moderation-modal-body">
              <p>Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="moderation-modal-footer">
              <button className="btn-cancel-modal" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
              <button className="btn-confirm-delete" onClick={confirmDeleteComment}>Xóa ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;

