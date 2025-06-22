import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import axios from 'axios';
import { 
  FontAwesome, 
  Ionicons, 
  MaterialIcons,
  AntDesign,
  Feather 
} from '@expo/vector-icons';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import AuthContext from '../../contexts/Authcontext';

const BASE_URL = 'https://knholdingsbackend.onrender.com';

const ManageMembers = () => {
  const { userToken } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  
  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'pending'
  });

  // Edit member form state
  const [editMember, setEditMember] = useState({
    name: '',
    email: '',
    phone: '',
    status: ''
  });

  // Load fonts
  let [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  useEffect(() => {
    fetchMembers();
    
    // Setting up a listener for when component is focused (comes back into view)
    const interval = setInterval(() => {
      fetchMembers();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchMembers = async () => {
    setError(null);
    if (!refreshing) setLoading(true);
    
    try {
      
      if (!userToken) {
        setError('Authentication token not found');
        return;
      }
      
      const response = await axios.get(`${BASE_URL}/api/admin/members`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      
      if (response.data && response.data.data) {
        setMembers(response.data.data);
      } else {
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError(error.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const updateMemberStatus = async (id, status) => {
    try {
      await axios.put(
        `${BASE_URL}/api/admin/members/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );
      
      // Update state locally for immediate UI update
      setMembers(members.map(member => 
        member._id === id ? {...member, status} : member
      ));
      
      Alert.alert(
        'Success', 
        `Member status updated to ${status}`, 
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error updating member status:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update member status',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  // Register new member
  const registerMember = async () => {
    // Validate form
    if (!newMember.name || !newMember.email || !newMember.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(newMember.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate password length
    if (newMember.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/admin/members`,
        newMember,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (response.data && response.data.success) {
        Alert.alert(
          'Success',
          'New member registered successfully',
          [{ 
            text: 'OK',
            onPress: () => {
              setRegisterModalVisible(false);
              fetchMembers();
              // Reset form
              setNewMember({
                name: '',
                email: '',
                phone: '',
                password: '',
                status: 'pending'
              });
            }
          }]
        );
      }
    } catch (error) {
      console.error('Error registering member:', error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Could not register new member'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Update member profile
  const updateMemberProfile = async () => {
    // Validate form
    if (!editMember.name || !editMember.email) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    // Validate email format
    const emailPattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailPattern.test(editMember.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.put(
        `${BASE_URL}/api/admin/members/${currentMember._id}`,
        editMember,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      if (response.data && response.data.success) {
        // Update local state
        setMembers(members.map(member => 
          member._id === currentMember._id ? {...member, ...editMember} : member
        ));
        
        Alert.alert(
          'Success',
          'Member profile updated successfully',
          [{ 
            text: 'OK',
            onPress: () => {
              setEditModalVisible(false);
            }
          }]
        );
      }
    } catch (error) {
      console.error('Error updating member profile:', error);
      Alert.alert(
        'Update Failed',
        error.response?.data?.message || 'Could not update member profile'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal for a member
  const openEditModal = (member) => {
    setCurrentMember(member);
    setEditMember({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      status: member.status
    });
    setEditModalVisible(true);
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'active':
        return '#34C759'; // Green
      case 'inactive':
        return '#FF3B30'; // Red
      case 'pending':
        return '#FF9500'; // Orange
      default:
        return '#8E8E93'; // Gray
    }
  };

  // Register New Member Modal
  const renderRegisterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={registerModalVisible}
      onRequestClose={() => setRegisterModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Member</Text>
              <TouchableOpacity 
                onPress={() => setRegisterModalVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={newMember.name}
                  onChangeText={(text) => setNewMember({...newMember, name: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newMember.email}
                  onChangeText={(text) => setNewMember({...newMember, email: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number (optional)"
                  keyboardType="phone-pad"
                  value={newMember.phone}
                  onChangeText={(text) => setNewMember({...newMember, phone: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password (min. 6 characters)"
                  secureTextEntry
                  value={newMember.password}
                  onChangeText={(text) => setNewMember({...newMember, password: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Initial Status</Text>
              <View style={styles.statusContainer}>
                {['pending', 'active', 'inactive'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newMember.status === status && {
                        backgroundColor: getStatusColor(status) + '30',
                        borderColor: getStatusColor(status),
                      },
                    ]}
                    onPress={() => setNewMember({...newMember, status: status})}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[
                      styles.statusText,
                      newMember.status === status && { color: getStatusColor(status) }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setRegisterModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={registerMember}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Register</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Edit Member Modal
  const renderEditModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={editModalVisible}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Member Profile</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={editMember.name}
                  onChangeText={(text) => setEditMember({...editMember, name: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editMember.email}
                  onChangeText={(text) => setEditMember({...editMember, email: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number (optional)"
                  keyboardType="phone-pad"
                  value={editMember.phone}
                  onChangeText={(text) => setEditMember({...editMember, phone: text})}
                />
              </View>

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.statusContainer}>
                {['pending', 'active', 'inactive'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editMember.status === status && {
                        backgroundColor: getStatusColor(status) + '30',
                        borderColor: getStatusColor(status),
                      },
                    ]}
                    onPress={() => setEditMember({...editMember, status: status})}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                    <Text style={[
                      styles.statusText,
                      editMember.status === status && { color: getStatusColor(status) }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={updateMemberProfile}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FB" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Member Management</Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => setRegisterModalVisible(true)}
        >
          <AntDesign name="adduser" size={18} color="#FFFFFF" />
          <Text style={styles.registerButtonText}>Register New Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMembers}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredMembers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.memberStatus, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEditModal(item)}
              >
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => updateMemberStatus(item._id, 'active')}
              >
                <FontAwesome name="check" size={16} color="#fff" />
                <Text style={styles.actionText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deactivateButton]}
                onPress={() => updateMemberStatus(item._id, 'inactive')}
              >
                <FontAwesome name="times" size={16} color="#fff" />
                <Text style={styles.actionText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading members...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#D1D1D6" />
              <Text style={styles.noDataText}>No members found</Text>
              <Text style={styles.noDataSubText}>
                {searchQuery ? 'Try a different search term' : 'Members will appear here once added'}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
        contentContainerStyle={
          filteredMembers.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
      />

      {renderRegisterModal()}
      {renderEditModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
    paddingBottom: 25,
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#1C1C1E',
  },
  refreshButton: {
    padding: 8,
  },
  actionBar: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  registerButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 4,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#1C1C1E',
  },
  memberEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  memberStatus: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 14,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 3,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  deactivateButton: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 12,
  },
  noDataSubText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEA',
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 4,
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
  },
  retryButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  retryText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#007AFF',
  },
loadingContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#1C1C1E',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  statusText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#8E8E93',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#8E8E93',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default ManageMembers;