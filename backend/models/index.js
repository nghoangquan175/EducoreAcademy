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
const Quiz = require('./Quiz');
const Question = require('./Question');
const QuizAttempt = require('./QuizAttempt');
const StudyGoal = require('./StudyGoal');
const PaymentOrder = require('./PaymentOrder');
const Payment = require('./Payment');
const Comment = require('./Comment');
const Category = require('./Category');
const InstructorApplication = require('./InstructorApplication');
const ArticleLike = require('./ArticleLike');

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
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Article
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
 
// Comment
Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Article, { foreignKey: 'articleId' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// Article Like
User.belongsToMany(Article, { through: ArticleLike, as: 'likedArticles', foreignKey: 'userId' });
Article.belongsToMany(User, { through: ArticleLike, as: 'likedByUsers', foreignKey: 'articleId' });

Article.hasMany(ArticleLike, { foreignKey: 'articleId', as: 'likes' });
ArticleLike.belongsTo(Article, { foreignKey: 'articleId' });
User.hasMany(ArticleLike, { foreignKey: 'userId' });
ArticleLike.belongsTo(User, { foreignKey: 'userId' });

// Quiz
Lesson.hasOne(Quiz, { foreignKey: 'lessonId', as: 'quiz', onDelete: 'CASCADE' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId' });

Quiz.hasMany(Question, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quizId' });

User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId' });

User.hasMany(StudyGoal, { foreignKey: 'userId' });
StudyGoal.belongsTo(User, { foreignKey: 'userId' });

// Order
User.hasMany(PaymentOrder, { foreignKey: 'userId' });
PaymentOrder.belongsTo(User, { foreignKey: 'userId' });

Course.hasMany(PaymentOrder, { foreignKey: 'courseId' });
PaymentOrder.belongsTo(Course, { foreignKey: 'courseId' });

// Payment
PaymentOrder.hasMany(Payment, { foreignKey: 'orderId' });
Payment.belongsTo(PaymentOrder, { foreignKey: 'orderId' });

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
  Quiz,
  Question,
  QuizAttempt,
  StudyGoal,
  PaymentOrder,
  Payment,
  Comment,
  Category,
  InstructorApplication,
  ArticleLike
};
