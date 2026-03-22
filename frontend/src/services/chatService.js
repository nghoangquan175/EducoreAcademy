import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (token) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  return {};
};

export const sendMessageAPI = async (message, conversationId = null) => {
  const response = await axios.post(`${API_URL}/chat/send`, 
    { message, conversationId },
    getAuthConfig()
  );
  return response.data;
};

export const getConversationsAPI = async () => {
  const response = await axios.get(`${API_URL}/chat/conversations`, getAuthConfig());
  return response.data;
};

export const getMessagesAPI = async (conversationId) => {
  const response = await axios.get(`${API_URL}/chat/conversations/${conversationId}`, getAuthConfig());
  return response.data;
};

export const deleteConversationAPI = async (conversationId) => {
  const response = await axios.delete(`${API_URL}/chat/conversations/${conversationId}`, getAuthConfig());
  return response.data;
};
