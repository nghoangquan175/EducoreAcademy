const { PaymentOrder, Payment, Enrollment, Course, Lesson, RefundRequest, Progress, Certificate, User } = require('../models');
const vnpayConfig = require('../config/vnpay');
const crypto = require('crypto');
const axios = require('axios');
const moment = require('moment');

exports.requestRefund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;

    // 1. Find the order
    const order = await PaymentOrder.findOne({
      where: { id: orderId, userId: userId, status: 'paid' },
      include: [
        { model: Course, as: 'course' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng hợp lệ để hoàn tiền.' });
    }

    // 2. Check Time Constraint (7 days)
    const now = moment();
    const orderDate = moment(order.createdAt);
    const diffDays = now.diff(orderDate, 'days');

    if (diffDays > 7) {
      return res.status(400).json({ message: 'Đã quá thời hạn 7 ngày để yêu cầu hoàn tiền.' });
    }

    // 3. Check Consumption Constraint (< 15%)
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId: order.courseId }
    });

    if (!enrollment) {
      return res.status(400).json({ message: 'Bạn chưa đăng ký khóa học này.' });
    }

    // Check if course is completed
    if (enrollment.status === 'completed' || enrollment.progress === 100) {
      return res.status(400).json({ message: 'Khóa học đã hoàn thành, không thể hoàn tiền.' });
    }

    // Check if certificate exists
    const certificate = await Certificate.findOne({
      where: { userId, courseId: order.courseId }
    });
    if (certificate) {
      return res.status(400).json({ message: 'Bạn đã nhận chứng chỉ cho khóa học này, không thể hoàn tiền.' });
    }

    // Check video consumption
    const chapters = await order.course.getChapters({ attributes: ['id'] });
    const chapterIds = chapters.map(c => c.id);

    const totalLessonCount = await Lesson.count({
      where: { chapterId: chapterIds }
    });

    const watchedLessons = await Progress.count({
      where: {
        enrollmentId: enrollment.id,
        videoWatched: true
      }
    });

    const consumption = totalLessonCount > 0 ? (watchedLessons / totalLessonCount) * 100 : 0;

    if (consumption >= 15) {
      return res.status(400).json({ message: `Tiến độ học tập của bạn (${consumption.toFixed(1)}%) đã vượt quá 15%, không thể hoàn tiền.` });
    }

    // 4. Check for duplicate request (Only 1 attempt allowed)
    const existingRequest = await RefundRequest.findOne({
      where: { paymentOrderId: orderId, status: ['pending', 'approved', 'rejected'] }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Yêu cầu hoàn tiền cho đơn hàng này đang được xử lý hoặc đã được chấp nhận.' });
    }

    // 5. Create Refund Request
    const refundRequest = await RefundRequest.create({
      paymentOrderId: orderId,
      userId,
      courseId: order.courseId,
      amount: order.amount,
      reason,
      status: 'pending',
      reversedAdminAmount: order.adminAmount,
      reversedInstructorAmount: order.instructorAmount
    });

    res.status(201).json({ message: 'Yêu cầu hoàn tiền của bạn đã được gửi và đang chờ Admin duyệt.', refundRequest });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getRefundRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const requests = await RefundRequest.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: PaymentOrder, as: 'order' },
        { model: User, as: 'admin', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get refund requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMyRefundRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await RefundRequest.findAll({
      where: { userId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: PaymentOrder, as: 'order' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error('Get my refund requests error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNote } = req.body;

    const refundRequest = await RefundRequest.findByPk(id, {
      include: [
        { model: PaymentOrder, as: 'order', include: [{ model: Payment }] },
        { model: User, as: 'user' }
      ]
    });

    if (!refundRequest || refundRequest.status !== 'pending') {
      return res.status(404).json({ message: 'Yêu cầu hoàn tiền không hợp lệ hoặc đã được xử lý.' });
    }

    const order = refundRequest.order;
    const payment = order.Payments && order.Payments.length > 0 ? order.Payments.find(p => p.status === 'success') : null;

    if (!payment) {
      return res.status(400).json({ message: 'Không tìm thấy giao dịch thanh toán thành công cho đơn hàng này.' });
    }

    // Build VNPay Refund Request
    const date = new Date();
    const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
    const vnp_RequestId = moment(date).format('HHmmss'); // Simplified request ID

    const vnp_Params = {};
    vnp_Params['vnp_RequestId'] = vnp_RequestId;
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'refund';
    vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
    vnp_Params['vnp_TransactionType'] = '02'; // Full refund
    vnp_Params['vnp_TxnRef'] = order.id.toString();
    vnp_Params['vnp_Amount'] = Math.round(Number(order.amount) * 100).toString();
    vnp_Params['vnp_TransactionNo'] = payment.transactionCode;
    vnp_Params['vnp_TransactionDate'] = moment(order.createdAt).format('YYYYMMDDHHmmss');
    vnp_Params['vnp_CreateBy'] = req.user.email;
    vnp_Params['vnp_CreateDate'] = vnp_CreateDate;
    vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
    vnp_Params['vnp_OrderInfo'] = `Hoan tien don hang ${order.id}`;

    // Signature
    const data = [
      vnp_Params['vnp_RequestId'],
      vnp_Params['vnp_Version'],
      vnp_Params['vnp_Command'],
      vnp_Params['vnp_TmnCode'],
      vnp_Params['vnp_TransactionType'],
      vnp_Params['vnp_TxnRef'],
      vnp_Params['vnp_Amount'],
      vnp_Params['vnp_TransactionNo'],
      vnp_Params['vnp_TransactionDate'],
      vnp_Params['vnp_CreateBy'],
      vnp_Params['vnp_CreateDate'],
      vnp_Params['vnp_IpAddr'],
      vnp_Params['vnp_OrderInfo']
    ].join('|');

    const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = vnp_SecureHash;

    // Call VNPay API
    try {
      const response = await axios.post(vnpayConfig.vnp_Api, vnp_Params);
      const vnp_Response = response.data;

      if (vnp_Response.vnp_ResponseCode === '00' || vnp_Response.vnp_ResponseCode === '000') {
        // Success
        refundRequest.status = 'approved';
        refundRequest.processedByAdminId = adminId;
        refundRequest.processedAt = new Date();
        refundRequest.adminNote = adminNote;
        refundRequest.vnpayResponseCode = vnp_Response.vnp_ResponseCode;
        refundRequest.vnpayTransactionNo = vnp_Response.vnp_TransactionNo;
        await refundRequest.save();

        order.status = 'refunded';
        await order.save();

        // Cancel Enrollment
        const enrollment = await Enrollment.findOne({
          where: { userId: refundRequest.userId, courseId: refundRequest.courseId }
        });
        if (enrollment) {
          enrollment.status = 'cancelled';
          await enrollment.save();

          const course = await Course.findByPk(refundRequest.courseId);
          if (course) {
            await course.decrement('studentsCount');
          }
        }

        res.status(200).json({ message: 'Hoàn tiền thành công.', vnp_Response });
      } else {
        // VNPay error
        refundRequest.status = 'vnpay_failed';
        refundRequest.vnpayResponseCode = vnp_Response.vnp_ResponseCode;
        await refundRequest.save();
        res.status(400).json({ message: 'VNPay từ chối lệnh hoàn tiền.', vnp_Response });
      }
    } catch (apiError) {
      console.error('VNPay Refund API Error:', apiError);
      res.status(500).json({ message: 'Lỗi khi gọi VNPay API.' });
    }
  } catch (error) {
    console.error('Approve refund error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNote } = req.body;

    const refundRequest = await RefundRequest.findByPk(id);

    if (!refundRequest || refundRequest.status !== 'pending') {
      return res.status(404).json({ message: 'Yêu cầu hoàn tiền không hợp lệ hoặc đã được xử lý.' });
    }

    refundRequest.status = 'rejected';
    refundRequest.processedByAdminId = adminId;
    refundRequest.processedAt = new Date();
    refundRequest.adminNote = adminNote;
    await refundRequest.save();

    res.status(200).json({ message: 'Đã từ chối yêu cầu hoàn tiền.', refundRequest });
  } catch (error) {
    console.error('Reject refund error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
