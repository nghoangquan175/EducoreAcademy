const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  videoUrl: {
    // URL từ Cloudinary, Youtube, etc.
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
  content: {
    // Nội dung văn bản của bài học (nếu có)
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lessonOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  duration: {
    // Thời lượng video dạng string, ví dụ: "05:20", "01:30:00"
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  isFree: {
    // Bài học miễn phí (Học thử) hay phải đăng ký?
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // chapterId là foreign key - sẽ được thêm tự động qua Association
});

module.exports = Lesson;
