import React, { createContext, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../app/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Register user
  const register = async (name, email, phone, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        phone,
        password
      });
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      const { token, user } = response.data;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUserToken(token);
      setUserData(user);
      router.push('/(tabs)/dashboard');
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setIsLoading(true);
    try {
      delete axios.defaults.headers.common['Authorization'];
      setUserToken(null);
      setUserData(null);
    } catch (error) {
      console.log('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!userToken;
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      setUserData(response.data.data);
      return response.data;
    } catch (error) {
      console.log('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userData,
        error,
        register,
        login,
        logout,
        isAuthenticated,
        getUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;