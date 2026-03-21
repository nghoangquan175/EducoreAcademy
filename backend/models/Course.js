const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  thumbnail: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  previewVideoUrl: {
    type: DataTypes.STRING(1024),
    allowNull: true,
  },
  level: {
    type: DataTypes.STRING(50),
    defaultValue: 'Beginner',
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  studentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
    duration: {
    type: DataTypes.STRING(50), // e.g. "12 giờ", "8.5 giờ"
    allowNull: true,
  },
  videoCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  quizCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  published: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 0 = Draft, 1 = Pending, 2 = Published, 3 = Rejected
  },
  isPro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  paranoid: true,
  timestamps: true,
  indexes: [
    { fields: ['title'] },
    { fields: ['category'] },
    { fields: ['published'] },
  ],
});

Course.updateCourseStats = async function(courseId) {
  const { Lesson, Chapter, Quiz } = require('./index');
  try {
    const videoCount = await Lesson.count({
      where: {
        videoUrl: { [require('sequelize').Op.not]: null, [require('sequelize').Op.ne]: '' }
      },
      include: [{
        model: Chapter,
        where: { courseId },
        required: true
      }]
    });

    const quizCount = await Quiz.count({
      include: [{
        model: Lesson,
        required: true,
        include: [{
          model: Chapter,
          where: { courseId },
          required: true
        }]
      }]
    });

    await Course.update({ videoCount, quizCount }, { where: { id: courseId } });
    return { videoCount, quizCount };
  } catch (error) {
    console.error('Error updating course stats:', error);
    throw error;
  }
};

module.exports = Course;
