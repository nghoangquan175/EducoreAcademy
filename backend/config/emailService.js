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
/**
 * Gửi email từ chối đơn đăng ký giảng viên
 */
const sendInstructorApplicationRejectEmail = async (to, name) => {
  const mailOptions = {
    from: '"EducoreAcademy" <no-reply@educoreacademy.com>',
    to,
    subject: 'Kết quả đăng ký trở thành đối tác – EducoreAcademy',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px;">
        <h2 style="color: #0f172a; font-size: 20px;">Kính gửi ${name},</h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Cảm ơn bạn đã quan tâm và gửi hồ sơ đăng ký trở thành đối tác giảng dạy tại <strong>EducoreAcademy</strong>.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Sau khi xem xét kỹ lưỡng hồ sơ của bạn, chúng tôi rất tiếc phải thông báo rằng ở thời điểm hiện tại, hồ sơ của bạn chưa phù hợp với định hướng phát triển của nền tảng.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Chúng tôi đánh giá cao sự quan tâm của bạn và chúc bạn nhiều thành công trong tương lai. Bạn hoàn toàn có thể nộp lại hồ sơ trong những đợt tuyển dụng/đăng ký sau.
        </p>
        <br/>
        <p style="color: #0f172a; font-size: 15px; font-weight: bold;">
          Trân trọng,<br/>
          Đội ngũ EducoreAcademy
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Gửi email phê duyệt đơn đăng ký giảng viên kèm thông tin đăng nhập
 */
const sendInstructorApplicationApproveEmail = async (to, name, email, password) => {
  const mailOptions = {
    from: '"EducoreAcademy" <no-reply@educoreacademy.com>',
    to,
    subject: 'Chào mừng đối tác mới – EducoreAcademy',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1d4ed8; font-size: 24px; margin: 0;">🎉 Chúc mừng ${name}!</h1>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Hồ sơ đăng ký trở thành đối tác giảng dạy của bạn đã được <strong>phê duyệt</strong>. Chào mừng bạn gia nhập đội ngũ giảng viên của EducoreAcademy!
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Dưới đây là thông tin tài khoản để bạn có thể truy cập vào hệ thống dành cho Giảng viên:
        </p>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px; font-size: 15px; color: #0f172a;"><strong>Email đăng nhập:</strong> ${email}</p>
          <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Mật khẩu:</strong> ${password}</p>
        </div>
        <p style="color: #dc2626; font-size: 14px; line-height: 1.6; font-style: italic;">
          Lưu ý: Bạn nên đăng nhập và đổi mật khẩu ngay trong lần truy cập đầu tiên để bảo mật tài khoản.
        </p>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
          Nếu bạn có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ lại với chúng tôi.
        </p>
        <br/>
        <p style="color: #0f172a; font-size: 15px; font-weight: bold;">
          Trân trọng,<br/>
          Đội ngũ EducoreAcademy
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { 
  sendOtpEmail,
  sendInstructorApplicationRejectEmail,
  sendInstructorApplicationApproveEmail
};
