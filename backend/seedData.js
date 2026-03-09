const dotenv = require('dotenv');
dotenv.config();

const { connectDB, sequelize } = require('./config/db');
const { User, Course, Chapter, Lesson } = require('./models');

const seedData = async () => {
  try {
    await connectDB();
    
    // Xóa dữ liệu cũ (chỉ dùng cho DEV)
    console.log('Clearing old data...');
    await Lesson.destroy({ where: {} });
    await Chapter.destroy({ where: {} });
    await Course.destroy({ where: {} });
    
    console.log('Creating instructor...');
    // Lấy một Instructor hiện có hoặc tạo mới
    let instructor = await User.findOne({ where: { role: 'instructor' } });
    if (!instructor) {
      instructor = await User.create({
        name: 'Quan Nguyen',
        email: 'instructor@test.com',
        password: '123', // Hashed in User model hook if setup, simple fallback here
        role: 'instructor'
      });
    }

    console.log('Creating course...');
    const course = await Course.create({
      title: 'Full-Stack Web Development Bootcamp 2026',
      description: 'Trở thành lập trình viên Full-Stack chuyên nghiệp với MERN/PERN stack. Khóa học bao gồm HTML, CSS, React, Node.js, Express, và SQL/NoSQL Database.',
      price: 1599000,
      category: 'Phát triển Web',
      thumbnail: 'https://via.placeholder.com/800x450',
      previewVideoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      level: 'All Levels',
      duration: '45 hours',
      published: true,
      instructorId: instructor.id,
      rating: 4.8,
      studentsCount: 1250
    });

    console.log('Creating chapters...');
    const chapter1 = await Chapter.create({ title: 'Chương 1: Giới thiệu khóa học', chapterOrder: 1, courseId: course.id });
    const chapter2 = await Chapter.create({ title: 'Chương 2: Kiến thức nền tảng Frontend', chapterOrder: 2, courseId: course.id });
    const chapter3 = await Chapter.create({ title: 'Chương 3: React.js Chuyên sâu', chapterOrder: 3, courseId: course.id });

    console.log('Creating lessons...');
    await Lesson.bulkCreate([
      // Chương 1
      { title: 'Định hướng lộ trình học tập', duration: '05:20', isFree: true, lessonOrder: 1, chapterId: chapter1.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { title: 'Cài đặt môi trường Node.js & VS Code', duration: '12:45', isFree: true, lessonOrder: 2, chapterId: chapter1.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
      // Chương 2
      { title: 'HTML5 Semantic Elements', duration: '20:15', isFree: false, lessonOrder: 1, chapterId: chapter2.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
      { title: 'CSS3 Flexbox & Grid trong thực tế', duration: '35:00', isFree: false, lessonOrder: 2, chapterId: chapter2.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
      { title: 'Responsive Design với TailwindCSS', duration: '40:30', isFree: false, lessonOrder: 3, chapterId: chapter2.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      // Chương 3
      { title: 'Hiểu về Virtual DOM & Component Lifecycle', duration: '25:10', isFree: false, lessonOrder: 1, chapterId: chapter3.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
      { title: 'Hooks: useState, useEffect, useRef', duration: '45:00', isFree: false, lessonOrder: 2, chapterId: chapter3.id, videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    ]);

    console.log('Data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
