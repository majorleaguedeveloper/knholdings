import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { 
  FontAwesome, 
  MaterialIcons, 
  Ionicons,
  AntDesign,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AuthContext from '../../contexts/Authcontext';

const API_BASE_URL = 'http://192.168.151.253:5000/api';

const ManageShares = () => {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });
  const { userToken } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [defaultRate, setDefaultRate] = useState(10); // Default rate per share
  
  const [newShare, setNewShare] = useState({
    user: '',
    amountPaid: '',
    pricePerShare: '10', // Default price
    quantity: '',
    paymentMethod: 'paypal',
    notes: '',
    purchaseDate: new Date(), // Default to current date
  });

  const fetchShares = useCallback(async () => {
    try {
      if (!userToken) {
        Alert.alert('Session Error', 'Please log in again');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/admin/shares`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      
      setShares(response.data.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load shares';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShares();
  }, [fetchShares]);

  const searchMembers = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setMembers([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/members?search=${query}`,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setMembers(response.data.data);
    } catch (error) {
      console.error('Error searching members:', error);
    }
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setNewShare({ ...newShare, user: user._id });
    setSearchQuery('');
    setMembers([]);
  };

  // Handle date picker changes
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || newShare.purchaseDate;
    setShowDatePicker(Platform.OS === 'ios');
    setNewShare({ ...newShare, purchaseDate: currentDate });
  };

  const calculateShares = (amountPaid) => {
    if (!amountPaid || isNaN(parseFloat(amountPaid))) {
      setNewShare({ ...newShare, amountPaid, quantity: '0' });
      return;
    }
    
    const pricePerShare = parseFloat(newShare.pricePerShare) || defaultRate;
    const quantity = (parseFloat(amountPaid) / pricePerShare).toFixed(2);
    setNewShare({ ...newShare, amountPaid, quantity });
  };

  // Update quantity when price changes
  const handlePriceChange = (price) => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setNewShare({ ...newShare, pricePerShare: price, quantity: '0' });
      return;
    }
    
    const pricePerShare = parseFloat(price);
    let quantity = '0';
    
    if (newShare.amountPaid && !isNaN(parseFloat(newShare.amountPaid))) {
      quantity = (parseFloat(newShare.amountPaid) / pricePerShare).toFixed(2);
    }
    
    setNewShare({ ...newShare, pricePerShare: price, quantity });
  };

  const createSharePurchase = async () => {
    if (!newShare.user || !newShare.amountPaid || !newShare.paymentMethod || !newShare.pricePerShare) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    if (parseFloat(newShare.pricePerShare) <= 0) {
      Alert.alert('Invalid Price', 'Price per share must be greater than zero');
      return;
    }
  
    try {
      const shareData = {
        ...newShare,
        pricePerShare: parseFloat(newShare.pricePerShare),
        amountPaid: parseFloat(newShare.amountPaid),
        quantity: parseFloat(newShare.quantity),
        // Convert date to ISO string for API
        purchaseDate: newShare.purchaseDate.toISOString()
      };
  
      await axios.post(
        `${API_BASE_URL}/admin/shares`,
        shareData,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      
      Alert.alert('Success', 'Share purchase recorded successfully');
      setNewShare({ 
        user: '', 
        amountPaid: '', 
        quantity: '', 
        pricePerShare: '10', 
        paymentMethod: 'paypal', 
        notes: '',
        purchaseDate: new Date()
      });
      setSelectedUser(null);
      fetchShares();
      router.replace('/(admintabs)/admindashboard');
    } catch (error) {
      console.error('Error creating share purchase:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create share purchase';
      Alert.alert('Error', errorMessage);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Display loading until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Manage Shares</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#3498db" />
          </TouchableOpacity>
        </View>

        <View style={styles.sharesList}>
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <FlatList
              data={shares}
              keyExtractor={(item) => item._id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              renderItem={({ item }) => (
                <View style={styles.shareCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.memberName}>{item.user.name}</Text>
                      <Text style={styles.memberEmail}>{item.user.email}</Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      <Text style={styles.cardDate}>
                        {formatDate(item.purchaseDate || item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardDivider} />
                  
                  <View style={styles.shareDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shares:</Text>
                      <Text style={styles.detailValue}>{parseFloat(item.quantity).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price/Share:</Text>
                      <Text style={styles.detailValue}>${parseFloat(item.pricePerShare).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Amount:</Text>
                      <Text style={styles.detailHighlight}>${parseFloat(item.totalAmount || item.amountPaid).toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Method:</Text>
                      <View style={styles.paymentMethodTag}>
                        <Text style={styles.paymentMethodText}>
                          {item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    {item.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notesText}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No shares found</Text>
                  <Text style={styles.emptySubText}>
                    Add new shares using the form below
                  </Text>
                </View>
              }
            />
          )}
        </View>

        <ScrollView
          style={[styles.formContainer, { flex: 1 }]}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.formTitle}>Add New Share Purchase</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Select Member</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#A0A0A0"
                value={searchQuery}
                onChangeText={searchMembers}
              />
              <MaterialIcons name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
            </View>
            
            {members.length > 0 && (
              <View style={styles.membersList}>
                {members.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.memberItem}
                    onPress={() => selectUser(item)}
                  >
                    <AntDesign name="user" size={16} color="#3498db" style={styles.memberIcon} />
                    <View>
                      <Text style={styles.memberItemName}>{item.name}</Text>
                      <Text style={styles.memberItemEmail}>{item.email}</Text>
                    </View>
                    <AntDesign name="right" size={14} color="#A0A0A0" style={styles.rightIcon} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {selectedUser && (
              <View style={styles.selectedUser}>
                <AntDesign name="checkcircle" size={18} color="#27ae60" style={styles.selectedIcon} />
                <View>
                  <Text style={styles.selectedUserName}>{selectedUser.name}</Text>
                  <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.clearSelection}
                  onPress={() => {
                    setSelectedUser(null);
                    setNewShare({ ...newShare, user: '' });
                  }}
                >
                  <AntDesign name="close" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* New Date Picker Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Purchase Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {newShare.purchaseDate.toLocaleDateString()}
              </Text>
              <MaterialCommunityIcons name="calendar-month" size={22} color="#3498db" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={newShare.purchaseDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
          
          {/* Price Per Share Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Price Per Share</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.amountInput}
                placeholder="10.00"
                placeholderTextColor="#A0A0A0"
                value={newShare.pricePerShare}
                keyboardType="numeric"
                onChangeText={handlePriceChange}
              />
              <Text style={styles.currencySymbol}>$</Text>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Amount Paid</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#A0A0A0"
                value={newShare.amountPaid}
                keyboardType="numeric"
                onChangeText={calculateShares}
              />
              <Text style={styles.currencySymbol}>$</Text>
            </View>
            
            <View style={styles.calculatedShares}>
              <Text style={styles.calculatedSharesLabel}>Shares to be purchased:</Text>
              <Text style={styles.calculatedSharesValue}>
                {parseFloat(newShare.quantity || 0).toFixed(2)}
              </Text>
              <Text style={styles.sharesRate}>
                (Rate: ${parseFloat(newShare.pricePerShare || defaultRate).toFixed(2)}/share)
              </Text>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newShare.paymentMethod}
                style={styles.picker}
                dropdownIconColor="#3498db"
                onValueChange={(itemValue) =>
                  setNewShare({ ...newShare, paymentMethod: itemValue })
                }
              >
                <Picker.Item label="PayPal" value="paypal" />
                <Picker.Item label="Bank Transfer" value="bank transfer" />
                <Picker.Item label="Skrill" value="skrill" />
                <Picker.Item label="Cash" value="cash" />
                <Picker.Item label="Check" value="check" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any additional information..."
              placeholderTextColor="#A0A0A0"
              value={newShare.notes}
              onChangeText={(text) => setNewShare({ ...newShare, notes: text })}
              multiline={true}
              numberOfLines={3}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (!selectedUser || !newShare.amountPaid || parseFloat(newShare.pricePerShare) <= 0) && 
                styles.submitButtonDisabled
            ]} 
            onPress={createSharePurchase}
            disabled={!selectedUser || !newShare.amountPaid || parseFloat(newShare.pricePerShare) <= 0}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
            <Text style={styles.submitButtonText}>Create Share Purchase</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const COLORS = {
  primary: '#3498db',
  secondary: '#2ecc71',
  accent: '#f39c12',
  background: '#f8f9fa',
  cardBg: '#ffffff',
  text: '#2c3e50',
  textLight: '#7f8c8d',
  border: '#e0e0e0',
  danger: '#e74c3c',
  success: '#27ae60',
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 8,
  },
  sharesList: {
    flex: 1,
    padding: 15,
  },
  shareCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
  },
  cardHeaderRight: {},
  cardDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  shareDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.text,
  },
  detailHighlight: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: COLORS.primary,
  },
  paymentMethodTag: {
    backgroundColor: COLORS.primary + '20', // 20% opacity
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paymentMethodText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.primary,
  },
  notesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.textLight,
    marginBottom: 3,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.textLight,
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: COLORS.cardBg,
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: COLORS.text,
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.text,
    marginBottom: 6,
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    paddingRight: 40,
    borderRadius: 8,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
  },
  membersList: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberIcon: {
    marginRight: 10,
  },
  memberItemName: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.text,
  },
  memberItemEmail: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15', // 15% opacity
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedIcon: {
    marginRight: 10,
  },
  selectedUserName: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.text,
  },
  selectedUserEmail: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
  },
  clearSelection: {
    marginLeft: 'auto',
    padding: 5,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: COLORS.textLight,
  },
  calculatedShares: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  calculatedSharesLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.text,
    marginRight: 5,
  },
  calculatedSharesValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: COLORS.primary,
    marginRight: 5,
  },
  sharesRate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: COLORS.textLight,
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: COLORS.text,
    backgroundColor: 'transparent',
  },
  notesInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primary + '80', // 80% opacity
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  // New styles for date picker
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  dateText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: COLORS.text,
  },
});

export default ManageShares;