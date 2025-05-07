import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AuthContext from '../../contexts/Authcontext'; // Adjust the path if necessary
import { router } from 'expo-router';

const Profile = () => {
    const { userData, logout } = useContext(AuthContext);
  
    console.log('User Data in Profile:', userData);
  
    const handleLogout = async () => {
      try {
        await logout();
        Alert.alert('Logged Out', 'You have been logged out successfully.');
        router.push('/auth/login'); // Redirect to login page
      } catch (error) {
        Alert.alert('Error', 'Failed to log out. Please try again.');
      }
    };
  
    return (
      <View>
        <Text>Profile Page</Text>
        {userData ? (
          <View>
            <Text>Name: {userData.name}</Text>
            <Text>Email: {userData.email}</Text>
            <Text>Phone: {userData.phone}</Text>
            <Text>Role: {userData.role}</Text>
          </View>
        ) : (
          <Text>Loading user data...</Text>
        )}
  
        <TouchableOpacity onPress={handleLogout}>
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  };

export default Profile;