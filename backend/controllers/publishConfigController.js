const { CoursePublishConfig, RevenuePolicy, Course, User, Notification } = require('../models');

// @desc    Get publish configuration for a course
// @route   GET /api/admin/publish-config/:courseId
// @access  Private/Admin
exports.getPublishConfig = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get config
    const config = await CoursePublishConfig.findOne({
      where: { courseId }
    });

    // Get Revenue Policy for reference (pricePerPurchase, type)
    const policy = await RevenuePolicy.findOne({
      where: { courseId, status: 'accepted' }
    });

    // Get Course basic info
    const course = await Course.findByPk(courseId, {
      attributes: ['id', 'title', 'price', 'published']
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      config,
      policy,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upsert publish configuration and optionally publish course
// @route   POST /api/admin/publish-config/:courseId
// @access  Private/Admin
exports.upsertPublishConfig = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { isPro, price, salePrice, discountPercent, publish } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if config exists
    let config = await CoursePublishConfig.findOne({ where: { courseId } });

    if (config) {
      // Update
      await config.update({
        isPro,
        price,
        salePrice,
        discountPercent,
        createdByAdminId: req.user.id
      });
    } else {
      // Create
      config = await CoursePublishConfig.create({
        courseId,
        isPro,
        price,
        salePrice,
        discountPercent,
        createdByAdminId: req.user.id
      });
    }

    // If "publish" flag is true and status is 4 (READY_TO_PUBLISH), update to 5 (PUBLISHED)
    if (publish && Number(course.published) === 4) {
      await course.update({ published: 5 });

      // Notify instructor
      await Notification.create({
        userId: course.instructorId,
        title: 'Khóa học đã được đăng tải',
        message: `Khóa học "${course.title}" của bạn đã chính thức được đăng tải lên hệ thống.`,
        relatedId: course.id.toString(),
        type: 'course_published:5'
      });
    } else if (publish && Number(course.published) === 6) {
      // Re-publish from unpublished
      await course.update({ published: 5 });
    }

    res.json({
      message: publish ? 'Khóa học đã được đăng tải thành công' : 'Cấu hình đã được lưu',
      config,
      courseStatus: course.published
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
