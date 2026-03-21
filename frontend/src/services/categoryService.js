import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchAllCategoriesAPI = async () => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data;
};

export const createCategoryAPI = async (name) => {
  const response = await axios.post(`${API_URL}/categories`, { name }, getAuthConfig());
  return response.data;
};

export const updateCategoryAPI = async (id, name) => {
  const response = await axios.put(`${API_URL}/categories/${id}`, { name }, getAuthConfig());
  return response.data;
};

export const deleteCategoryAPI = async (id) => {
  const response = await axios.delete(`${API_URL}/categories/${id}`, getAuthConfig());
  return response.data;
};
