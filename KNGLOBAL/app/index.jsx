import React, { useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AuthContext from '../contexts/Authcontext'; // Adjust the path if necessary

const Index = () => {
  const router = useRouter();
  const { isAuthenticated, userData } = useContext(AuthContext);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Check authentication status and redirect if needed
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (isAuthenticated() && userData) {
        // Redirect based on user role
        if (userData.role === 'admin') {
          router.replace('/adminpages/AdminDashboard');
        } else {
          router.replace('/memberpages/MemberDashboard');
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [isAuthenticated, userData]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
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
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={['#4CD964', '#5AC8FA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.registerButtonGradient}
        >
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Create an Account</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 KN Holdings. All rights reserved.</Text>
      </View>
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
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  contentContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#4a4a68',
    textAlign: 'center',
    marginBottom: 40,
  },
  featureContainer: {
    width: '100%',
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#1a1a2e',
    flex: 1,
  },
  featureText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#4a4a68',
    flex: 2,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginTop: 'auto',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    color: '#007AFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
  },
  registerButtonGradient: {
    borderRadius: 10,
    marginBottom: 16,
  },
  registerButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default Index;