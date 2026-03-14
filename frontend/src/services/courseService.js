import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch published courses — optional category & type ('pro' or 'free')
export const fetchCoursesAPI = (category = '', type = '', page = 1, limit = 8) => {
  const params = { page, limit };
  if (category && category !== 'Tất cả') params.category = category;
  if (type) params.type = type;
  return axios.get(`${API_URL}/courses`, { params });
};

// Fetch available categories list
export const fetchCategoriesAPI = (type = '') => {
  const params = type ? { type } : {};
  return axios.get(`${API_URL}/courses/categories`, { params });
};

// Fetch single course by ID
export const fetchCourseByIdAPI = (id) => axios.get(`${API_URL}/courses/${id}`);
