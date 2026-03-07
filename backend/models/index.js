const User = require('./User');
const Course = require('./Course');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Review = require('./Review');

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

module.exports = {
  User,
  Course,
  Lesson,
  Enrollment,
  Progress,
  Review
};
