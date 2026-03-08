import React from 'react';
import { useParams, Link } from 'react-router-dom';

const CoursePage = () => {
  const { id } = useParams();

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      color: '#f1f5f9',
      padding: '40px',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
        Welcome to Course ID: {id}
      </h1>
      <p style={{ color: '#64748b' }}>Nội dung chi tiết khoá học sẽ được xây dựng sau.</p>
      <Link
        to="/"
        style={{
          color: '#818cf8',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}
      >
        ← Quay về trang chủ
      </Link>
    </div>
  );
};

export default CoursePage;
