const { RevenuePolicy, Course, User, Notification } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all revenue policies (Admin) or user's policies (Instructor)
// @route   GET /api/revenue-policies
// @access  Private
exports.getRevenuePolicies = async (req, res) => {
  try {
    const { search, status } = req.query;
    let where = {};

    if (req.user.role === 'instructor') {
      // Instructors only see policies related to their courses and not draft
      where = {
        [Op.or]: [
          { '$course.instructorId$': req.user.id },
          { 'confirmedByInstructorId': req.user.id }
        ],
        status: { [Op.ne]: 'draft' }
      };
    }

    if (status) {
      where.status = status;
    }

    const { rows: policies, count } = await RevenuePolicy.findAndCountAll({
      where,
      include: [
        { 
          model: Course, 
          as: 'course',
          attributes: ['id', 'title', 'instructorId'],
          where: search ? { title: { [Op.like]: `%${search}%` } } : {}
        },
        { model: User, as: 'admin', attributes: ['id', 'name'] },
        { model: User, as: 'instructor', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ policies, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new revenue policy
// @route   POST /api/revenue-policies
// @access  Private/Admin
exports.createRevenuePolicy = async (req, res) => {
  try {
    const { courseId, type, instructorPercent, fixedAmount, upfrontAmount, sendImmediately } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.published !== 2) {
      return res.status(400).json({ message: 'Chỉ có thể tạo chính sách cho khóa học đã được duyệt nội dung (Status 2)' });
    }

    const policy = await RevenuePolicy.create({
      courseId,
      type,
      instructorPercent,
      fixedAmount,
      upfrontAmount,
      createdByAdminId: req.user.id,
      status: sendImmediately ? 'waiting_confirm' : 'draft'
    });

    if (sendImmediately) {
      // Notify instructor
      await Notification.create({
        userId: course.instructorId,
        title: 'Chính sách doanh thu mới',
        message: `Quản trị viên đã tạo chính sách doanh thu mới cho khóa học "${course.title}". Vui lòng xác nhận.`,
        relatedId: policy.id.toString(),
        type: 'revenue_policy'
      });
    }

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update revenue policy status
// @route   PATCH /api/revenue-policies/:id/status
// @access  Private
exports.updatePolicyStatus = async (req, res) => {
  try {
    const { status } = req.body; 

    const policy = await RevenuePolicy.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'admin', attributes: ['id', 'name'] },
        { model: User, as: 'instructor', attributes: ['id', 'name'] }
      ]
    });

    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (req.user.role === 'admin') {
      // Admin can send draft to instructor OR revoke a waiting policy
      if (status === 'waiting_confirm' && policy.status === 'draft') {
        policy.status = 'waiting_confirm';
        await policy.save();

        // Notify instructor
        await Notification.create({
          userId: policy.course.instructorId,
          title: 'Chính sách doanh thu mới',
          message: `Quản trị viên đã gửi chính sách doanh thu mới cho khóa học "${policy.course.title}". Vui lòng xác nhận.`,
          relatedId: policy.id.toString(),
          type: 'revenue_policy'
        });

        return res.json(policy);
      }

      if (status === 'draft' && policy.status === 'waiting_confirm') {
        policy.status = 'draft';
        await policy.save();

        // Optionally notify instructor that it was revoked, but usually not strictly required if it was just sent
        return res.json(policy);
      }

      return res.status(400).json({ message: 'Invalid status transition for Admin' });
    }

    if (req.user.role === 'instructor') {
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status for instructor' });
      }

      // Auth check: only course instructor can confirm
      if (policy.course.instructorId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (policy.status !== 'waiting_confirm') {
        return res.status(400).json({ message: 'Policy already processed or in draft' });
      }

      policy.status = status;
      if (status === 'accepted') {
        policy.confirmedByInstructorId = req.user.id;
        policy.confirmedAt = new Date();
      }
      await policy.save();

      // IF ACCEPTED: Update course status to 4 (READY_TO_PUBLISH) if it's currently 2 (CONTENT_APPROVED)
      if (status === 'accepted' && policy.course.published === 2) {
        await policy.course.update({ published: 4 });
      }

      // Notify admin
      await Notification.create({
        userId: policy.createdByAdminId,
        title: `Chính sách doanh thu được ${status === 'accepted' ? 'chấp nhận' : 'từ chối'}`,
        message: `Giảng viên đã ${status === 'accepted' ? 'chấp nhận' : 'từ chối'} chính sách doanh thu cho khóa học "${policy.course.title}".${status === 'accepted' ? ' Khóa học đã sẵn sàng để đăng tải.' : ''}`,
        relatedId: policy.id.toString(),
        type: 'revenue_policy_update'
      });

      return res.json(policy);
    }

    res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update revenue policy details
// @route   PUT /api/revenue-policies/:id
// @access  Private/Admin
exports.updateRevenuePolicy = async (req, res) => {
  try {
    const { type, instructorPercent, fixedAmount, upfrontAmount } = req.body;
    
    const policy = await RevenuePolicy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    
    if (policy.status !== 'draft') {
      return res.status(400).json({ message: 'Only drafts can be updated' });
    }

    policy.type = type;
    policy.instructorPercent = instructorPercent;
    policy.fixedAmount = fixedAmount;
    policy.upfrontAmount = upfrontAmount;
    
    await policy.save();
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
