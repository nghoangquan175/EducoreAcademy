import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
};

export const sendMessageAPI = async (message, conversationId = null, sessionId = null) => {
  const response = await axios.post(`${API_URL}/chat/send`, 
    { message, conversationId, sessionId },
    getAuthConfig()
  );
  return response.data;
};

export const getLatestConversationAPI = async () => {
  const response = await axios.get(`${API_URL}/chat/latest`, getAuthConfig());
  return response.data;
};

export const getConversationsAPI = async () => {
  const response = await axios.get(`${API_URL}/chat/conversations`, getAuthConfig());
  return response.data;
};

export const getMessagesAPI = async (conversationId, { before, limit = 10 } = {}) => {
  const params = new URLSearchParams();
  if (before) params.append('before', before);
  params.append('limit', limit);
  const response = await axios.get(
    `${API_URL}/chat/conversations/${conversationId}?${params.toString()}`,
    getAuthConfig()
  );
  return response.data;
};

export const deleteConversationAPI = async (conversationId) => {
  const response = await axios.delete(`${API_URL}/chat/conversations/${conversationId}`, getAuthConfig());
  return response.data;
};
