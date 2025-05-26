import React, { useEffect, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../contexts/Authcontext';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

const Index = () => {
  const router = useRouter();
  const { isAuthenticated, userData, isInitialized, isLoading } = useContext(AuthContext);
  const [appIsReady, setAppIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

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
        // Wait for fonts to load
        if (fontsLoaded) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded]);

  useEffect(() => {
    // Hide splash screen once app is ready and auth is initialized
    async function hideSplash() {
      if (appIsReady && isInitialized) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
        }
      }
    }
    
    hideSplash();
  }, [appIsReady, isInitialized]);

  // Handle authentication-based navigation
  useEffect(() => {
    const handleAuthNavigation = async () => {
      // Only proceed if auth is initialized, app is ready, and we haven't navigated yet
      if (!isInitialized || !appIsReady || hasNavigated || isLoading) {
        return;
      }

      try {
        if (isAuthenticated() && userData) {
          console.log('User authenticated, redirecting...', userData.role);
          setHasNavigated(true);
          
          if (userData.role === 'admin') {
            await router.replace('/(admintabs)/admindashboard');
          } else if (userData.role === 'member') {
            await router.replace('/(tabs)/memberdashboard');
          } else {
            console.warn('Unknown user role:', userData.role);
            // Default fallback
            await router.replace('/(tabs)/memberdashboard');
          }
        } else {
          console.log('User not authenticated, staying on landing page');
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    };

    handleAuthNavigation();
  }, [isInitialized, appIsReady, isAuthenticated, userData, hasNavigated, isLoading, router]);

  // Show loading screen while initializing
  if (!appIsReady || !isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Don't render the landing page if user is authenticated (prevents flash)
  if (isAuthenticated() && userData && !hasNavigated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Redirecting...</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Outfit_400Regular',
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