import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommentsAPI, addCommentAPI, deleteCommentAPI } from '../services/articleService';
import { MessageSquare, Send, Trash2, Reply, MoreVertical, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './CommentSection.css';

const CommentSection = ({ articleId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // id of comment being replied to
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    try {
      await addCommentAPI(articleId, { content: newComment });
      setNewComment('');
      loadComments(1);
      toast.success('Đã gửi bình luận');
    } catch (error) {
      toast.error('Lỗi khi gửi bình luận');
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) {
      toast.error('Vui lòng đăng nhập để trả lời');
      return;
    }

    try {
      await addCommentAPI(articleId, { content: replyContent, parentId });
      setReplyContent('');
      setReplyingTo(null);
      loadComments(1);
      toast.success('Đã gửi phản hồi');
    } catch (error) {
      toast.error('Lỗi khi gửi phản hồi');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await deleteCommentAPI(commentId);
      loadComments(1);
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Lỗi khi xóa bình luận');
    }
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <div className={`comment-item ${isReply ? 'reply-item' : ''}`}>
      <img src={comment.user?.avatar || "https://i.pravatar.cc/150"} alt="avatar" className="comment-avatar" />
      <div className="comment-content-wrapper">
        <div className="comment-bubble">
          <div className="comment-user-name">{comment.user?.name}</div>
          <div className="comment-text">{comment.content}</div>
        </div>
        <div className="comment-actions">
          <span className="comment-time">{new Date(comment.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
          {!isReply && user && (
            <button className="action-btn" onClick={() => setReplyingTo(comment.id)}>Phản hồi</button>
          )}
          {(user?.id === comment.userId || user?.role === 'admin') && (
            <button className="action-btn delete" onClick={() => handleDeleteComment(comment.id)}>Xóa</button>
          )}
        </div>

        {/* Reply Input Form */}
        {replyingTo === comment.id && (
          <form className="reply-form" onSubmit={(e) => handleAddReply(e, comment.id)}>
            <input 
              type="text" 
              placeholder="Viết phản hồi..." 
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              autoFocus
            />
            <button type="submit" disabled={!replyContent.trim()}><Send size={16} /></button>
            <button type="button" className="cancel-reply" onClick={() => setReplyingTo(null)}>Hủy</button>
          </form>
        )}

        {/* Render nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies-container">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="comment-section">
      <div className="comment-header">
        <MessageSquare size={20} />
        <h3>Bình luận ({totalComments})</h3>
      </div>

      {/* Main Comment Form */}
      {user ? (
        <form className="main-comment-form" onSubmit={handleAddComment}>
          <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="avatar" className="comment-avatar" />
          <div className="comment-input-wrapper">
            <textarea 
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={!newComment.trim()}>
              <Send size={18} />
            </button>
          </div>
        </form>
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
                <CommentItem key={comment.id} comment={comment} />
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
    </div>
  );
};

export default CommentSection;
