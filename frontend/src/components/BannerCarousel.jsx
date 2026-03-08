import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { fetchBannersAPI } from '../services/bannerService';
import './BannerCarousel.css';

const BannerCarousel = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data } = await fetchBannersAPI();
        setSlides(data);
      } catch (err) {
        console.error('Banner fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBanners();
  }, []);

  if (loading) {
    return (
      <div className="banner-wrapper banner-skeleton">
        <div className="banner-skeleton-inner" />
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

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
                {slide.tag && <span className="banner-tag">{slide.tag}</span>}
                <h2 className="banner-title">{slide.title}</h2>
                <p className="banner-desc">{slide.description}</p>
                <button className="banner-btn-cta">
                  {slide.buttonText || 'Khám phá ngay'}
                  <ArrowRight size={18} className="btn-icon" />
                </button>
              </div>

              {/* Right — Image */}
              {slide.imageUrl && (
                <div className="banner-image-col">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="banner-image"
                  />
                </div>
              )}
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
