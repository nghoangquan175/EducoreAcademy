import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Download } from 'lucide-react';
import './AdminRevenue.css'; // Reuse the identical styles

const InstructorRevenue = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [coursesRows, setCoursesRows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/revenue/instructor/overview?startDate=${startDate}&endDate=${endDate}`;
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
      const url = `http://localhost:5000/api/revenue/instructor/courses?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setCoursesRows(data);
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
      const url = `http://localhost:5000/api/revenue/instructor/transactions?startDate=${startDate}&endDate=${endDate}`;
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
    <div className="inst-content-fade-in admin-revenue-wrapper">
      <h2 className="inst-content-title" style={{ marginBottom: '24px' }}>Báo cáo Doanh thu của bạn</h2>
      
      {/* Date Filters */}
      <div className="revenue-filters">
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
          className={`revenue-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Lịch sử Mua
        </button>
      </div>

      {loading && <div className="loading-container">Đang tải dữ liệu...</div>}

      {!loading && activeTab === 'overview' && overview && (
        <div className="revenue-overview-section">
          <div className="stat-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-card green">
              <h3>Lợi nhuận</h3>
              <p className="stat-value">{formatCurrency(overview.totalInstructorNetRevenue)}</p>
            </div>
            <div className="stat-card purple">
              <h3>Tổng số lượt bán</h3>
              <p className="stat-value">{overview.totalSales}</p>
            </div>
          </div>
          
          <div className="chart-container" style={{ height: '300px' }}>
             <div className="chart-wrapper">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical"
                    data={[
                      { name: 'Phần trăm (%)', value: overview.totalFromTransactions, color: '#6366f1' },
                      { name: 'Mua đứt', value: overview.totalFromFixed, color: '#10b981' }
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
                          { name: 'Phần trăm (%)', value: overview.totalFromTransactions, color: '#6366f1' },
                          { name: 'Mua đứt', value: overview.totalFromFixed, color: '#10b981' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* New Daily Breakdown Table: Only visible when filtered */}
          {(startDate || endDate) && (
            <div className="revenue-table-section" style={{ marginTop: '40px' }}>
              <div className="table-header-custom">
                <h3 className="text-xl font-bold">Chi tiết doanh thu theo ngày</h3>
                {overview.totalSales > 0 && (
                  <button 
                    onClick={() => handleExportCSV(overview.dailyStats.map(s => ({
                      Ngay: s.date,
                      DoanhThu_Gross: s.grossRevenue,
                      LoiNhuan_CuaToi: s.instructorNet,
                      SoDonHang: s.salesCount
                    })), 'instructor_daily_revenue.csv')}
                    className="btn-export"
                  >
                    <Download size={16} /> Xuất dữ liệu ngày
                  </button>
                )}
              </div>
              {overview.totalSales > 0 ? (
                <div className="table-container">
                  <table className="inst-table">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Doanh thu (Gross)</th>
                        <th>Lợi nhuận của tôi</th>
                        <th>Số đơn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.dailyStats.map((s, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{new Date(s.date).toLocaleDateString('vi-VN')}</td>
                          <td>{s.grossRevenue > 0 ? formatCurrency(s.grossRevenue) : <span className="sub-text">---</span>}</td>
                          <td className="highlight-text-orange">
                            {s.instructorNet !== 0 ? formatCurrency(s.instructorNet) : '---'}
                          </td>
                          <td>{s.salesCount === 0 ? <span className="sub-text">---</span> : s.salesCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  Không có dữ liệu lợi nhuận trong khoảng thời gian này
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && activeTab === 'courses' && (
        <div className="revenue-table-section">
          <div className="table-header-custom">
            <h3>Báo cáo Khóa học</h3>
            <button 
              onClick={() => handleExportCSV(coursesRows.map(r => ({
                CourseId: r.courseId,
                Title: r.Course?.title,
                SalesCount: r.totalSales,
                TotalGross: r.totalGross,
                MyNetRevenue: r.totalInstructorNet
              })), 'instructor_revenue_courses.csv')}
              className="btn-export"
            >
              <Download size={16} /> Xuất CSV
            </button>
          </div>
          <div className="table-container" style={{overflowX: 'auto'}}>
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Khóa học</th>
                  <th>Lượt bán</th>
                  <th>Chính sách</th>
                  <th>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {coursesRows.length > 0 ? coursesRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="course-cell-with-thumb">
                        <img src={row.Course?.thumbnail || 'https://via.placeholder.com/120x68'} alt="" className="course-thumb-mini" />
                        <div className="main-text">{row.Course?.title}</div>
                      </div>
                    </td>
                    <td>{row.totalSales}</td>
                    <td>
                      <span className="sub-text">
                        {row.policy?.type === 'PERCENT' && `${row.policy.instructorPercent}%`}
                        {row.policy?.type === 'FIXED' && 'Mua đứt'}
                        {row.policy?.type === 'HYBRID' && `${row.policy.instructorPercent}% + cọc`}
                        {!row.policy && '---'}
                      </span>
                    </td>
                    <td className="highlight-text-orange">{formatCurrency(row.totalInstructorNet)}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="empty-table-cell">Không có dữ liệu</td></tr>}
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
                InstructorNet: t.instructorAmount
              })), 'instructor_transactions.csv')}
              className="btn-export"
            >
              <Download size={16} /> Xuất CSV
            </button>
          </div>
          <div className="table-container" style={{overflowX: 'auto'}}>
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Ngày GD</th>
                  <th>Học sinh</th>
                  <th>Khóa học</th>
                  <th>Phần trăm</th>
                  <th>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? transactions.map((t, idx) => (
                  <tr key={idx}>
                    <td>
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
                    <td>
                      <span className="sub-text">
                        {t.revenuePolicy ? `${t.revenuePolicy.instructorPercent}%` : '---'}
                      </span>
                    </td>
                    <td className="highlight-text-orange">{formatCurrency(t.instructorAmount)}</td>
                  </tr>
                )) : <tr><td colSpan="5" className="empty-table-cell">Không có dữ liệu giao dịch chia sẻ doanh thu</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstructorRevenue;
