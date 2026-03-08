import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import BannerCarousel from './components/BannerCarousel';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';

// Layout with Header — used by all normal pages
const MainLayout = () => (
  <div className="app-container">
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

// Layout without Header — used by auth pages
const AuthLayout = () => (
  <div className="app-container">
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
            </Route>

            {/* Main pages — with header */}
            <Route element={<MainLayout />}>
              <Route path="/" element={
                <>
                  <BannerCarousel />
                  <div style={{ padding: '40px 80px' }}><h2>Welcome to the Learning Platform!</h2></div>
                </>
              } />
              <Route path="/courses" element={<div><h2>Course List</h2></div>} />
              <Route path="/student-dashboard" element={<div><h2>Student Dashboard</h2></div>} />
              <Route path="/instructor-dashboard" element={<div><h2>Instructor Dashboard</h2></div>} />
              <Route path="/admin-dashboard" element={<div><h2>Admin Dashboard</h2></div>} />
              <Route path="/course/:id" element={<div><h2>Course Detail</h2></div>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
