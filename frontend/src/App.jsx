import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="header">
          <h1>EducoreAcademy</h1>
          <nav>
            <a href="/">Home</a>
            <a href="/courses">Courses</a>
            <a href="/login">Login</a>
          </nav>
        </header>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<div><h2>Welcome to the Learning Platform!</h2></div>} />
            <Route path="/courses" element={<div><h2>Course List</h2></div>} />
            <Route path="/login" element={<div><h2>Login / Register</h2></div>} />
            <Route path="/student-dashboard" element={<div><h2>Student Dashboard</h2></div>} />
            <Route path="/instructor-dashboard" element={<div><h2>Instructor Dashboard</h2></div>} />
            <Route path="/admin-dashboard" element={<div><h2>Admin Dashboard</h2></div>} />
            <Route path="/course/:id" element={<div><h2>Course Detail</h2></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
