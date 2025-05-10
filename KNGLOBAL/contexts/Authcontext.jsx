import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = 'https://knholdingsbackend.onrender.com';

  // Load token from storage on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        
        console.log('Token:', token);
        console.log('User Data:', userDataStr);
  
        if (token) {
          setUserToken(token);
          if (userDataStr) {
            setUserData(JSON.parse(userDataStr));
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.log('Error loading auth info:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadToken();
  }, []);

  // Register user
  const register = async (name, email, phone, password) => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
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
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data; 
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUserToken(token);
      setUserData(user);
      
      return response.data;
      console.log('Login successful:', response.data);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      router.push('/(tabs)/dashboard');
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);
    try {
      // Remove token and user data from storage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // Remove axios default header
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
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUserData(response.data.data);
      return response.data;
    } catch (error) {
      console.log('Error fetching user profile:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
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