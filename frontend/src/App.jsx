import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';

import BannerCarousel from './components/BannerCarousel';
import ProCourses from './components/ProCourses';
import FreeCourses from './components/FreeCourses';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CoursePage from './pages/CoursePage';
import LearningPage from './pages/LearningPage';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseEditor from './pages/CourseEditor';
import UnauthorizedPage from './pages/UnauthorizedPage';
import StaffLogin from './pages/StaffLogin';
import CheckoutPage from './pages/CheckoutPage';
import StudentDashboard from './pages/StudentDashboard';
import CourseCongrats from './pages/CourseCongrats';
import PrivateRoute from './components/PrivateRoute';
import PaymentResult from './pages/PaymentResult';
import { BookOpen, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';

// Layout with Header — used by all normal pages
const MainLayout = () => (
  <div className="app-container">
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Layout without Header — used by auth pages
const AuthLayout = () => (
  <div className="app-container">
    <Outlet />
  </div>
);

// Layout for Learning — no standard Header/Footer
const LearningLayout = () => (
  <div className="learning-app-container">
    <Outlet />
  </div>
);

// Layout for Checkout — mini header, no footer, full screen gradient
const CheckoutLayout = () => {
  const navigate = useNavigate();
  return (
    <div className="checkout-layout-container">
      <header className="checkout-mini-header">
        <div className="checkout-mini-logo" onClick={() => navigate('/')}>
          <BookOpen size={28} />
          <span>EducoreAcademy</span>
        </div>
        <button className="checkout-cancel-link" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </header>
      <main className="checkout-main-content">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Router>
            <Routes>
              {/* Auth pages — no header */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/staff/login" element={<StaffLogin />} />
              </Route>

              {/* Main pages — with header */}
              <Route element={<MainLayout />}>
                <Route path="/" element={
                  <>
                    <BannerCarousel />
                    <ProCourses />
                    <FreeCourses />
                  </>
                } />

                <Route path="/course/:id" element={<CoursePage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
              </Route>

              {/* Checkout page — custom layout */}
              <Route element={<CheckoutLayout />}>
                  <Route path="/checkout/:courseId" element={
                    <PrivateRoute allowedRoles={['student', 'instructor', 'admin']}>
                      <CheckoutPage />
                    </PrivateRoute>
                  } />
                  <Route path="/payment-result" element={<PaymentResult />} />
              </Route>

              {/* ----- STUDENT ROUTES (Full Screen) ----- */}
              <Route path="/student-dashboard" element={
                <PrivateRoute allowedRoles={['student', 'instructor', 'admin']}>
                  <StudentDashboard />
                </PrivateRoute>
              } />

              {/* ----- INSTRUCTOR ROUTES (Full Screen) ----- */}
              <Route path="/instructor-dashboard" element={
                <PrivateRoute allowedRoles={['instructor', 'admin']}>
                  <InstructorDashboard />
                </PrivateRoute>
              } />

              {/* Admin Dashboard — no header/footer */}
              <Route path="/admin-dashboard" element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } />

              {/* Learning pages — custom layout */}
              <Route element={<LearningLayout />}>
                <Route path="/learn/:courseId" element={<LearningPage />} />
                <Route path="/learn/:courseId/lesson/:lessonId" element={<LearningPage />} />
                <Route path="/course-completed/:courseId" element={<CourseCongrats />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );

}

export default App;
