import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch published courses — optional category & type ('pro' or 'free')
export const fetchCoursesAPI = (category = '', type = '', page = 1, limit = 8, excludeEnrolled = false) => {
  const params = { page, limit };
  if (category && category !== 'Tất cả') params.category = category;
  if (type) params.type = type;
  if (excludeEnrolled) params.excludeEnrolled = true;
  
  const token = localStorage.getItem('token');
  const config = token ? { params, headers: { Authorization: `Bearer ${token}` } } : { params };
  
  return axios.get(`${API_URL}/courses`, config);
};

// Fetch available categories list
export const fetchCategoriesAPI = (type = '') => {
  const params = type ? { type } : {};
  return axios.get(`${API_URL}/courses/categories`, { params });
};

// Fetch single course by ID
export const fetchCourseByIdAPI = (id) => {
  const token = localStorage.getItem('token');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return axios.get(`${API_URL}/courses/${id}`, config);
};

// Fetch curriculum (with enrollment status)
export const fetchCurriculumAPI = (id) => {
  const token = localStorage.getItem('token');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  return axios.get(`${API_URL}/courses/${id}/curriculum`, config);
};

export const fetchTrashCoursesAPI = () => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  return axios.get(`${API_URL}/courses/trash/all`, config);
};

export const restoreCourseAPI = (id) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  return axios.put(`${API_URL}/courses/${id}/restore`, {}, config);
};

export const forceDeleteCourseAPI = (id) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  return axios.delete(`${API_URL}/courses/${id}/force`, config);
};
 
export const fetchCourseReviewsAPI = (courseId, page = 1, limit = 10) => {
  return axios.get(`${API_URL}/courses/${courseId}/reviews`, { params: { page, limit } });
};
 
export const addCourseReviewAPI = (courseId, reviewData) => {
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  return axios.post(`${API_URL}/courses/${courseId}/reviews`, reviewData, config);
};

