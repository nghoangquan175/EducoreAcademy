require('dotenv').config();
const { sequelize } = require('./config/db');
const Course = require('./models/Course');

const FREE_COURSES = [
  {
    title: 'Cấu trúc dữ liệu và giải thuật (C++)',
    description: 'Nắm vững các thuật toán cốt lõi, từ mảng, danh sách liên kết, cây, đồ thị đến quy hoạch động. Nền tảng vững chắc cho mọi kỹ sư phần mềm.',
    price: 0,
    category: 'IT & Web',
    thumbnail: 'https://placehold.co/400x240/1a1a2e/e2e8f0?text=Data+Structures',
    level: 'Intermediate',
    rating: 4.8,
    studentsCount: 15420,
    duration: '22 giờ',
    published: true,
  },
  {
    title: 'Nhập môn lập trình Front-end cơ bản',
    description: 'Bước đầu tiên để trở thành Web Developer. Học HTML5, CSS3, Flexbox, Grid và JavaScript cơ bản để tự xây dựng giao diện web tĩnh.',
    price: 0,
    category: 'IT & Web',
    thumbnail: 'https://placehold.co/400x240/f59e0b/fff?text=Frontend+Basic',
    level: 'Beginner',
    rating: 4.7,
    studentsCount: 28100,
    duration: '15 giờ',
    published: true,
  },
  {
    title: 'Nền tảng quay phim và nhiếp ảnh cơ bản',
    description: 'Hiểu về bố cục, ánh sáng, khẩu độ, tốc độ màn trập và ISO. Áp dụng ngay với máy ảnh DSLR hoặc smartphone của bạn.',
    price: 0,
    category: 'Video & Edit',
    thumbnail: 'https://placehold.co/400x240/7c2d12/fff7ed?text=Photography',
    level: 'Beginner',
    rating: 4.9,
    studentsCount: 9350,
    duration: '8 giờ',
    published: true,
  },
  {
    title: 'Lập trình C++ cho người mới bắt đầu',
    description: 'Khóa học dành cho sinh viên IT năm nhất. Giới thiệu biến, vòng lặp, hàm, con trỏ và lập trình hướng đối tượng cơ bản trong C++.',
    price: 0,
    category: 'IT & Web',
    thumbnail: 'https://placehold.co/400x240/1e3a8a/eff6ff?text=C%2B%2B+Basic',
    level: 'Beginner',
    rating: 4.6,
    studentsCount: 35000,
    duration: '18 giờ',
    published: true,
  },
  {
    title: 'Tư duy thiết kế (Design Thinking) cho Graphic Design',
    description: 'Không dạy sử dụng tool, khóa học này tập trung vào tư duy sáng tạo, nguyên lý thị giác, màu sắc, Typography và bố cục.',
    price: 0,
    category: 'Design',
    thumbnail: 'https://placehold.co/400x240/a21caf/fdf4ff?text=Design+Thinking',
    level: 'Beginner',
    rating: 4.8,
    studentsCount: 12400,
    duration: '12 giờ',
    published: true,
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Các khái niệm cơ bản về an toàn thông tin, nhận thức bảo mật mạng, malware, phishing và cách bảo vệ tài khoản cá nhân trên Internet.',
    price: 0,
    category: 'Cybersecurity',
    thumbnail: 'https://placehold.co/400x240/0f172a/f0fdf4?text=Cyber+Basics',
    level: 'Beginner',
    rating: 4.5,
    studentsCount: 8800,
    duration: '6 giờ',
    published: true,
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected');
    await Course.bulkCreate(FREE_COURSES);
    console.log(`Đã seed ${FREE_COURSES.length} free courses thành công!`);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
})();
