import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image
} from 'react-native';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AuthContext from '../../contexts/Authcontext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { userData, logout, setUserData } = useContext(AuthContext);
  
  let [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  // Fix for data persistence
  useEffect(() => {
    const restoreUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData && (!userData || Object.keys(userData).length === 0)) {
          setUserData(JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error('Failed to restore user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreUserData();
  }, [userData, setUserData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await logout();
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      router.push('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const profileSections = [
    { 
      icon: <Feather name="mail" size={24} color="#4A55A2" />, 
      label: 'Email', 
      value: userData?.email || 'Not available' 
    },
    { 
      icon: <Feather name="phone" size={24} color="#4A55A2" />, 
      label: 'Phone', 
      value: userData?.phone || 'Not available' 
    },
    { 
      icon: <MaterialCommunityIcons name="shield-account" size={24} color="#4A55A2" />, 
      label: 'Role', 
      value: userData?.role || 'Not available' 
    }
  ];

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A55A2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            {userData?.name ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#ffffff" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userData?.name || 'User'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoContainer}>
            {profileSections.map((section, index) => (
              <View key={index} style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  {section.icon}
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{section.label}</Text>
                  <Text style={styles.infoValue}>{section.value}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 20,
    color: '#333333',
  },
  profileContainer: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginVertical: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A55A2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    color: '#ffffff',
  },
  userName: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#333333',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e1e1e1',
    width: '100%',
    marginVertical: 20,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#888888',
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#333333',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#F24968',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default Profile;