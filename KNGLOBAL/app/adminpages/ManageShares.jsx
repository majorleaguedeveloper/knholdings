import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Picker,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const ManageShares = () => {
  const [members, setMembers] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newShare, setNewShare] = useState({
    user: '',
    amountPaid: '',
    pricePerShare: 0,
    quantity: '',
    paymentMethod: 'paypal',
    notes: '',
  });
  const ratePerShare = 10; // Example rate per share

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const response = await axios.get('http://192.168.108.159:5000/api/admin/shares', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
        },
      });
      setShares(response.data.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setMembers([]);
      return;
    }

    try {
      const response = await axios.get(
        `http://192.168.108.159:5000/api/admin/members?search=${query}`,
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        }
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

  const calculateShares = (amountPaid) => {
    const quantity = (amountPaid / ratePerShare).toFixed(2); // Calculate shares
    setNewShare({ ...newShare, amountPaid, quantity });
  };

  const createSharePurchase = async () => {
    if (!newShare.user || !newShare.amountPaid || !newShare.paymentMethod) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    try {
      const shareData = {
        ...newShare,
        pricePerShare: ratePerShare, // Explicitly set pricePerShare
      };
  
      await axios.post(
        'http://192.168.108.159:5000/api/admin/shares',
        shareData,
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        }
      );
      Alert.alert('Success', 'Share purchase created');
      setNewShare({ user: '', amountPaid: '', quantity: '', paymentMethod: 'paypal', notes: '' });
      setSelectedUser(null);
      fetchShares();
    } catch (error) {
      console.error('Error creating share purchase:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create share purchase';
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Shares</Text>

      <FlatList
        data={shares}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.shareCard}>
            <Text style={styles.shareText}>Member: {item.user.name}</Text>
            <Text style={styles.shareText}>Quantity: {item.quantity}</Text>
            <Text style={styles.shareText}>Price Per Share: {item.pricePerShare}</Text>
            <Text style={styles.shareText}>Total Amount: {item.totalAmount}</Text>
            <Text style={styles.shareText}>Payment Method: {item.paymentMethod}</Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && <Text style={styles.noDataText}>No shares found</Text>
        }
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Search Member by Name or Email"
          value={searchQuery}
          onChangeText={searchMembers}
        />
        {members.length > 0 && (
          <FlatList
            data={members}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => selectUser(item)}
              >
                <Text>{item.name} ({item.email})</Text>
              </TouchableOpacity>
            )}
          />
        )}
        {selectedUser && (
          <Text style={styles.selectedUserText}>
            Selected User: {selectedUser.name} ({selectedUser.email})
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Amount Paid"
          value={newShare.amountPaid}
          keyboardType="numeric"
          onChangeText={calculateShares}
        />
        <Text style={styles.calculatedSharesText}>
          Shares: {newShare.quantity || 0}
        </Text>

        <Picker
          selectedValue={newShare.paymentMethod}
          style={styles.picker}
          onValueChange={(itemValue) =>
            setNewShare({ ...newShare, paymentMethod: itemValue })
          }
        >
          <Picker.Item label="PayPal" value="paypal" />
          <Picker.Item label="Bank Transfer" value="bank transfer" />
          <Picker.Item label="Skrill" value="skrill" />
          <Picker.Item label="Cash" value="cash" />
          <Picker.Item label="Other" value="other" />
        </Picker>

        <TextInput
          style={styles.input}
          placeholder="Notes (optional)"
          value={newShare.notes}
          onChangeText={(text) => setNewShare({ ...newShare, notes: text })}
        />

        <TouchableOpacity style={styles.button} onPress={createSharePurchase}>
          <FontAwesome name="plus" size={16} color="#fff" />
          <Text style={styles.buttonText}>Create Share Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  shareCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareText: {
    fontSize: 14,
    marginBottom: 5,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  form: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  memberItem: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
    borderRadius: 5,
  },
  selectedUserText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#007AFF',
  },
  calculatedSharesText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ManageShares;