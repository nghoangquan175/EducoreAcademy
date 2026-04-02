const { Comment, User, Article, CommentReaction } = require('../models');
const { runModerationPipeline } = require('../services/moderationPipeline');
const { adjustReputation, PENALTIES, REWARDS, isUserMuted } = require('../services/reputationService');
const { sequelize } = require('../config/db');


exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const { id: articleId } = req.params;
    const userId = req.user.id;

    // 0. Check if user is muted
    const user = await User.findByPk(userId);
    if (isUserMuted(user)) {
      return res.status(403).json({
        message: 'Tài khoản của bạn hiện đang bị tạm khóa tương tác do vi phạm quy chuẩn cộng đồng.',
        mutedUntil: user.mutedUntil
      });
    }

    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Bình luận cha không tồn tại' });
      }
    }

    // 1. Run Moderation Pipeline
    const moderation = await runModerationPipeline(content);

    const commentData = {
      content,
      articleId,
      userId,
      parentId,
      status: moderation.isToxic ? 'REJECTED' : 'PUBLISHED',
      moderationSource: moderation.source || null,
      moderationReason: moderation.reason || null
    };

    const comment = await Comment.create(commentData);

    // 2. Penalize if toxic
    if (moderation.isToxic) {
      const penaltyAmount = PENALTIES[moderation.source] || 10;
      const repResult = await adjustReputation(userId, -penaltyAmount, `Bình luận vi phạm (${moderation.source}): ${moderation.reason}`);

      return res.status(201).json({
        message: 'Bình luận của bạn vi phạm quy chuẩn và đã bị chặn.',
        moderationResult: {
          isToxic: true,
          reason: moderation.reason,
          source: moderation.source,
          penalty: penaltyAmount,
          newScore: repResult?.score
        },
        comment: comment
      });
    }

    // Include user info in response for successful comment
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.getArticleComments = async (req, res) => {
  try {
    const { id: articleId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await Comment.findAndCountAll({
      where: { articleId, parentId: null, status: 'PUBLISHED' }, // Only show published comments
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'reputationScore'] },
        {
          model: Comment,
          as: 'replies',
          where: { status: 'PUBLISHED' },
          required: false,
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar', 'reputationScore'] }],
          order: [['createdAt', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const totalComments = await Comment.count({
      where: { articleId, status: 'PUBLISHED' }
    });


    const currentUserId = req.user?.id;
    let commentsWithUserReaction = comments;

    if (currentUserId) {
      // Find user's reactions for these comments efficiently
      const commentIds = comments.map(c => c.id);
      const userReactions = await CommentReaction.findAll({
        where: { userId: currentUserId, commentId: commentIds }
      });

      const reactionMap = userReactions.reduce((map, r) => {
        map[r.commentId] = r.type;
        return map;
      }, {});

      commentsWithUserReaction = comments.map(c => {
        const plainComment = c.get({ plain: true });
        plainComment.userReaction = reactionMap[c.id] || null;
        return plainComment;
      });
    }

    res.json({
      comments: commentsWithUserReaction,
      totalPages: Math.ceil(count / limit),
      totalComments: totalComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    // Check if owner or admin
    if (comment.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này' });
    }

    await comment.destroy();
    res.json({ message: 'Đã xóa bình luận' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body; // 'LIKE', 'HEART', 'HELPFUL'
    const userId = req.user.id;

    if (!['LIKE', 'HEART', 'HELPFUL'].includes(type)) {
      return res.status(400).json({ message: 'Loại phản hồi không hợp lệ' });
    }

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Bình luận không tồn tại' });
    }

    const transaction = await sequelize.transaction();
    try {
      // 1. Check existing reaction
      const existingReaction = await CommentReaction.findOne({
        where: { userId, commentId },
        transaction
      });

      let action = '';
      if (existingReaction) {
        if (existingReaction.type === type) {
          // Toggle off
          await existingReaction.destroy({ transaction });
          action = 'REMOVED';
        } else {
          // Change type
          existingReaction.type = type;
          await existingReaction.save({ transaction });
          action = 'CHANGED';
        }
      } else {
        // Add new
        await CommentReaction.create({ userId, commentId, type }, { transaction });
        action = 'ADDED';
      }

      // 2. Recalculate counts in Comment
      const likeCount = await CommentReaction.count({ where: { commentId, type: 'LIKE' }, transaction });
      const heartCount = await CommentReaction.count({ where: { commentId, type: 'HEART' }, transaction });
      const helpfulCount = await CommentReaction.count({ where: { commentId, type: 'HELPFUL' }, transaction });

      await comment.update({ likeCount, heartCount, helpfulCount }, { transaction });

      // 3. Optional: Reward Author
      if (action === 'ADDED' && comment.userId !== userId) {
        const rewardKey = type === 'HELPFUL' ? 'HELPFUL_COMMENT' : 'COMMENT_LIKED';
        await adjustReputation(comment.userId, REWARDS[rewardKey], `Nhận được phản hồi ${type} từ người dùng khác.`);
      }

      await transaction.commit();
      res.json({
        action,
        userReaction: action === 'REMOVED' ? null : type,
        likeCount,
        heartCount,
        helpfulCount
      });
    } catch (error) {
      // ⚠️ Important for MSSQL: Only rollback if actually started and not auto-aborted
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          // Ignore rollback error to let the original error propagate
          console.error('Rollback failed (possibly already aborted by MSSQL):', rollbackError.message);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Toggle reaction error:', error);
    res.status(500).json({ message: error.message });
  }
};

