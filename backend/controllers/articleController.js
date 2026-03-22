const { Article, User, Enrollment, Course, Notification, ArticleLike } = require('../models');
const { sequelize } = require('../config/db');

// @desc    Get all articles with pagination
// @route   GET /api/articles
// @access  Public
exports.getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;
    const articleStatus = req.query.status !== undefined ? parseInt(req.query.status) : 2; // Default to published
    const category = req.query.category;

    const where = { articleStatus };
    if (category && category !== 'Tất cả') {
      where.category = category;
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM ArticleLikes AS likes
              WHERE
                likes.articleId = Article.id
            )`),
            'likesCount'
          ]
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Handle "Educore Academy" for admin authors
    const processedArticles = rows.map(art => {
      const articleData = art.toJSON();
      if (articleData.author && articleData.author.role === 'admin') {
        articleData.author.name = 'Educore Academy';
      }
      return articleData;
    });

    res.json({
      success: true,
      data: {
        articles: processedArticles,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('getArticles Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single article by ID
// @route   GET /api/articles/:id
// @access  Public (Conditional)
exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar', 'role']
        }
      ]
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Get likes count
    const likesCount = await ArticleLike.count({ where: { articleId: req.params.id } });
    
    // Check if current user liked it
    let isLiked = false;
    if (req.user) {
      const like = await ArticleLike.findOne({ 
        where: { articleId: req.params.id, userId: req.user.id } 
      });
      isLiked = !!like;
    }

    // If published, allow everyone
    if (article.articleStatus === 2) {
      const articleData = article.toJSON();
      if (articleData.author && articleData.author.role === 'admin') {
        articleData.author.name = 'Educore Academy';
      }
      articleData.likesCount = likesCount;
      articleData.isLiked = isLiked;
      return res.json({ success: true, data: articleData });
    }

    // If NOT published (Draft/Pending/Rejected), only allow Author or Admin
    // We rely on the frontend to pass the token if they want to preview
    // The route in articleRoutes should probably use a middleware that optionally decoeds the token
    // For now, let's use the 'protect' middleware IF the user is trying to access a non-published article?
    // Actually, it's easier to just use a middleware that doesn't 401 if token is missing.

    // For simplicity, let's just make it a standard protected route for non-published articles
    // But the route itself will be defined as public in articleRoutes.
    
    // We'll check the user from req.user (set by protect middleware if we apply it)
    if (!req.user || (article.authorId !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bản nháp này' });
    }

    const articleData = article.toJSON();
    if (articleData.author && articleData.author.role === 'admin') {
      articleData.author.name = 'Educore Academy';
    }
    articleData.likesCount = likesCount;
    articleData.isLiked = isLiked;
    res.json({ success: true, data: articleData });
  } catch (error) {
    console.error('getArticleById Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get articles for the current instructor
// @route   GET /api/articles/instructor/my-articles
// @access  Private (Instructor)
exports.getMyArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const { count, rows } = await Article.findAndCountAll({
      where: {
        authorId: req.user.id,
        [sequelize.Sequelize.Op.or]: [
          { title: { [sequelize.Sequelize.Op.like]: `%${search}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        articles: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('getMyArticles Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Check if student has PRO status
// @route   GET /api/articles/student/pro-status
// @access  Private (Student)
exports.checkStudentProStatus = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: { userId: req.user.id },
      include: [{
        model: Course,
        where: { isPro: true }
      }]
    });

    res.json({ success: true, isPro: !!enrollment });
  } catch (error) {
    console.error('checkStudentProStatus Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new article
// @route   POST /api/articles/instructor
// @access  Private (Instructor)
exports.createArticle = async (req, res) => {
  try {
    const { title, content, thumbnail, excerpt, category } = req.body;

    // Restriction for students
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        where: { userId: req.user.id },
        include: [{ model: Course, where: { isPro: true } }]
      });
      if (!enrollment) {
        return res.status(403).json({ success: false, message: 'Bạn cần sở hữu ít nhất một khóa học PRO để đăng bài viết.' });
      }
    }

    // For admins, allow direct publishing (status 2) if requested
    // Otherwise default to Draft (0)
    const initialStatus = (req.user.role === 'admin' && req.body.articleStatus == 2) ? 2 : 0;

    const article = await Article.create({
      title,
      content,
      thumbnail,
      excerpt,
      category,
      authorId: req.user.id,
      articleStatus: initialStatus
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('createArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update an article
// @route   PUT /api/articles/instructor/:id
// @access  Private (Instructor)
exports.updateArticle = async (req, res) => {
  try {
    const { title, content, thumbnail, excerpt, category } = req.body;
    let article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized: You can only edit your own articles.' });
    }

    // Only allow updating if status is Draft (0) or Rejected (3), or if admin
    if (![0, 3].includes(article.articleStatus) && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot update article in current status' });
    }

    let updateData = {
      title,
      content,
      thumbnail,
      excerpt,
      category
    };

    // If admin, allow status update to Published (2) or Draft (0)
    if (req.user.role === 'admin' && req.body.articleStatus !== undefined) {
      if ([0, 2].includes(Number(req.body.articleStatus))) {
        updateData.articleStatus = Number(req.body.articleStatus);
      }
    }

    article = await article.update(updateData);

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('updateArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete student article
// @route   DELETE /api/articles/student/:id
// @access  Private (Student)
exports.deleteArticleStudent = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, authorId: req.user.id }
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Restriction: Cannot delete if pending (1) or published (2)
    if (article.articleStatus === 1) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bài viết đang trong quá trình chờ duyệt, không thể xóa. Vui lòng thu hồi yêu cầu trước.' 
      });
    }

    if (article.articleStatus === 2) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bài viết đã được xuất bản, không thể xóa. Vui lòng liên hệ quản trị viên.' 
      });
    }

    await article.destroy();
    res.status(200).json({ success: true, message: 'Đã xóa bài viết' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Undo submit article (Return to Draft)
// @route   PATCH /api/articles/student/:id/undo-submit
// @access  Private (Student)
exports.undoSubmitArticleStudent = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { id: req.params.id, authorId: req.user.id }
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    if (article.articleStatus !== 1) {
      return res.status(400).json({ success: false, message: 'Chỉ có thể thu hồi bài viết đang chờ duyệt' });
    }

    article.articleStatus = 0; // Back to Draft
    await article.save();

    res.status(200).json({ success: true, message: 'Đã thu hồi yêu cầu phê duyệt', article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an article
// @route   DELETE /api/articles/instructor/:id
// @access  Private (Instructor)
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (article.articleStatus === 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bài viết đã xuất bản không thể xóa. Vui lòng gỡ xuống bản nháp (Draft) trước.' 
      });
    }

    // Only allow deleting if status is Draft (0) or Rejected (3), or if admin (can delete pending but not published)
    if (![0, 3].includes(article.articleStatus) && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete article in current status' });
    }

    await article.destroy();

    res.json({ success: true, message: 'Article removed' });
  } catch (error) {
    console.error('deleteArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Submit article for review
// @route   PATCH /api/articles/instructor/:id/submit
// @access  Private (Instructor)
exports.submitArticleForReview = async (req, res) => {
  try {
    let article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (![0, 3].includes(article.articleStatus)) {
      return res.status(400).json({ success: false, message: 'Article is already pending or published' });
    }

    article = await article.update({ articleStatus: 1 }); // Pending

    res.json({ success: true, data: article });
  } catch (error) {
    console.error('submitArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get pending articles for admin review
// @route   GET /api/admin/articles/pending
// @access  Private (Admin)
exports.adminGetPendingArticles = async (req, res) => {
  try {
    const search = req.query.search || '';
    const articles = await Article.findAll({
      where: { 
        articleStatus: 1,
        title: { [sequelize.Sequelize.Op.like]: `%${search}%` }
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
      order: [['updatedAt', 'ASC']]
    });
    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('adminGetPendingArticles Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Approve or Reject an article
// @route   PATCH /api/admin/articles/:id/status
// @access  Private (Admin)
exports.adminUpdateArticleStatus = async (req, res) => {
  try {
    const { status } = req.body; // 0: Draft, 2: Approved, 3: Rejected
    
    if (![0, 2, 3].includes(Number(status))) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    await article.update({ articleStatus: Number(status) });

    // Create Notification for the author
    let notifyTitle = '';
    let notifyMessage = '';
    
    if (Number(status) === 2) {
      notifyTitle = 'Bài viết đã được duyệt';
      notifyMessage = `Chúc mừng! Bài viết "${article.title}" của bạn đã được phê duyệt và xuất bản.`;
    } else if (Number(status) === 3) {
      notifyTitle = 'Bài viết bị từ chối';
      notifyMessage = `Rất tiếc, bài viết "${article.title}" của bạn đã bị từ chối phê duyệt. Vui lòng kiểm tra lại nội dung.`;
    } else if (Number(status) === 0) {
      notifyTitle = 'Bài viết đã bị gỡ';
      notifyMessage = `Bài viết "${article.title}" của bạn đã bị gỡ xuống bản nháp bởi Quản trị viên.`;
    }

    await Notification.create({
      userId: article.authorId,
      title: notifyTitle,
      message: notifyMessage,
      isRead: false
    });

    res.json({ 
      success: true,
      message: Number(status) === 2 ? 'Bài viết đã được phê duyệt' : (Number(status) === 3 ? 'Bài viết đã bị từ chối' : 'Đã gỡ bài viết xuống bản nháp')
    });
  } catch (error) {
    console.error('adminUpdateArticleStatus Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all articles for admin management (all authors, all statuses)
// @route   GET /api/admin/articles/all
// @access  Private (Admin)
exports.adminGetAllArticles = async (req, res) => {
  try {
    const search = req.query.search || '';
    const articles = await Article.findAll({
      where: {
        title: { [sequelize.Sequelize.Op.like]: `%${search}%` }
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('adminGetAllArticles Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get trash bin articles
// @route   GET /api/articles/trash
// @access  Private
exports.getTrashArticles = async (req, res) => {
  try {
    const where = {
      deletedAt: { [sequelize.Sequelize.Op.ne]: null }
    };

    // If student or instructor, only show their own deleted articles
    if (req.user.role !== 'admin') {
      where.authorId = req.user.id;
    }

    const articles = await Article.findAll({
      where,
      paranoid: false,
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'avatar'] }],
      order: [['deletedAt', 'DESC']]
    });

    res.json({ success: true, data: articles });
  } catch (error) {
    console.error('getTrashArticles Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Restore an article
// @route   PUT /api/articles/:id/restore
// @access  Private
exports.restoreArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, { paranoid: false });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Auth check
    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    await article.restore();
    res.json({ success: true, message: 'Đã khôi phục bài viết' });
  } catch (error) {
    console.error('restoreArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Force delete an article
// @route   DELETE /api/articles/:id/force
// @access  Private
exports.forceDeleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, { paranoid: false });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
    }

    // Auth check
    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    await article.destroy({ force: true });
    res.json({ success: true, message: 'Đã xóa vĩnh viễn bài viết' });
  } catch (error) {
    console.error('forceDeleteArticle Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle Like on an article
// @route   POST /api/articles/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.user.id;

    const article = await Article.findByPk(articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
    }

    const existingLike = await ArticleLike.findOne({
      where: { articleId, userId }
    });

    if (existingLike) {
      await existingLike.destroy();
      const count = await ArticleLike.count({ where: { articleId } });
      return res.json({ success: true, isLiked: false, likesCount: count, message: 'Đã bỏ thích' });
    } else {
      await ArticleLike.create({ articleId, userId });
      const count = await ArticleLike.count({ where: { articleId } });
      return res.json({ success: true, isLiked: true, likesCount: count, message: 'Đã thích bài viết' });
    }
  } catch (error) {
    console.error('toggleLike Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
