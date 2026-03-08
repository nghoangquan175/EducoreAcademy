import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Facebook, Accessibility, BookOpen } from 'lucide-react'; // Placeholder cho TikTok icon
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Cột 1: Thông tin liên hệ */}
        <div className="footer-col footer-col-1">
          <div className="footer-logo">
            <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
              <BookOpen className="logo-icon" size={28} />
              <span>EducoreAcademy</span>
            </Link>
          </div>
          <ul className="footer-contact">
            <li>Điện thoại: 0397520088</li>
            <li>Email: contact@educore.edu.vn</li>
            <li>Địa chỉ: 96 Định Công, Hoàng Mai, Hà Nội</li>
          </ul>
          {/* <div className="footer-badges">
            <img src="https://images.dmca.com/Badges/dmca-badge-w100-5x1-01.png?ID=1" alt="DMCA Protected" className="badge-dmca" />
            <img src="https://theme.hstatic.net/1000300454/1001115596/14/bct.png?v=913" alt="Đã thông báo Bộ Công Thương" className="badge-bct" />
          </div> */}
        </div>

        {/* Cột 2: Về Educore */}
        <div className="footer-col">
          <h3 className="footer-heading">VỀ EDUCORE ACADEMY</h3>
          <ul className="footer-links">
            <li><Link to="/about">Giới thiệu</Link></li>
            <li><Link to="/contact">Liên hệ</Link></li>
            <li><Link to="/terms">Điều khoản & Quy định</Link></li>
            <li><Link to="/privacy">Chính sách bảo mật</Link></li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ */}
        <div className="footer-col">
          <h3 className="footer-heading">HỖ TRỢ</h3>
          <ul className="footer-links">
            <li><Link to="/payment-policy">Chính sách thanh toán</Link></li>
            <li><Link to="/shipping-policy">Chính sách vận chuyển</Link></li>
            <li><Link to="/inspection-policy">Chính sách kiểm hàng</Link></li>
            <li><Link to="/pricing-policy">Quy định về giá</Link></li>
          </ul>
        </div>

        {/* Cột 4: Company Info */}
        <div className="footer-col footer-col-4">
          <h3 className="footer-heading footer-company-name">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC EDUCORE ACADEMY</h3>
          <p className="footer-company-info">
            Mã số doanh nghiệp: 0109922901 do Chi cục Thuế Quận Hoàng Mai, Cục Thuế TP. Hà Nội cấp ngày 04/03/2026
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>© 2026 Educore Academy. Nền tảng học lập trình hàng đầu Việt Nam.</p>
          <div className="footer-socials">
            <a href="#" className="social-btn btn-youtube" aria-label="Youtube"><Youtube size={16} /></a>
            <a href="#" className="social-btn btn-facebook" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#" className="social-btn btn-tiktok" aria-label="Tiktok">
              {/* Tiktok icon placeholder - SVG */}
              <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
