import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const fetchArticlesAPI = async (status = 2, page = 1, limit = 8, category = '') => {
  try {
    const params = { status, page, limit };
    if (category && category !== 'Tất cả') params.category = category;
    
    const response = await axios.get(`${API_URL}/articles`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
};

export const fetchArticleByIdAPI = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/articles/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching article by ID:', error);
    throw error;
  }
};

export const fetchMyArticlesAPI = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await axios.get(`${API_URL}/articles/instructor/my-articles`, {
      params: { page, limit, search },
      ...getAuthConfig()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my articles:', error);
    throw error;
  }
};

export const createArticleAPI = async (articleData) => {
  try {
    const response = await axios.post(`${API_URL}/articles/instructor`, articleData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

export const updateArticleAPI = async (id, articleData) => {
  try {
    const response = await axios.put(`${API_URL}/articles/instructor/${id}`, articleData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error updating article:', error);
    throw error;
  }
};

export const deleteArticleAPI = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/articles/instructor/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
};

export const submitArticleForReviewAPI = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/articles/instructor/${id}/submit`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error submitting article:', error);
    throw error;
  }
};

export const adminFetchPendingArticlesAPI = async (search = '') => {
  try {
    const response = await axios.get(`${API_URL}/admin/articles/pending`, {
      params: { search },
      ...getAuthConfig()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending articles:', error);
    throw error;
  }
};

export const adminFetchAllArticlesAPI = async (search = '') => {
  try {
    const response = await axios.get(`${API_URL}/admin/articles/all`, {
      params: { search },
      ...getAuthConfig()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all articles:', error);
    throw error;
  }
};

export const adminUpdateArticleStatusAPI = async (id, status) => {
  try {
    const response = await axios.patch(`${API_URL}/admin/articles/${id}/status`, { status }, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error updating article status:', error);
    throw error;
  }
};

// Student APIs
export const fetchStudentProStatusAPI = async () => {
  try {
    const response = await axios.get(`${API_URL}/articles/student/pro-status`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching student PRO status:', error);
    throw error;
  }
};

export const fetchMyArticlesStudentAPI = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await axios.get(`${API_URL}/articles/student/my-articles`, {
      params: { page, limit, search },
      ...getAuthConfig()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student articles:', error);
    throw error;
  }
};

export const createArticleStudentAPI = async (articleData) => {
  try {
    const response = await axios.post(`${API_URL}/articles/student`, articleData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error creating student article:', error);
    throw error;
  }
};

export const updateArticleStudentAPI = async (id, articleData) => {
  try {
    const response = await axios.put(`${API_URL}/articles/student/${id}`, articleData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error updating student article:', error);
    throw error;
  }
};

export const deleteArticleStudentAPI = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/articles/student/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error deleting student article:', error);
    throw error;
  }
};

export const submitArticleForReviewStudentAPI = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/articles/student/${id}/submit`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error submitting student article:', error);
    throw error;
  }
};

export const undoSubmitArticleStudentAPI = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/articles/student/${id}/undo-submit`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error undoing student article submission:', error);
    throw error;
  }
};
export const uploadArticleImageAPI = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/upload/image`, formData, {
      headers: {
        ...getAuthConfig().headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const fetchTrashArticlesAPI = async () => {
  try {
    const response = await axios.get(`${API_URL}/articles/trash`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching trash articles:', error);
    throw error;
  }
};

export const restoreArticleAPI = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/articles/${id}/restore`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error restoring article:', error);
    throw error;
  }
};

export const forceDeleteArticleAPI = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/articles/${id}/force`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error force deleting article:', error);
    throw error;
  }
};
 
export const fetchCommentsAPI = async (articleId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/articles/${articleId}/comments`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};
 
export const addCommentAPI = async (articleId, commentData) => {
  try {
    const response = await axios.post(`${API_URL}/articles/${articleId}/comments`, commentData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};
 
export const deleteCommentAPI = async (commentId) => {
  try {
    const response = await axios.delete(`${API_URL}/articles/comments/${commentId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

