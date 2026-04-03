const { PaymentOrder, Course, User, RevenuePolicy, RefundRequest } = require('../models');
const { Op, Sequelize } = require('sequelize');

const getDateFilters = (query) => {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return null;

  let rangeStart = startDate ? new Date(startDate) : null;
  let rangeEnd = endDate ? new Date(endDate) : new Date();

  if (!rangeStart) {
    // Nếu chỉ chọn end: lấy 14 ngày trước đó (2 tuần)
    rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeStart.getDate() - 13);
  }

  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(23, 59, 59, 999);

  return {
    [Op.gte]: rangeStart,
    [Op.lte]: rangeEnd
  };
};

// Helper: Định dạng ngày cục bộ YYYY-MM-DD
const toLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Lấy danh sách tất cả các ngày trong khoảng
const getAllDatesInRange = (startDate, endDate) => {
  const dates = [];
  let curr = new Date(startDate);
  const end = new Date(endDate);
  curr.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Max safety: 366 days
  let count = 0;
  while (curr <= end && count < 366) {
    dates.push(toLocalDateString(curr));
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return dates;
};

exports.getAdminOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dates = getDateFilters(req.query);
    const whereClause = { status: 'paid' };
    if (dates) whereClause.createdAt = dates;

    const orders = await PaymentOrder.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']]
    });

    let totalGrossRevenue = 0;
    let totalAdminNetRevenue = 0;
    let totalInstructorRevenue = 0;

    // Daily Stats Aggregator
    const dailyStatsMap = {};

    // Khởi tạo dải ngày dựa trên filter
    if (startDate || endDate) {
      // Xác định mốc start/end thực tế để render bảng
      let rangeStart = startDate ? new Date(startDate) : null;
      let rangeEnd = endDate ? new Date(endDate) : new Date();

      if (!rangeStart) {
        // Nếu chỉ chọn end: lấy 14 ngày trước đó
        rangeStart = new Date(rangeEnd);
        rangeStart.setDate(rangeStart.getDate() - 13);
      }

      const allDates = getAllDatesInRange(rangeStart, rangeEnd);
      allDates.forEach(d => {
        dailyStatsMap[d] = { date: d, grossRevenue: 0, adminNet: 0, instructorNet: 0, salesCount: 0 };
      });
    }

    orders.forEach(o => {
      const amount = parseFloat(o.amount || 0);
      const adminAmt = parseFloat(o.adminAmount || o.amount || 0);
      const instAmt = parseFloat(o.instructorAmount || 0);

      totalGrossRevenue += amount;
      totalAdminNetRevenue += adminAmt;
      totalInstructorRevenue += instAmt;

      // Group by local date string
      const dateKey = toLocalDateString(o.createdAt);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].grossRevenue += amount;
        dailyStatsMap[dateKey].adminNet += adminAmt;
        dailyStatsMap[dateKey].instructorNet += instAmt;
        dailyStatsMap[dateKey].salesCount += 1;
      } else if (!startDate && !endDate) {
        // Trường hợp Global View (không lọc): tự động tạo entry cho ngày có dữ liệu
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, adminNet: 0, instructorNet: 0, salesCount: 0 };
        }
        dailyStatsMap[dateKey].grossRevenue += amount;
        dailyStatsMap[dateKey].adminNet += adminAmt;
        dailyStatsMap[dateKey].instructorNet += instAmt;
        dailyStatsMap[dateKey].salesCount += 1;
      }
    });

    // Tính chi phí Fixed/Hybrid đã trả cho Giảng viên (Chỉ tính cho khóa đã đăng - Published)
    const activePolicies = await RevenuePolicy.findAll({
      where: dates ? { status: 'accepted', updatedAt: dates } : { status: 'accepted' },
      include: [{ model: Course, as: 'course', where: { published: 5 }, attributes: [] }]
    });

    let totalFixedCosts = 0;
    activePolicies.forEach(p => {
      const fAmt = parseFloat(p.fixedAmount || 0);
      totalFixedCosts += fAmt;

      const dateKey = toLocalDateString(p.updatedAt);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].adminNet -= fAmt;
        dailyStatsMap[dateKey].instructorNet += fAmt;
      } else if (!startDate && !endDate) {
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, adminNet: 0, instructorNet: 0, salesCount: 0 };
        }
        dailyStatsMap[dateKey].adminNet -= fAmt;
        dailyStatsMap[dateKey].instructorNet += fAmt;
      }
    });

    const dailyStats = Object.values(dailyStatsMap).sort((a, b) => b.date.localeCompare(a.date));

    // Handle Refunds
    const refundWhere = { status: 'approved' };
    if (dates) refundWhere.processedAt = dates;
    const refunds = await RefundRequest.findAll({ where: refundWhere });
    
    let totalRefundedAmount = 0;
    refunds.forEach(r => {
      const amt = parseFloat(r.amount);
      const adminAmt = parseFloat(r.reversedAdminAmount || 0);
      const instAmt = parseFloat(r.reversedInstructorAmount || 0);
      
      totalGrossRevenue -= amt;
      totalAdminNetRevenue -= adminAmt;
      totalInstructorRevenue -= instAmt;
      totalRefundedAmount += amt;

      const dateKey = toLocalDateString(r.processedAt);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].grossRevenue -= amt;
        dailyStatsMap[dateKey].adminNet -= adminAmt;
        dailyStatsMap[dateKey].instructorNet -= instAmt;
      } else if (!startDate && !endDate) {
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, adminNet: 0, instructorNet: 0, salesCount: 0 };
        }
        dailyStatsMap[dateKey].grossRevenue -= amt;
        dailyStatsMap[dateKey].adminNet -= adminAmt;
        dailyStatsMap[dateKey].instructorNet -= instAmt;
      }
    });

    res.json({
      totalGrossRevenue,
      totalAdminNetRevenue: totalAdminNetRevenue - totalFixedCosts,
      totalInstructorRevenue: totalInstructorRevenue + totalFixedCosts,
      totalRefundedAmount,
      totalTransactions: orders.length,
      dailyStats: Object.values(dailyStatsMap).sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getAdminCourses = async (req, res) => {
  try {
    const dates = getDateFilters(req.query);
    const orderWhere = { status: 'paid' };
    if (dates) orderWhere.createdAt = dates;

    // Use raw query or include for group by
    // Map kết quả sang dict
    const coursesStats = await PaymentOrder.findAll({
      where: orderWhere,
      attributes: [
        'courseId',
        [Sequelize.fn('SUM', Sequelize.col('PaymentOrder.amount')), 'totalGross'],
        [Sequelize.fn('SUM', Sequelize.col('adminAmount')), 'totalAdminNet'],
        [Sequelize.fn('SUM', Sequelize.col('instructorAmount')), 'totalInstructorNet'],
        [Sequelize.fn('COUNT', Sequelize.col('PaymentOrder.id')), 'totalSales']
      ],
      include: [
        { model: Course, attributes: ['title', 'price', 'thumbnail'], include: [{ model: User, as: 'instructor', attributes: ['name', 'email'] }] }
      ],
      group: [
        'PaymentOrder.courseId',
        'Course.id', 'Course.title', 'Course.price', 'Course.thumbnail',
        'Course->instructor.id', 'Course->instructor.name', 'Course->instructor.email'
      ],
      order: [[Sequelize.literal('totalGross'), 'DESC']]
    });

    // Map kết quả sang dict
    const resultDict = {};
    coursesStats.forEach(s => {
      const plain = s.get({ plain: true });
      resultDict[plain.courseId] = {
        ...plain,
        totalGross: parseFloat(plain.totalGross || 0),
        totalAdminNet: parseFloat(plain.totalAdminNet || 0),
        totalInstructorNet: parseFloat(plain.totalInstructorNet || 0)
      };
    });

    // Lấy chi phí fixed gán vào từng khóa
    const activePolicies = await RevenuePolicy.findAll({
      where: dates ? { status: 'accepted', updatedAt: dates } : { status: 'accepted' },
      include: [{
        model: Course, as: 'course', where: { published: 5 },
        attributes: ['title', 'price', 'thumbnail'],
        include: [{ model: User, as: 'instructor', attributes: ['id', 'name'] }]
      }]
    });

    activePolicies.forEach(p => {
      const cId = p.courseId;
      const fAmt = parseFloat(p.fixedAmount || 0);
      if (resultDict[cId]) {
        resultDict[cId].totalAdminNet -= fAmt;
        resultDict[cId].totalInstructorNet += fAmt;
      } else {
        // Nếu khóa học có policy nhưng chưa bán được đơn nào
        resultDict[cId] = {
          courseId: cId,
          Course: {
            ...p.course.get({ plain: true }),
            instructor: p.course.instructor?.get({ plain: true })
          },
          totalGross: 0,
          totalAdminNet: -fAmt, // Là số âm nếu là FIXED
          totalInstructorNet: fAmt,
          totalSales: 0
        };
      }
    });

    // Subtract Refunds
    const refundWhere = { status: 'approved' };
    if (dates) refundWhere.processedAt = dates;
    const refunds = await RefundRequest.findAll({ where: refundWhere });
    refunds.forEach(r => {
        const cId = r.courseId;
        const amt = parseFloat(r.amount);
        const adminAmt = parseFloat(r.reversedAdminAmount || 0);
        const instAmt = parseFloat(r.reversedInstructorAmount || 0);
        if (resultDict[cId]) {
            resultDict[cId].totalGross -= amt;
            resultDict[cId].totalAdminNet -= adminAmt;
            resultDict[cId].totalInstructorNet -= instAmt;
        }
    });

    res.json(Object.values(resultDict));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getAdminInstructors = async (req, res) => {
  try {
    // This is a simplification. Usually we aggregate orders by joining Course -> Instructor
    const dates = getDateFilters(req.query);
    const orderWhere = { status: 'paid' };
    if (dates) orderWhere.createdAt = dates;

    const instructorStats = await PaymentOrder.findAll({
      where: orderWhere,
      attributes: [
        [Sequelize.col('Course.instructorId'), 'instructorId'],
        [Sequelize.fn('SUM', Sequelize.col('PaymentOrder.amount')), 'totalGross'],
        [Sequelize.fn('SUM', Sequelize.col('adminAmount')), 'totalAdminNet'],
        [Sequelize.fn('SUM', Sequelize.col('instructorAmount')), 'totalInstructorNet'],
        [Sequelize.fn('COUNT', Sequelize.col('PaymentOrder.id')), 'totalSales']
      ],
      include: [
        { model: Course, attributes: [], required: true }
      ],
      group: ['Course.instructorId'],
      order: [[Sequelize.literal('totalGross'), 'DESC']]
    });

    // We can fetch user details separately to not mess up group by
    const resultDict = {};
    instructorStats.forEach(s => {
      const plain = s.get({ plain: true });
      resultDict[plain.instructorId] = {
        ...plain,
        totalGross: parseFloat(plain.totalGross || 0),
        totalAdminNet: parseFloat(plain.totalAdminNet || 0),
        totalInstructorNet: parseFloat(plain.totalInstructorNet || 0)
      };
    });

    // Lấy chi phí fixed gán vào từng giảng viên
    const activePolicies = await RevenuePolicy.findAll({
      where: dates ? { status: 'accepted', updatedAt: dates } : { status: 'accepted' },
      include: [{ model: Course, as: 'course', where: { published: 5 }, attributes: ['instructorId'] }]
    });

    activePolicies.forEach(p => {
      const instId = p.course?.instructorId;
      const fAmt = (parseFloat(p.additionalAmount) > 0) ? parseFloat(p.additionalAmount) : parseFloat(p.fixedAmount || 0);
      if (instId && resultDict[instId]) {
        resultDict[instId].totalAdminNet -= fAmt;
        resultDict[instId].totalInstructorNet += fAmt;
      }
    });

    const instructorIds = Object.keys(resultDict);
    const instructors = await User.findAll({ where: { id: instructorIds }, attributes: ['id', 'name', 'email'] });
    const userDict = {};
    instructors.forEach(i => userDict[i.id] = i);

    const result = Object.values(resultDict).map(data => ({
      ...data,
      instructor: userDict[data.instructorId] || null
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getAdminTransactions = async (req, res) => {
  try {
    const dates = getDateFilters(req.query);
    const whereClause = { status: 'paid' };
    if (dates) whereClause.createdAt = dates;

    const orders = await PaymentOrder.findAll({
      where: whereClause,
      include: [
        { model: Course, attributes: ['title'] },
        { model: User, attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// INSTRUCTOR
exports.getInstructorOverview = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const { startDate, endDate } = req.query;
    const dates = getDateFilters(req.query);
    const orderWhere = { status: 'paid' };
    if (dates) orderWhere.createdAt = dates;

    const orders = await PaymentOrder.findAll({
      where: orderWhere,
      include: [{
        model: Course,
        where: { instructorId },
        attributes: []
      }],
      order: [['createdAt', 'ASC']]
    });

    let totalGrossRevenue = 0;
    let totalFromTransactions = 0;
    const dailyStatsMap = {};

    // Khởi tạo dải ngày dựa trên filter
    if (startDate || endDate) {
      let rangeStart = startDate ? new Date(startDate) : null;
      let rangeEnd = endDate ? new Date(endDate) : new Date();

      if (!rangeStart) {
        rangeStart = new Date(rangeEnd);
        rangeStart.setDate(rangeStart.getDate() - 13);
      }

      const allDates = getAllDatesInRange(rangeStart, rangeEnd);
      allDates.forEach(d => {
        dailyStatsMap[d] = { date: d, grossRevenue: 0, instructorNet: 0, salesCount: 0 };
      });
    }

    orders.forEach(o => {
      const amount = parseFloat(o.amount || 0);
      const instAmt = parseFloat(o.instructorAmount || 0);

      totalGrossRevenue += amount;
      totalFromTransactions += instAmt;

      const dateKey = toLocalDateString(o.createdAt);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].grossRevenue += amount;
        dailyStatsMap[dateKey].instructorNet += instAmt;
        dailyStatsMap[dateKey].salesCount += 1;
      } else if (!startDate && !endDate) {
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, instructorNet: 0, salesCount: 0 };
        }
        dailyStatsMap[dateKey].grossRevenue += amount;
        dailyStatsMap[dateKey].instructorNet += instAmt;
        dailyStatsMap[dateKey].salesCount += 1;
      }
    });

    // Bổ sung: cộng tiền bán đứt
    const policyWhere = { status: 'accepted' };
    if (dates) policyWhere.updatedAt = dates;

    const activePolicies = await RevenuePolicy.findAll({
      where: policyWhere,
      include: [{ model: Course, as: 'course', where: { instructorId, published: 5 }, attributes: [] }]
    });

    let totalFromFixed = 0;
    activePolicies.forEach(p => {
      const fAmt = parseFloat(p.fixedAmount || 0);
      totalFromFixed += fAmt;

      const dateKey = toLocalDateString(p.updatedAt);
      if (dailyStatsMap[dateKey]) {
        dailyStatsMap[dateKey].instructorNet += fAmt;
      } else if (!startDate && !endDate) {
        if (!dailyStatsMap[dateKey]) {
          dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, instructorNet: 0, salesCount: 0 };
        }
        dailyStatsMap[dateKey].instructorNet += fAmt;
      }
    });

    const dailyStats = Object.values(dailyStatsMap).sort((a, b) => b.date.localeCompare(a.date));

    // Handle Refunds for Instructor
    const refundWhere = { status: 'approved' };
    if (dates) refundWhere.processedAt = dates;
    const refunds = await RefundRequest.findAll({ 
        where: refundWhere,
        include: [{ model: Course, as: 'course', where: { instructorId }, attributes: [] }]
    });

    refunds.forEach(r => {
        const amt = parseFloat(r.amount);
        const instAmt = parseFloat(r.reversedInstructorAmount || 0);
        
        totalGrossRevenue -= amt;
        totalFromTransactions -= instAmt;

        const dateKey = toLocalDateString(r.processedAt);
        if (dailyStatsMap[dateKey]) {
            dailyStatsMap[dateKey].grossRevenue -= amt;
            dailyStatsMap[dateKey].instructorNet -= instAmt;
        } else if (!startDate && !endDate) {
            if (!dailyStatsMap[dateKey]) {
                dailyStatsMap[dateKey] = { date: dateKey, grossRevenue: 0, instructorNet: 0, salesCount: 0 };
            }
            dailyStatsMap[dateKey].grossRevenue -= amt;
            dailyStatsMap[dateKey].instructorNet -= instAmt;
        }
    });

    res.json({
      totalGrossRevenue: totalGrossRevenue + totalFromFixed,
      totalInstructorNetRevenue: totalFromTransactions + totalFromFixed,
      totalFromTransactions,
      totalFromFixed,
      totalSales: orders.length,
      dailyStats: Object.values(dailyStatsMap).sort((a, b) => b.date.localeCompare(a.date))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const dates = getDateFilters(req.query);
    const orderWhere = { status: 'paid' };
    if (dates) orderWhere.createdAt = dates;

    const coursesStats = await PaymentOrder.findAll({
      where: orderWhere,
      attributes: [
        'courseId',
        [Sequelize.fn('SUM', Sequelize.col('PaymentOrder.amount')), 'totalGross'],
        [Sequelize.fn('SUM', Sequelize.col('instructorAmount')), 'totalInstructorNet'],
        [Sequelize.fn('COUNT', Sequelize.col('PaymentOrder.id')), 'totalSales']
      ],
      include: [
        { model: Course, where: { instructorId }, attributes: ['title', 'price', 'thumbnail'] }
      ],
      group: [
        'PaymentOrder.courseId',
        'Course.id', 'Course.title', 'Course.price', 'Course.thumbnail'
      ]
    });

    // Map qua result
    const resultDict = {};
    coursesStats.forEach(s => {
      const plain = s.get ? s.get({ plain: true }) : s;
      resultDict[plain.courseId] = {
        courseId: plain.courseId,
        Course: plain.Course,
        totalGross: parseFloat(plain.totalGross || 0),
        totalInstructorNet: parseFloat(plain.totalInstructorNet || 0),
        totalSales: parseInt(plain.totalSales || 0)
      };
    });

    // Lấy tiền bán đứt
    const policyWhere = { status: 'accepted' };
    if (dates) policyWhere.updatedAt = dates;

    const activePolicies = await RevenuePolicy.findAll({
      where: policyWhere,
      include: [{ model: Course, as: 'course', where: { instructorId, published: 5 }, attributes: ['title', 'price', 'thumbnail'] }]
    });

    activePolicies.forEach(p => {
      const cId = p.courseId;
      const fAmt = parseFloat(p.fixedAmount || 0);

      if (!resultDict[cId]) {
        // Nếu chưa có trong thống kê đơn hàng (chưa bán được đơn nào)
        resultDict[cId] = {
          courseId: cId,
          Course: p.course, // Lưu ý: 'p.course' từ include trả về alias 'course'
          totalGross: fAmt,
          totalInstructorNet: fAmt,
          totalSales: 0,
          policy: { type: p.type, instructorPercent: p.instructorPercent, fixedAmount: p.fixedAmount }
        };
      } else {
        // Nếu đã có trong thống kê đơn hàng, cộng dồn tiền fixed (nếu là HYBRID) 
        // và gán thông tin policy
        if (p.type === 'FIXED' || p.type === 'HYBRID') {
          resultDict[cId].totalGross += fAmt;
          resultDict[cId].totalInstructorNet += fAmt;
        }
        resultDict[cId].policy = { type: p.type, instructorPercent: p.instructorPercent, fixedAmount: p.fixedAmount };
      }
    });

    // Subtract Refunds for Instructor Courses
    const refundWhere = { status: 'approved' };
    if (dates) refundWhere.processedAt = dates;
    const refunds = await RefundRequest.findAll({ 
        where: refundWhere,
        include: [{ model: Course, as: 'course', where: { instructorId }, attributes: [] }]
    });

    refunds.forEach(r => {
        const cId = r.courseId;
        const amt = parseFloat(r.amount);
        const instAmt = parseFloat(r.reversedInstructorAmount || 0);
        if (resultDict[cId]) {
            resultDict[cId].totalGross -= amt;
            resultDict[cId].totalInstructorNet -= instAmt;
        }
    });

    // Sort theo net revenue
    const finalArray = Object.values(resultDict).sort((a, b) => b.totalInstructorNet - a.totalInstructorNet);

    res.json(finalArray);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getInstructorTransactions = async (req, res) => {
  try {
    const instructorId = req.user.id;
    const dates = getDateFilters(req.query);
    const whereClause = { status: 'paid' };
    if (dates) whereClause.createdAt = dates;

    const orders = await PaymentOrder.findAll({
      where: whereClause,
      include: [
        { model: Course, where: { instructorId }, attributes: ['title'] },
        { model: User, attributes: ['name', 'email'] },
        {
          model: RevenuePolicy,
          as: 'revenuePolicy',
          attributes: ['type', 'instructorPercent', 'fixedAmount'],
          where: {
            type: { [Op.ne]: 'FIXED' } // Chỉ hiện các đơn có chia % (PERCENT hoặc HYBRID)
          }
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
