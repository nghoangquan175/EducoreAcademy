import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch all active banners (public)
export const fetchBannersAPI = () => axios.get(`${API_URL}/banners`);

// Admin: fetch all banners including inactive
export const fetchAllBannersAPI = (token) =>
  axios.get(`${API_URL}/banners/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin: create a new banner
export const createBannerAPI = (data, token) =>
  axios.post(`${API_URL}/banners`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin: update a banner
export const updateBannerAPI = (id, data, token) =>
  axios.put(`${API_URL}/banners/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Admin: delete a banner
export const deleteBannerAPI = (id, token) =>
  axios.delete(`${API_URL}/banners/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });


