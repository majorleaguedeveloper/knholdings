import React, { useEffect, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../contexts/Authcontext'; // Adjust the path if necessary
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

const Index = () => {
  const router = useRouter();
  const { isAuthenticated, userData } = useContext(AuthContext);
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState(null);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        // Wait for fonts to load
        await new Promise(resolve => {
          if (fontsLoaded) {
            resolve();
          }
        });
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded]);

  useEffect(() => {
    // Hide splash screen once app is ready
    async function hideSplash() {
      if (appIsReady) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    }
    
    hideSplash();
  }, [appIsReady]);

  // Check authentication status and redirect if needed
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        console.log('Auth check:', { isAuthenticated, userData });
        if (isAuthenticated && userData) {
          // Check user role and redirect accordingly
          if (userData.role === 'admin') {
            console.log('Redirecting to admin dashboard');
            await router.replace('/(admintabs)/admindashboard');
          } else if (userData.role === 'member') {
            console.log('Redirecting to member dashboard');
            await router.replace('/(tabs)/memberdashboard');
          } else {
            console.warn('Unknown user role:', userData.role);
            // Optionally, redirect to a default dashboard or show an error
            await router.replace('/(tabs)/admindashboard');
          }
        } else {
          console.log('User not authenticated or userData not available');
        }
      } catch (e) {
        console.error('Navigation error:', e);
        setError('Navigation error: ' + e.message);
      }
    };
    
    if (appIsReady) {
      checkAuthAndRedirect();
    }
  }, [appIsReady, isAuthenticated, userData, router]);

  // Show loading indicator while fonts are loading
  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show error if navigation fails
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradientBackground}
      >
        <View style={styles.headerContainer}>
          <Image 
            source={require('../assets/images/react-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>KN Holdings</Text>
          <Text style={styles.subtitle}>Your trusted partner in financial growth</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/auth/login')}
          >
            <LinearGradient
              colors={['#4CD964', '#5AC8FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>Login to Account</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 KN Holdings. All rights reserved.</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  headerContainer: {
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 40,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  footerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default Index;