import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-state">Đang xác thực...</div>;
  }

  if (!user) {
    // Chưa đăng nhập, chuyển hướng về trang login kèm địa chỉ dự định đến
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Đã đăng nhập nhưng không đủ quyền, về trang báo lỗi chặn
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
