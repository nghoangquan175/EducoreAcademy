import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
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
import PrivateRoute from './components/PrivateRoute';

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

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
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
              <Route path="/checkout/:courseId" element={<CheckoutPage />} />
            </Route>

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
              <Route path="/learn/:courseId/lesson/:lessonId" element={<LearningPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
