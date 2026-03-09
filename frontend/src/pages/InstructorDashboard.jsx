import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit, Trash2, Video, List } from 'lucide-react';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tạm thời lấy tất cả khóa học (Sau này sẽ có token/API riêng trả về khóa học của Giảng viên đăng nhập)
    const fetchMyCourses = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/courses'); // Giả định lấy tạm
        setCourses(data);
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải khóa học:', error);
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  return (
    <div className="instructor-dashboard-wrapper">
      <div className="dashboard-container">
        
        <div className="dashboard-header">
          <div>
            <h1>Dashboard Giảng Viên</h1>
            <p>Quản lý các khóa học do bạn biên soạn</p>
          </div>
          <Link to="/instructor/course/create" className="btn-create-course">
            <Plus size={18} /> Tạo khóa học mới
          </Link>
        </div>

        <div className="dashboard-content">
          {loading ? (
             <div className="loading-state">Đang tải dữ liệu...</div>
          ) : courses.length === 0 ? (
             <div className="empty-state">
                <Video size={48} className="empty-icon"/>
                <h3>Bạn chưa có khóa học nào</h3>
                <p>Bắt đầu chia sẻ kiến thức của bạn bằng cách tạo khóa học đầu tiên nhé!</p>
                <Link to="/instructor/course/create" className="btn-create-course mt-4">
                  <Plus size={18} /> Tạo ngay
                </Link>
             </div>
          ) : (
             <div className="course-list-table">
               <table>
                 <thead>
                   <tr>
                     <th>Khóa học</th>
                     <th>Danh mục</th>
                     <th>Giá</th>
                     <th>Học viên</th>
                     <th>Trạng thái</th>
                     <th>Thao tác</th>
                   </tr>
                 </thead>
                 <tbody>
                   {courses.map(course => (
                     <tr key={course.id}>
                       <td>
                         <div className="course-info-cell">
                           <img src={course.thumbnail || 'https://via.placeholder.com/80x45'} alt="" className="table-thumb" />
                           <div className="course-title-cell">
                             <strong>{course.title}</strong>
                             <span>Cập nhật gần nhất</span>
                           </div>
                         </div>
                       </td>
                       <td>{course.category}</td>
                       <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</td>
                       <td>{course.studentsCount}</td>
                       <td>
                         <span className={`status-badge ${course.published ? 'published' : 'draft'}`}>
                           {course.published ? 'Đã xuất bản' : 'Bản nháp'}
                         </span>
                       </td>
                       <td>
                         <div className="action-buttons">
                           <Link to={`/instructor/course/${course.id}/edit`} className="action-btn edit-btn" title="Chỉnh sửa thông tin">
                             <Edit size={16} />
                           </Link>
                           <Link to={`/instructor/course/${course.id}/curriculum`} className="action-btn curriculum-btn" title="Quản lý Bài học & Video">
                             <List size={16} />
                           </Link>
                           <button className="action-btn delete-btn" title="Xóa">
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default InstructorDashboard;
