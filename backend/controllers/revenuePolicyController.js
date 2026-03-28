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
        type: 'revenue_policy:2'
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
      // Admin can send draft/rejected to instructor OR revoke a waiting policy
      if (status === 'waiting_confirm' && (policy.status === 'draft' || policy.status === 'rejected')) {
        policy.status = 'waiting_confirm';
        await policy.save();

        // Notify instructor
        await Notification.create({
          userId: policy.course.instructorId,
          title: 'Chính sách doanh thu mới',
          message: `Quản trị viên đã gửi chính sách doanh thu mới cho khóa học "${policy.course.title}". Vui lòng xác nhận.`,
          relatedId: policy.id.toString(),
          type: 'revenue_policy:2'
        });

        return res.json(policy);
      }

      if (status === 'draft' && policy.status === 'waiting_confirm') {
        policy.status = 'draft';
        await policy.save();

        // Notify instructor that it was revoked
        await Notification.create({
          userId: policy.course.instructorId,
          title: 'Thu hồi chính sách doanh thu',
          message: `Quản trị viên đã thu hồi chính sách doanh thu cho khóa học "${policy.course.title}" để điều chỉnh thêm.`,
          type: 'revenue_policy_revoked:3'
        });

        return res.json(policy);
      }

      // Admin requests to delete an accepted policy
      if (status === 'waiting_delete' && policy.status === 'accepted') {
        policy.status = 'waiting_delete';
        await policy.save();

        // Notify instructor
        await Notification.create({
          userId: policy.course.instructorId,
          title: 'Yêu cầu xóa chính sách doanh thu',
          message: `Quản trị viên yêu cầu xóa chính sách doanh thu hiện tại cho khóa học "${policy.course.title}". Vui lòng xác nhận để có thể thay bằng chính sách mới.`,
          relatedId: policy.id.toString(),
          type: 'revenue_policy_delete_request:1' // Use 1 (Yellow/Alert) or similar
        });

        return res.json(policy);
      }

      // Admin cancels delete request
      if (status === 'accepted' && policy.status === 'waiting_delete') {
        policy.status = 'accepted';
        await policy.save();

        // Notify instructor
        await Notification.create({
          userId: policy.course.instructorId,
          title: 'Hủy yêu cầu xóa chính sách',
          message: `Quản trị viên đã hủy yêu cầu xóa chính sách doanh thu cho khóa học "${policy.course.title}".`,
          type: 'revenue_policy:5' // Back to emerald/accepted
        });

        return res.json(policy);
      }

      return res.status(400).json({ message: 'Invalid status transition for Admin' });
    }

    if (req.user.role === 'instructor') {
      if (!['accepted', 'rejected', 'deleted'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status for instructor' });
      }

      // Auth check: only course instructor can confirm
      if (policy.course.instructorId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (policy.status !== 'waiting_confirm' && policy.status !== 'waiting_delete') {
        return res.status(400).json({ message: 'Policy already processed or in draft' });
      }

      if (status === 'accepted' && policy.status === 'waiting_delete') {
        // Instructor rejects delete request
        policy.status = 'accepted';
        await policy.save();

        // Notify admin
        await Notification.create({
          userId: policy.createdByAdminId,
          title: 'Yêu cầu xóa chính sách bị từ chối',
          message: `Giảng viên đã từ chối yêu cầu xóa chính sách doanh thu cho khóa học "${policy.course.title}".`,
          relatedId: policy.id.toString(),
          type: 'revenue_policy_update:3'
        });

        return res.json(policy);
      }

      if (status === 'deleted' && policy.status === 'waiting_delete') {
        // Instructor confirms delete request
        const courseId = policy.courseId;
        const courseTitle = policy.course.title;
        const adminId = policy.createdByAdminId;

        // Revert course status to 2 (CONTENT_APPROVED)
        const course = await Course.findByPk(courseId);
        if (course && [4, 5, 6].includes(Number(course.published))) {
            await course.update({ published: 2 });
        }

        await policy.destroy();

        // Notify admin
        await Notification.create({
          userId: adminId,
          title: 'Chấp nhận xóa chính sách',
          message: `Giảng viên đã chấp nhận xóa chính sách doanh thu cho khóa học "${courseTitle}". Bây giờ bạn có thể tạo chính sách mới.`,
          type: 'revenue_policy_deleted:5'
        });

        return res.json({ message: 'Policy deleted and record removed' });
      }

      policy.status = status;
      if (status === 'accepted') {
        // Enforce max 1 accepted policy per course
        const existingAccepted = await RevenuePolicy.findOne({
          where: {
            courseId: policy.courseId,
            status: 'accepted'
          }
        });
        if (existingAccepted && existingAccepted.id !== policy.id) {
          return res.status(400).json({ message: 'Khóa học này đã có một chính sách đã được chấp nhận.' });
        }

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
        type: `revenue_policy_update:${status === 'accepted' ? 4 : 3}`
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
    const { type, instructorPercent, fixedAmount, upfrontAmount, sendImmediately } = req.body;
    
    const policy = await RevenuePolicy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    
    if (policy.status !== 'draft' && policy.status !== 'rejected') {
      return res.status(400).json({ message: 'Chỉ có thể sửa bản nháp hoặc chính sách bị từ chối' });
    }

    policy.type = type;
    policy.instructorPercent = instructorPercent;
    policy.fixedAmount = fixedAmount;
    policy.upfrontAmount = upfrontAmount;
    
    if (sendImmediately) {
      policy.status = 'waiting_confirm';
      
      const course = await Course.findByPk(policy.courseId);
      // Notify instructor
      await Notification.create({
        userId: course.instructorId,
        title: 'Chính sách doanh thu mới',
        message: `Quản trị viên đã gửi chính sách doanh thu mới cho khóa học "${course.title}". Vui lòng xác nhận.`,
        relatedId: policy.id.toString(),
        type: 'revenue_policy:2'
      });
    }

    await policy.save();
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single revenue policy by ID
// @route   GET /api/revenue-policies/:id
// @access  Private
exports.getRevenuePolicyById = async (req, res) => {
  try {
    const policy = await RevenuePolicy.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'admin', attributes: ['id', 'name'] },
        { model: User, as: 'instructor', attributes: ['id', 'name'] }
      ]
    });

    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    // Auth check
    if (req.user.role === 'instructor') {
      if (policy.course.instructorId !== req.user.id && policy.confirmedByInstructorId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (policy.status === 'draft') {
        return res.status(403).json({ message: 'Draft policy cannot be viewed by instructor' });
      }
    }

    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
