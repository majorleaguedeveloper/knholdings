import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  SafeAreaView,
  Modal,
} from 'react-native';
import axios from 'axios';
import { 
  FontAwesome, 
  MaterialIcons, 
  Ionicons 
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import AuthContext from '../../contexts/Authcontext';

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

import { API_BASE_URL } from '../apiConfig';
const API_URL = `${API_BASE_URL}/admin`;

const ManageAnnouncements = () => {
  const { userToken } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    importance: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

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
      
      if (!userToken) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }
      
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
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
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the announcement');
      return false;
    }
    if (!formData.content.trim()) {
      Alert.alert('Error', 'Please enter content for the announcement');
      return false;
    }
    
    // Validate importance level
    const validImportanceLevels = ['low', 'medium', 'high'];
    if (!validImportanceLevels.includes(formData.importance.toLowerCase())) {
      Alert.alert('Error', 'Importance must be low, medium, or high');
      return false;
    }
    
    return true;
  };

  const createAnnouncement = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_URL}/announcements`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      
      Alert.alert('Success', 'Announcement created successfully');
      resetForm();
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const editAnnouncement = async () => {
    if (!validateForm() || !currentAnnouncementId) return;

    try {
      setLoading(true);
      
      const response = await axios.put(
        `${API_URL}/announcements/${currentAnnouncementId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      
      Alert.alert('Success', 'Announcement updated successfully');
      resetForm();
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async () => {
    try {
      setLoading(true);
      
      const response = await axios.delete(
        `${API_URL}/announcements/${announcementToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      
      Alert.alert('Success', 'Announcement deleted successfully');
      setIsDeleteModalVisible(false);
      setAnnouncementToDelete(null);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      importance: announcement.importance
    });
    setCurrentAnnouncementId(announcement._id);
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = (announcementId) => {
    setAnnouncementToDelete(announcementId);
    setIsDeleteModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', importance: 'medium' });
    setIsFormVisible(false);
    setIsEditMode(false);
    setCurrentAnnouncementId(null);
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
            onPress={() => {
              if (isFormVisible && isEditMode) {
                resetForm();
              } else {
                setIsFormVisible(!isFormVisible);
              }
            }}
          >
            <MaterialIcons 
              name={isFormVisible ? "expand-less" : "add"} 
              size={24} 
              color={COLORS.card} 
            />
            <Text style={styles.toggleFormButtonText}>
              {isFormVisible 
                ? (isEditMode ? "Cancel Edit" : "Hide Form") 
                : "Add New Announcement"}
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
                <Text style={styles.formTitle}>
                  {isEditMode ? 'Edit Announcement' : 'Create New Announcement'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  placeholderTextColor={COLORS.lightText}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Content"
                  placeholderTextColor={COLORS.lightText}
                  value={formData.content}
                  onChangeText={(text) => setFormData({ ...formData, content: text })}
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
                              formData.importance === level
                                ? getImportanceColor(level)
                                : COLORS.card,
                          },
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, importance: level })
                        }
                      >
                        <Text
                          style={[
                            styles.importanceButtonText,
                            {
                              color:
                                formData.importance === level
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
                    onPress={resetForm}
                  >
                    <MaterialIcons name="cancel" size={18} color={COLORS.card} />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={isEditMode ? editAnnouncement : createAnnouncement}
                  >
                    <MaterialIcons 
                      name={isEditMode ? "save" : "check"} 
                      size={18} 
                      color={COLORS.card} 
                    />
                    <Text style={styles.buttonText}>
                      {isEditMode ? 'Update' : 'Submit'}
                    </Text>
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
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEdit(item)}
                      >
                        <MaterialIcons name="edit" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDelete(item._id)}
                      >
                        <MaterialIcons name="delete" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
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

        {/* Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isDeleteModalVisible}
          onRequestClose={() => {
            setIsDeleteModalVisible(false);
            setAnnouncementToDelete(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <MaterialIcons name="warning" size={40} color={COLORS.warning} />
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsDeleteModalVisible(false);
                    setAnnouncementToDelete(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={deleteAnnouncement}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingTop: 40,
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flex: 1,
    textAlign: 'center',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
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
    justifyContent: 'center',
    marginVertical: 10,
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
  deleteButton: {
    backgroundColor: COLORS.danger,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 10,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  modalText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ManageAnnouncements;