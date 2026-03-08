const User = require('./User');
const Course = require('./Course');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Review = require('./Review');
const Notification = require('./Notification');
const Article = require('./Article');

// Define Associations

// A User (instructor) can author many Courses
User.hasMany(Course, { foreignKey: 'instructorId', as: 'instructedCourses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// A Course has many Lessons
Course.hasMany(Lesson, { foreignKey: 'courseId' });
Lesson.belongsTo(Course, { foreignKey: 'courseId' });

// A User can enroll in many Courses (Enrollment)
User.hasMany(Enrollment, { foreignKey: 'userId' });
Enrollment.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

// An Enrollment has many Progress records (one per lesson)
Enrollment.hasMany(Progress, { foreignKey: 'enrollmentId' });
Progress.belongsTo(Enrollment, { foreignKey: 'enrollmentId' });

Lesson.hasMany(Progress, { foreignKey: 'lessonId' });
Progress.belongsTo(Lesson, { foreignKey: 'lessonId' });

// A Course can have many Reviews
Course.hasMany(Review, { foreignKey: 'courseId' });
Review.belongsTo(Course, { foreignKey: 'courseId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

// A User can have many Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// A User (author) can have many Articles
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = {
  User,
  Course,
  Lesson,
  Enrollment,
  Progress,
  Review,
  Notification,
  Article
};
