import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';

const CACHE_KEY = 'user_profile_data';

const UpdateProfile = () => {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  // Load the Outfit fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  useEffect(() => {
    // Try to get cached data first for immediate display
    const loadCachedData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setFormData(parsedData);
        }
      } catch (error) {
        console.error('Error loading cached profile data:', error);
      }
    };

    loadCachedData();
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const response = await axios.get('https://knholdingsbackend.onrender.com/api/member/profile', config);
      
      if (response.data.success) {
        const { name, phone } = response.data.data;
        const profileData = {
          name: name || '',
          phone: phone || ''
        };
        
        setFormData(profileData);
        
        // Cache the data for offline access or quick loading
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(profileData));
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert(
        'Error',
        'Unable to load profile data. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Phone validation is optional based on your requirements
    if (formData.phone && !/^\d{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setUpdating(true);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const response = await axios.put(
        'https://knholdingsbackend.onrender.com/api/member/profile',
        formData,
        config
      );
      
      if (response.data.success) {
        // Update the cached data
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(formData));
        
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Unable to update profile. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state for both API data loading and font loading
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5046e5" />
        <Text style={[styles.loadingText, fontsLoaded && {fontFamily: 'Outfit_500Medium'}]}>
          Loading profile data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <StatusBar style="dark" />
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View style={styles.profileIconContainer}>
              <FontAwesome name="user-circle" size={80} color="#3498db" />
            </View>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Update Profile</Text>
              <Text style={styles.headerSubtitle}>Edit your personal information</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <MaterialIcons name="person" size={18} color="#5046e5" style={styles.inputIcon} />
                {' '}Full Name
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
                placeholderTextColor="#9ca3af"
              />
              {errors.name && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={14} color="#ef4444" /> {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <MaterialIcons name="phone" size={18} color="#5046e5" style={styles.inputIcon} />
                {' '}Phone Number
              </Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
              {errors.phone && (
                <Text style={styles.errorText}>
                  <Ionicons name="alert-circle" size={14} color="#ef4444" /> {errors.phone}
                </Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Ionicons name="close-outline" size={18} color="#4b5563" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.updateButton}
                onPress={handleSubmit}
                disabled={updating}
                activeOpacity={0.7}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#ffffff" />
                    <Text style={styles.updateButtonText}>Update Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4b5563',
    fontFamily: 'Outfit_500Medium',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
    position: 'relative',
  },
  profileIconContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 6,
    fontFamily: 'Outfit_400Regular',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  updateButton: {
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    shadowColor: '#5046e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flex: 1,
    marginRight: 10,
    flexDirection: 'row',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 8,
  },
});

export default UpdateProfile;