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
    defaultValue: 0,
    // 0 = DRAFT, 1 = PENDING_REVIEW, 2 = CONTENT_APPROVED, 3 = REJECTED, 
    // 4 = READY_TO_PUBLISH, 5 = PUBLISHED, 6 = UNPUBLISHED
  },

  isPro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  rootCourseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isLatest: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  paranoid: true,
  timestamps: true,
  indexes: [
    { fields: ['title'] },
    { fields: ['category'] },
    { fields: ['published'] },
    { fields: ['rootCourseId'] },
    { fields: ['isLatest'] },
  ],
});

Course.updateCourseStats = async function (courseId) {
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

    // Fetch all lessons for chapters of this course
    const chapters = await Chapter.findAll({
      where: { courseId },
      include: [{ model: Lesson, as: 'lessons', attributes: ['duration'] }]
    });

    let totalCourseSeconds = 0;
    for (const chapter of chapters) {
      const chapterSeconds = (chapter.lessons || []).reduce((acc, l) => {
        const dur = l.duration || '0';
        if (dur.includes(':')) {
          const parts = dur.split(':');
          if (parts.length === 2) return acc + (parseInt(parts[0]) * 60 + parseInt(parts[1]));
          if (parts.length === 3) return acc + (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]));
        }
        return acc + (parseInt(dur) || 0);
      }, 0);

      // Update chapter duration
      await Chapter.update({ duration: String(chapterSeconds) }, { where: { id: chapter.id } });
      totalCourseSeconds += chapterSeconds;
    }

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

    await Course.update({ videoCount, quizCount, duration: String(totalCourseSeconds) }, { where: { id: courseId } });
    return { videoCount, quizCount, duration: totalCourseSeconds };
  } catch (error) {
    console.error('Error updating course stats:', error);
    throw error;
  }
};

module.exports = Course;
