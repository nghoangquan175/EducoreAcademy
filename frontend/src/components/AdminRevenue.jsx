import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Download } from 'lucide-react';
import './AdminRevenue.css';

const AdminRevenue = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [coursesRows, setCoursesRows] = useState([]);
  const [instructorsRows, setInstructorsRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/revenue/admin/overview?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/revenue/admin/courses?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setCoursesRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/revenue/admin/instructors?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setInstructorsRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/revenue/admin/transactions?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    else if (activeTab === 'courses') fetchCourses();
    else if (activeTab === 'instructors') fetchInstructors();
    else if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = (data, filename) => {
    if (!data || !data.length) return;
    const replacer = (key, value) => value === null ? '' : value; 
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="admin-content-fade-in admin-revenue-wrapper">
      <h2 className="content-title">Quản lý Doanh thu Hệ thống</h2>
      
      {/* Date Filters */}
      <div className="admin-filters-bar revenue-filters">
        <div className="filter-group">
          <label>Từ ngày</label>
          <input 
            type="date" 
            className="filter-input"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div className="filter-group">
          <label>Đến ngày</label>
          <input 
            type="date" 
            className="filter-input"
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
        <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            onClick={() => {setStartDate(''); setEndDate('');}} 
            className="btn-clear-filter"
          >
            Xóa Lọc
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="revenue-tabs">
        <button
          className={`revenue-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          className={`revenue-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Theo Khóa Học
        </button>
        <button
          className={`revenue-tab ${activeTab === 'instructors' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructors')}
        >
          Theo Giảng Viên
        </button>
        <button
          className={`revenue-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Giao dịch
        </button>
      </div>

      {loading && <div className="loading-container">Đang tải dữ liệu...</div>}

      {!loading && activeTab === 'overview' && overview && (
        <div className="revenue-overview-section">
          <div className="stat-cards-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card blue">
              <h3>Doanh thu</h3>
              <p className="stat-value">{formatCurrency(overview.totalGrossRevenue)}</p>
            </div>
            <div className={`stat-card ${overview.totalAdminNetRevenue < 0 ? 'red' : 'green'}`}>
              <h3>Lợi nhuận</h3>
              <p className="stat-value">{formatCurrency(overview.totalAdminNetRevenue)}</p>
            </div>
            <div className="stat-card purple">
              <h3>Tổng Giao dịch</h3>
              <p className="stat-value">{overview.totalTransactions}</p>
            </div>
          </div>
          
          <div className="chart-container" style={{ height: '300px' }}>
             <div className="chart-wrapper">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                   layout="vertical"
                   data={[
                     { name: 'Doanh thu', value: overview.totalGrossRevenue, color: '#6366f1' },
                     { name: 'Tổng chi', value: overview.totalInstructorRevenue, color: '#f97316' }
                   ]}
                   margin={{ left: 40, right: 30 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" />
                   <YAxis dataKey="name" type="category" />
                   <Tooltip 
                     formatter={(value) => formatCurrency(value)} 
                     cursor={false}
                   />
                   <Bar dataKey="value" barSize={35} radius={[0, 4, 4, 0]}>
                     { 
                       [
                         { name: 'Doanh thu', value: overview.totalGrossRevenue, color: '#6366f1' },
                         { name: 'Tổng chi', value: overview.totalInstructorRevenue, color: '#f97316' }
                       ].map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))
                     }
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'courses' && (
        <div className="revenue-table-section">
          <div className="table-header-custom">
            <h3>Doanh thu theo khóa học</h3>
            <button 
              onClick={() => handleExportCSV(coursesRows.map(r => ({
                CourseId: r.courseId,
                Title: r.Course?.title,
                Price: r.Course?.price,
                Instructor: r.Course?.instructor?.name,
                SalesCount: r.totalSales,
                TotalGross: r.totalGross,
                AdminNet: r.totalAdminNet,
                InstructorNet: r.totalInstructorNet
              })), 'admin_revenue_courses.csv')}
              className="btn-export"
            >
              <Download size={16} /> Xuất CSV
            </button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Giảng viên</th>
                  <th>Lượt bán</th>
                  <th>Total Gross</th>
                  <th>Admin Nhận</th>
                  <th>GV Nhận</th>
                </tr>
              </thead>
              <tbody>
                {coursesRows.length > 0 ? coursesRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="course-cell-with-thumb">
                        <img src={row.Course?.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="course-thumb-mini" />
                        <div className="main-text-group">
                          <div className="main-text">{row.Course?.title}</div>
                          <div className="sub-text">{formatCurrency(row.Course?.price)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{row.Course?.instructor?.name || '---'}</td>
                    <td>{row.totalSales}</td>
                    <td className="highlight-text-indigo">{formatCurrency(row.totalGross)}</td>
                    <td className={`highlight-text-${row.totalAdminNet < 0 ? 'red' : 'green'}`}>{formatCurrency(row.totalAdminNet)}</td>
                    <td className="highlight-text-orange">{formatCurrency(row.totalInstructorNet)}</td>
                  </tr>
                )) : <tr><td colSpan="6" className="empty-table-cell">Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'instructors' && (
        <div className="revenue-table-section">
          <div className="table-header-custom">
             <h3>Doanh thu theo giảng viên</h3>
              <button 
                onClick={() => handleExportCSV(instructorsRows.map(r => ({
                  InstructorId: r.instructorId,
                  Name: r.instructor?.name,
                  Email: r.instructor?.email,
                  SalesCount: r.totalSales,
                  TotalGross: r.totalGross,
                  AdminNet: r.totalAdminNet,
                  InstructorNet: r.totalInstructorNet
                })), 'admin_revenue_instructors.csv')}
                className="btn-export"
              >
                <Download size={16} /> Xuất CSV
              </button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Giảng viên</th>
                  <th>Lượt bán</th>
                  <th>Total Gross</th>
                  <th>Admin Nhận</th>
                  <th>GV Nhận</th>
                </tr>
              </thead>
              <tbody>
                {instructorsRows.length > 0 ? instructorsRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="main-text">{row.instructor?.name || 'Unknown'}</div>
                      <div className="sub-text">{row.instructor?.email}</div>
                    </td>
                    <td>{row.totalSales}</td>
                    <td className="highlight-text-indigo">{formatCurrency(row.totalGross)}</td>
                    <td className={`highlight-text-${row.totalAdminNet < 0 ? 'red' : 'green'}`}>{formatCurrency(row.totalAdminNet)}</td>
                    <td className="highlight-text-orange">{formatCurrency(row.totalInstructorNet)}</td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty-table-cell">Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'transactions' && (
        <div className="revenue-table-section">
          <div className="table-header-custom">
            <h3>Lịch sử Giao dịch</h3>
             <button 
                onClick={() => handleExportCSV(transactions.map(t => ({
                  Id: t.id,
                  Date: new Date(t.createdAt).toLocaleDateString('vi-VN'),
                  User: t.User?.name,
                  Email: t.User?.email,
                  CourseTitle: t.Course?.title,
                  TotalGross: t.amount,
                  AdminNet: t.adminAmount,
                  InstructorNet: t.instructorAmount
                })), 'admin_transactions.csv')}
                className="btn-export"
              >
                <Download size={16} /> Xuất CSV
              </button>
          </div>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã / Ngày</th>
                  <th>Người mua</th>
                  <th>Khóa học</th>
                  <th>Tổng tiền (Gross)</th>
                  <th>Chia sẻ (Net)</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((t, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="main-text">#ORD-{t.id}</div>
                      <div className="sub-text">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td>
                      <div className="main-text">{t.User?.name}</div>
                      <div className="sub-text">{t.User?.email}</div>
                    </td>
                    <td>
                      <div className="course-cell-with-thumb">
                        <img src={t.Course?.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="course-thumb-mini" />
                        <div className="main-text">{t.Course?.title}</div>
                      </div>
                    </td>
                    <td className="highlight-text-indigo">{formatCurrency(t.amount)}</td>
                    <td>
                      <div className="split-info">
                         <span className="info-badge green">Admin: {formatCurrency(t.adminAmount)}</span>
                         <span className="info-badge orange">GV: {formatCurrency(t.instructorAmount)}</span>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty-table-cell">Không có dữ liệu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminRevenue;
