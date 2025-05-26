import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../app/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Start with true
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load stored auth data on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUserToken(storedToken);
        setUserData(parsedUserData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid
        try {
          await axios.get(`${API_BASE_URL}/auth/me`);
        } catch (error) {
          // Token invalid, clear stored data
          await clearStoredAuth();
        }
      }
    } catch (error) {
      console.log('Error loading stored auth:', error);
      await clearStoredAuth();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const clearStoredAuth = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      setUserToken(null);
      setUserData(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.log('Error clearing stored auth:', error);
    }
  };

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
      
      // Store auth data
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUserToken(token);
      setUserData(user);
      
      // Navigate based on role
      if (user.role === 'admin') {
        router.replace('/(admintabs)/admindashboard');
      } else {
        router.replace('/(tabs)/memberdashboard');
      }
      
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);
    try {
      await clearStoredAuth();
      router.replace('/');
    } catch (error) {
      console.log('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!userToken && !!userData;
  };

  // Get user profile
  const getUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      const updatedUserData = response.data.data;
      setUserData(updatedUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      return response.data;
    } catch (error) {
      console.log('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        await logout();
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
        isInitialized,
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