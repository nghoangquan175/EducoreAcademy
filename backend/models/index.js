const Banner = require('./Banner');
const User = require('./User');
const Course = require('./Course');
const Chapter = require('./Chapter');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Review = require('./Review');
const Notification = require('./Notification');
const Article = require('./Article');

// ─── Associations ───────────────────────────────────────────

// User (instructor) <--> Course
User.hasMany(Course, { foreignKey: 'instructorId', as: 'instructedCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// Course <--> Chapter (1 khóa học có nhiều chương)
Course.hasMany(Chapter, { foreignKey: 'courseId', as: 'chapters', onDelete: 'CASCADE' });
Chapter.belongsTo(Course, { foreignKey: 'courseId' });

// Chapter <--> Lesson (1 chương có nhiều bài học)
Chapter.hasMany(Lesson, { foreignKey: 'chapterId', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Chapter, { foreignKey: 'chapterId' });

// Enrollment
User.hasMany(Enrollment, { foreignKey: 'userId' });
Enrollment.belongsTo(User, { foreignKey: 'userId' });
Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

// Progress (gắn trực tiếp vào Lesson, không cần Course trung gian)
Enrollment.hasMany(Progress, { foreignKey: 'enrollmentId' });
Progress.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });
Lesson.hasMany(Progress, { foreignKey: 'lessonId' });
Progress.belongsTo(Lesson, { foreignKey: 'lessonId' });

// Review
Course.hasMany(Review, { foreignKey: 'courseId' });
Review.belongsTo(Course, { foreignKey: 'courseId' });
User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

// Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Article
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = {
  User,
  Course,
  Chapter,
  Lesson,
  Enrollment,
  Progress,
  Review,
  Notification,
  Article,
  Banner,
};
