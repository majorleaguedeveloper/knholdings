import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AuthContext from '../../contexts/Authcontext'; // Adjust the import path as necessary
import { useRouter } from 'expo-router';

const LoginScreen = () => {
    const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error } = useContext(AuthContext);

  const handleLogin = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      // Navigation will be handled by the app's navigation container
      // based on authentication state in AuthContext
    } catch (error) {
      console.log('Login error:', error);
      
      // Handle specific error messages
      if (error.response?.data?.message === 'Your account is not active. Please contact the administrator.') {
        Alert.alert(
          'Account Not Active', 
          'Your account is pending approval. Please contact the administrator.'
        );
      } else {
        Alert.alert('Login Failed', error.response?.data?.message || 'Please check your credentials and try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      <View>
        <Text>Login to Your Account</Text>
        
        <View>
          <Text>Email Address</Text>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View>
          <Text>Password</Text>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity 
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Text>Login</Text>
          )}
        </TouchableOpacity>
        
        <View>
          <Text>Do not have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text>Register</Text>
          </TouchableOpacity>
        </View>
        
        {error && (
          <View>
            <Text>{error}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;