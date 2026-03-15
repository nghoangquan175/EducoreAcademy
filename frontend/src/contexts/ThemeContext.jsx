import React, { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
