import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

axios.defaults.withCredentials = true;

// Add global request interceptor
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add global response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  }
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Initial token:', token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Set authorization header:', axios.defaults.headers.common['Authorization']);
      fetchUserProfile();
    } else {
      console.log('No token found');
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await axios.get(`${API_URL}/users/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Profile error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/users/login/`, {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      const { access, refresh, user } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refresh_token', refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error.response?.data || { error: 'An error occurred during login' };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Sending registration data:', userData);
      
      const response = await axios.post(`${API_URL}/users/`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data) {
        // If registration is successful, automatically log in
        await login(userData.email, userData.password);
        return response.data;
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        // Pass backend validation errors to the component
        throw error.response.data;
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const updateProfile = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      console.log('Updating profile with:', userData);

      const response = await axios.patch(
        `${API_URL}/users/profile/`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.data) {
        // Update the user state with the new data
        const updatedUser = response.data;
        setUser(updatedUser);
        return updatedUser;
      } else {
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to update profile' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    setUser,
    updateUser,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 