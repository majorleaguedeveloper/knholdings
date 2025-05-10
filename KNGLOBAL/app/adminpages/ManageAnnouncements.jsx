import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { 
  FontAwesome, 
  MaterialIcons, 
  Ionicons 
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';

// Color theme
const COLORS = {
  primary: '#3498db',
  accent: '#2980b9',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f39c12',
  text: '#2c3e50',
  lightText: '#7f8c8d',
  background: '#f5f7fa',
  card: '#ffffff',
  border: '#e1e8ed',
  highlight: '#ebf5fb',
};

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    importance: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  // Fetch announcements when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
      return () => {}; // Cleanup function
    }, [])
  );

  // Initial load
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.get('http://192.168.176.253:5000/api/admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Save announcements to AsyncStorage for offline access
      await AsyncStorage.setItem('cachedAnnouncements', JSON.stringify(response.data.data));
      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      
      // Try to load cached data if network fetch fails
      try {
        const cachedData = await AsyncStorage.getItem('cachedAnnouncements');
        if (cachedData) {
          setAnnouncements(JSON.parse(cachedData));
          Alert.alert('Info', 'Showing cached announcements due to connection issues.');
        }
      } catch (cacheError) {
        console.error('Error loading cached announcements:', cacheError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const validateForm = () => {
    if (!newAnnouncement.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the announcement');
      return false;
    }
    if (!newAnnouncement.content.trim()) {
      Alert.alert('Error', 'Please enter content for the announcement');
      return false;
    }
    
    // Validate importance level
    const validImportanceLevels = ['low', 'medium', 'high'];
    if (!validImportanceLevels.includes(newAnnouncement.importance.toLowerCase())) {
      Alert.alert('Error', 'Importance must be low, medium, or high');
      return false;
    }
    
    return true;
  };

  const createAnnouncement = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await axios.post(
        'http://192.168.176.253:5000/api/admin/announcements',
        newAnnouncement,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      Alert.alert('Success', 'Announcement created successfully');
      setNewAnnouncement({ title: '', content: '', importance: 'medium' });
      setIsFormVisible(false);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const getImportanceColor = (importance) => {
    switch (importance.toLowerCase()) {
      case 'high':
        return COLORS.danger;
      case 'medium':
        return COLORS.warning;
      case 'low':
        return COLORS.success;
      default:
        return COLORS.lightText;
    }
  };

  const getImportanceIcon = (importance) => {
    switch (importance.toLowerCase()) {
      case 'high':
        return <Ionicons name="warning" size={16} color={getImportanceColor(importance)} />;
      case 'medium':
        return <Ionicons name="information-circle" size={16} color={getImportanceColor(importance)} />;
      case 'low':
        return <Ionicons name="checkmark-circle" size={16} color={getImportanceColor(importance)} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Manage Announcements</Text>
          
        </View>
        <View>
          <TouchableOpacity 
            style={styles.toggleFormButton}
            onPress={() => setIsFormVisible(!isFormVisible)}
          >
            <MaterialIcons 
              name={isFormVisible ? "expand-less" : "add"} 
              size={24} 
              color={COLORS.card} 
            />
            <Text style={styles.toggleFormButtonText}>
              {isFormVisible ? "Hide Form" : "Add New Announcement"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {isFormVisible && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Create New Announcement</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  placeholderTextColor={COLORS.lightText}
                  value={newAnnouncement.title}
                  onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Content"
                  placeholderTextColor={COLORS.lightText}
                  value={newAnnouncement.content}
                  onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, content: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.importanceSelector}>
                  <Text style={styles.importanceLabel}>Importance:</Text>
                  <View style={styles.importanceButtons}>
                    {['low', 'medium', 'high'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.importanceButton,
                          {
                            backgroundColor:
                              newAnnouncement.importance === level
                                ? getImportanceColor(level)
                                : COLORS.card,
                          },
                        ]}
                        onPress={() =>
                          setNewAnnouncement({ ...newAnnouncement, importance: level })
                        }
                      >
                        <Text
                          style={[
                            styles.importanceButtonText,
                            {
                              color:
                                newAnnouncement.importance === level
                                  ? COLORS.card
                                  : getImportanceColor(level),
                            },
                          ]}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setNewAnnouncement({ title: '', content: '', importance: 'medium' });
                      setIsFormVisible(false);
                    }}
                  >
                    <MaterialIcons name="cancel" size={18} color={COLORS.card} />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={createAnnouncement}
                  >
                    <MaterialIcons name="check" size={18} color={COLORS.card} />
                    <Text style={styles.buttonText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <FlatList
              data={announcements}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.announcementCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.announcementTitle}>{item.title}</Text>
                    <View style={[
                      styles.importanceBadge, 
                      {backgroundColor: getImportanceColor(item.importance)}
                    ]}>
                      {getImportanceIcon(item.importance)}
                      <Text style={styles.importanceBadgeText}>
                        {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.announcementContent}>{item.content}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.timestamp}>
                      <MaterialIcons name="access-time" size={14} color={COLORS.lightText} />
                      {` ${item.createdAt ? formatDate(item.createdAt) : 'Unknown date'}`}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.listContent}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="announcement" size={60} color={COLORS.lightText} />
                  <Text style={styles.noDataText}>No announcements available</Text>
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                  >
                    <MaterialIcons name="refresh" size={16} color={COLORS.card} />
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: COLORS.text,
  },
  toggleFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 15,
    justifyContent: 'center'
  },
  toggleFormButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.card,
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.text,
  },
  textArea: {
    height: 100,
  },
  importanceSelector: {
    marginBottom: 16,
  },
  importanceLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  importanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importanceButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  importanceButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: COLORS.lightText,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.card,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Extra space at bottom
  },
  announcementCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  importanceBadgeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: COLORS.card,
    marginLeft: 4,
  },
  announcementContent: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
  },
  timestamp: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: COLORS.lightText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noDataText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: COLORS.lightText,
    textAlign: 'center',
    marginTop: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  refreshButtonText: {
    fontFamily: 'Outfit_500Medium',
    color: COLORS.card,
    marginLeft: 6,
  },
});

export default ManageAnnouncements;