const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Gửi email OTP xác minh đăng ký
 * @param {string} to - địa chỉ email người nhận
 * @param {string} otp - mã 6 số
 */
const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: '"EducoreAcademy" <no-reply@educoreacademy.com>',
    to,
    subject: 'Mã xác minh đăng ký – EducoreAcademy',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 40px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
            📚 EducoreAcademy
          </h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Nền tảng học tập trực tuyến</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px; background: #ffffff;">
          <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Xác minh địa chỉ email của bạn</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Bạn đã yêu cầu tạo tài khoản trên EducoreAcademy. Sử dụng mã bên dưới để hoàn tất đăng ký:
          </p>

          <!-- OTP Box -->
          <div style="background: #f1f5f9; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
            <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Mã xác minh</p>
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0;">Mã có hiệu lực trong <strong>10 phút</strong></p>
          </div>

          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Tài khoản sẽ không được tạo nếu mã không được nhập.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2025 EducoreAcademy. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
