import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import AuthContext from '../../contexts/Authcontext';
import AdminDashboard from '../adminpages/AdminDashboard';
import MemberDashboard from '../memberpages/MemberDashboard';

const Dashboard = () => {
  const router = useRouter();
  const { isAuthenticated, userData, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        router.replace('/auth/login');
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, router]);

  // Show loading screen while fonts are loading or checking authentication
  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header with user info */}
      
      <ScrollView style={styles.contentContainer}>
        {/* Conditional rendering based on user role */}
        {userData?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <MemberDashboard />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  welcomeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#1a1a2e',
  },
  roleText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#4a4a68',
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 0,
  },
});

export default Dashboard;