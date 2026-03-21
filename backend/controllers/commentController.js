const { Comment, User, Article } = require('../models');

exports.addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const { id: articleId } = req.params;
    const userId = req.user.id;

    // Check if article exists
    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Bình luận cha không tồn tại' });
      }
    }

    const comment = await Comment.create({
      content,
      articleId,
      userId,
      parentId
    });

    // Include user info in response
    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }]
    });

    res.status(201).json(commentWithUser);
  } catch (error) {
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
      where: { articleId, parentId: null }, // Fetch top-level comments first
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
        {
          model: Comment,
          as: 'replies',
          include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar'] }],
          order: [['createdAt', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      comments,
      totalPages: Math.ceil(count / limit),
      totalComments: count
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
