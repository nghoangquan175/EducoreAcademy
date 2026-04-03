import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on first load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Axios Response Interceptor for handling session / lock events
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        if (status === 401 && code === 'SESSION_EXPIRED') {
          logout();
          window.location.href = '/login?session_expired=1';
        } else if (status === 403 && code === 'ACCOUNT_LOCKED') {
          logout();
          window.location.href = `/login?account_locked=1&message=${encodeURIComponent(error.response?.data?.message || '')}`;
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Update document title based on user role
  useEffect(() => {
    if (!user || user.role === 'student') {
      document.title = "EDUCORE ACADEMY";
    } else if (user.role === 'instructor') {
      document.title = "EDUCORE INSTRUCTOR";
    } else if (user.role === 'admin') {
      document.title = "EDUCORE ADMIN";
    }
  }, [user]);

  const login = (userData) => {
    const { token: tkn, ...rest } = userData;
    setUser(rest);
    setToken(tkn);
    localStorage.setItem('token', tkn);
    localStorage.setItem('user', JSON.stringify(rest));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
