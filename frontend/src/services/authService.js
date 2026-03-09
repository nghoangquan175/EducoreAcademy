import axios from 'axios';

const API = 'http://localhost:5000/api/users';

export const loginAPI = (email, password) =>
  axios.post(`${API}/login`, { email, password });

export const registerAPI = (name, email, password) =>
  axios.post(`${API}/register`, { name, email, password });

export const googleLoginAPI = (credential) =>
  axios.post(`${API}/auth/google`, { credential });

export const facebookLoginAPI = (accessToken) =>
  axios.post(`${API}/auth/facebook`, { accessToken });

export const sendOtpAPI = (name, email, password) =>
  axios.post(`${API}/send-otp`, { name, email, password });

export const verifyOtpAPI = (email, otp) =>
  axios.post(`${API}/verify-otp`, { email, otp });
