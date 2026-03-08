import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './BannerCarousel.css';

const slides = [
  {
    id: 1,
    title: 'Làm chủ React.js từ Zero đến Hero',
    description:
      'Nắm vững nền tảng, hooks, context API và các design pattern hiện đại nhất. Xây dựng ứng dụng thực chiến cùng đội ngũ mentor hơn 10 năm kinh nghiệm.',
    buttonText: 'Khám phá ngay',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    imageUrl: 'https://placehold.co/520x420/0f3460/e2e8f0?text=React+Hero',
    tag: 'Phổ biến nhất',
  },
  {
    id: 2,
    title: 'Node.js & Express — Xây dựng REST API Chuẩn',
    description:
      'Học cách thiết kế kiến trúc backend mạnh mẽ với Node.js, Express, JWT & database. Triển khai API sẵn sàng đưa vào production ngay sau khoá học.',
    buttonText: 'Đăng ký học',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #065f46 50%, #047857 100%)',
    imageUrl: 'https://placehold.co/520x420/047857/ecfdf5?text=Node+API',
    tag: 'Backend',
  },
  {
    id: 3,
    title: 'Machine Learning & AI Thực Chiến',
    description:
      'Từ hồi quy tuyến tính đến mạng nơ-ron sâu — bạn sẽ hiểu lý thuyết và xây dựng mô hình thực tế bằng Python và TensorFlow ngay từ bài học đầu tiên.',
    buttonText: 'Bắt đầu học',
    gradient: 'linear-gradient(135deg, #4a044e 0%, #701a75 50%, #a21caf 100%)',
    imageUrl: 'https://placehold.co/520x420/a21caf/fdf4ff?text=AI+%26+ML',
    tag: 'Trending',
  },
  {
    id: 4,
    title: 'UI/UX Design — Thiết kế sản phẩm số đỉnh cao',
    description:
      'Nghiên cứu người dùng, wireframing, prototyping với Figma và kiểm tra khả năng sử dụng. Học tư duy thiết kế mà mọi doanh nghiệp công nghệ đang săn đón.',
    buttonText: 'Xem chương trình',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
    imageUrl: 'https://placehold.co/520x420/ea580c/fff7ed?text=UI%2FUX+Design',
    tag: 'Sáng tạo',
  },
  {
    id: 5,
    title: 'DevOps & Cloud — Docker, CI/CD và AWS',
    description:
      'Làm chủ vòng đời phần mềm hiện đại: containerisé với Docker, tự động hoá pipeline CI/CD và triển khai hạ tầng đám mây trên AWS cùng Terraform.',
    buttonText: 'Tìm hiểu thêm',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
    imageUrl: 'https://placehold.co/520x420/2563eb/eff6ff?text=DevOps+Cloud',
    tag: 'Nâng cao',
  },
  {
    id: 6,
    title: 'Cybersecurity — Bảo mật hệ thống từ A đến Z',
    description:
      'Xâm nhập có đạo đức, phân tích lỗ hổng, bảo vệ hạ tầng và ứng phó sự cố. Chuẩn bị hành trang vững chắc cho chứng chỉ CEH và OSCP quốc tế.',
    buttonText: 'Đăng ký ngay',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e2a3a 40%, #0e4429 100%)',
    imageUrl: 'https://placehold.co/520x420/166534/f0fdf4?text=Cybersecurity',
    tag: 'Chuyên sâu',
  },
];

const BannerCarousel = () => {
  return (
    <div className="banner-wrapper">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation={{
          prevEl: '.banner-btn-prev',
          nextEl: '.banner-btn-next',
        }}
        pagination={{
          el: '.banner-pagination',
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} banner-bullet"></span>`,
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop
        speed={600}
        className="banner-swiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div
              className="banner-slide"
              style={{ background: slide.gradient }}
            >
              {/* Left — Content */}
              <div className="banner-content">
                <span className="banner-tag">{slide.tag}</span>
                <h2 className="banner-title">{slide.title}</h2>
                <p className="banner-desc">{slide.description}</p>
                <button className="banner-btn-cta">
                  {slide.buttonText}
                  <ArrowRight size={18} className="btn-icon" />
                </button>
              </div>

              {/* Right — Image */}
              <div className="banner-image-col">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="banner-image"
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Nav Buttons */}
      <button className="banner-btn-prev banner-nav-btn" aria-label="Previous slide">
        <ChevronLeft size={24} />
      </button>
      <button className="banner-btn-next banner-nav-btn" aria-label="Next slide">
        <ChevronRight size={24} />
      </button>

      {/* Custom Pagination */}
      <div className="banner-pagination-wrapper">
        <div className="banner-pagination" />
      </div>
    </div>
  );
};

export default BannerCarousel;
