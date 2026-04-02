const { Certificate, Enrollment, Course, User } = require('../models');
const { generatePDF } = require('../utils/puppeteerManager');
const { cloudinary } = require('../config/cloudinary');
const Handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { Readable } = require('stream');

/**
 * @desc    Generate a certificate for a completed course
 * @route   POST /api/certificates/generate
 * @access  Private (Student)
 */
const generateCertificate = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        // 1. Validate Enrollment & Completion Status
        const enrollment = await Enrollment.findOne({
            where: { userId, courseId, status: 'completed' },
            include: [
                { model: Course, attributes: ['id', 'title', 'level', 'duration'] },
                { model: User, attributes: ['id', 'name'] }
            ]
        });

        if (!enrollment) {
            return res.status(403).json({
                message: 'Bạn chưa hoàn thành khóa học này hoặc không có quyền truy cập.'
            });
        }

        // 2. Check if Certificate already exists
        const existingCert = await Certificate.findOne({ where: { userId, courseId } });
        if (existingCert) {
            return res.status(200).json({
                message: 'Chứng chỉ đã tồn tại.',
                pdfUrl: existingCert.pdfUrl,
                certificateCode: existingCert.certificateCode
            });
        }

        const studentName = enrollment.User.name;
        const courseTitle = enrollment.Course.title;
        const courseLevel = enrollment.Course.level;
        const duration = enrollment.Course.duration || 'N/A';
        const issuedDate = moment().format('DD/MM/YYYY');
        const certificateCode = `EDU-${moment().format('YYYY')}-${courseId}-${userId}`;

        // 3. Compile HTML Template
        const templatePath = path.join(__dirname, '../templates/certificate.hbs');
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = Handlebars.compile(templateSource);

        const html = template({
            studentName,
            courseName: courseTitle,
            issuedDate,
            certificateCode,
            duration
        });

        // 4. Convert HTML to PDF (Puppeteer)
        const pdfBuffer = await generatePDF(html, {
            format: 'A4',
            landscape: true
        });

        // 5. Upload to Cloudinary (Stream)
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'educore/certificates',
                    resource_type: 'raw',
                    public_id: `cert_${userId}_${courseId}.pdf`,
                    access_mode: 'public'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            const readable = new Readable();
            readable.push(pdfBuffer);
            readable.push(null);
            readable.pipe(stream);
        });

        // 6. Save to Database
        const certificate = await Certificate.create({
            userId,
            courseId,
            pdfUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            certificateCode,
            studentNameSnap: studentName,
            courseTitleSnap: courseTitle,
            issuedAt: new Date()
        });

        res.status(201).json({
            message: 'Cung cấp chứng chỉ thành công!',
            pdfUrl: certificate.pdfUrl,
            certificateCode: certificate.certificateCode
        });

    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo chứng chỉ.', error: error.message });
    }
};

/**
 * @desc    Get certificate by code for public verification
 * @route   GET /api/certificates/verify/:code
 * @access  Public
 */
const verifyCertificate = async (req, res) => {
    try {
        const { code } = req.params;
        const certificate = await Certificate.findOne({
            where: { certificateCode: code },
            include: [
                { model: User, as: 'user', attributes: ['name', 'avatar'] },
                { model: Course, as: 'course', attributes: ['title', 'thumbnail'] }
            ]
        });

        if (!certificate) {
            return res.status(404).json({ message: 'Không tìm thấy chứng chỉ hợp lệ.' });
        }

        res.json({
            valid: true,
            studentName: certificate.studentNameSnap,
            courseTitle: certificate.courseTitleSnap,
            issuedAt: certificate.issuedAt,
            pdfUrl: certificate.pdfUrl,
            certificateCode: certificate.certificateCode,
            courseThumbnail: certificate.course?.thumbnail
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

/**
 * @desc    Get current user's certificates
 * @route   GET /api/certificates/my
 * @access  Private (Student)
 */
const getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.findAll({
            where: { userId: req.user.id },
            order: [['issuedAt', 'DESC']]
        });
        res.json(certificates);
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ message: 'Lỗi hệ thống.' });
    }
};

module.exports = {
    generateCertificate,
    verifyCertificate,
    getMyCertificates
};
