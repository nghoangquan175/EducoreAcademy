const { InstructorApplication, User } = require('../models');
const { sendInstructorApplicationRejectEmail, sendInstructorApplicationApproveEmail } = require('../config/emailService');
const bcrypt = require('bcryptjs');

// @desc    Submit instructor application
// @route   POST /api/instructor-applications
// @access  Public
const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, bio, cvUrl } = req.body;

    // Check if there is already a pending application for this email
    const existingApplication = await InstructorApplication.findOne({ 
      where: { email, status: 'pending' } 
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Bạn đã nộp đơn đăng ký và đang chờ phê duyệt.' });
    }

    // Check if user is already an instructor
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.role === 'instructor') {
       return res.status(400).json({ message: 'Email này đã là giảng viên của hệ thống.' });
    }

    const application = await InstructorApplication.create({
      name,
      email,
      phone,
      bio,
      cvUrl
    });

    res.status(201).json({
      message: 'Nộp đơn đăng ký thành công',
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all instructor applications
// @route   GET /api/instructor-applications
// @access  Private/Admin
const getApplications = async (req, res) => {
  try {
    const applications = await InstructorApplication.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve instructor application
// @route   PATCH /api/instructor-applications/:id/approve
// @access  Private/Admin
const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email và mật khẩu cho tài khoản giảng viên.' });
    }

    const application = await InstructorApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn đăng ký này đã được xử lý.' });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    if (user && user.role !== 'student') {
       return res.status(400).json({ message: 'Tài khoản này đã tồn tại với vai trò Giảng viên hoặc Admin.' });
    }

    if (user && user.role === 'student') {
        // Upgrade student to instructor
        user.role = 'instructor';
        user.password = password; // and update password
        await user.save();
    } else {
        // Create new user
        user = await User.create({
          name: application.name,
          email,
          password,
          role: 'instructor',
          provider: 'local'
        });
    }

    // Update application status
    application.status = 'approved';
    await application.save();

    // Send email to applicant's personal email (using the provided company credentials in the message)
    try {
      await sendInstructorApplicationApproveEmail(application.email, application.name, email, password);
    } catch (mailError) {
      console.error('Lỗi khi gửi mail phê duyệt:', mailError);
    }

    res.json({ message: 'Đã phê duyệt và tạo tài khoản thành công', user });
  } catch (error) {
    console.error('Lỗi khi phê duyệt đơn đăng ký:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// @desc    Reject instructor application
// @route   PATCH /api/instructor-applications/:id/reject
// @access  Private/Admin
const rejectApplication = async (req, res) => {
  try {
    const application = await InstructorApplication.findByPk(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn đăng ký này đã được xử lý' });
    }

    application.status = 'rejected';
    await application.save();

    // Send rejection email
    await sendInstructorApplicationRejectEmail(application.email, application.name);

    res.json({ message: 'Đã từ chối đơn đăng ký', application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await InstructorApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn đăng ký:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication
};
