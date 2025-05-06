import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const ManageShares = () => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newShare, setNewShare] = useState({
    user: '',
    quantity: '',
    pricePerShare: '',
    paymentMethod: '',
  });

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const response = await axios.get('http://192.168.186.159:5000/api/admin/shares', {
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

  const createSharePurchase = async () => {
    if (!newShare.user || !newShare.quantity || !newShare.pricePerShare || !newShare.paymentMethod) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await axios.post(
        'http://192.168.186.159:5000/api/admin/shares',
        newShare,
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        }
      );
      Alert.alert('Success', 'Share purchase created');
      setNewShare({ user: '', quantity: '', pricePerShare: '', paymentMethod: '' });
      fetchShares();
    } catch (error) {
      console.error('Error creating share purchase:', error);
      Alert.alert('Error', 'Failed to create share purchase');
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
          placeholder="Member ID"
          value={newShare.user}
          onChangeText={(text) => setNewShare({ ...newShare, user: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={newShare.quantity}
          onChangeText={(text) => setNewShare({ ...newShare, quantity: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Price Per Share"
          value={newShare.pricePerShare}
          onChangeText={(text) => setNewShare({ ...newShare, pricePerShare: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Payment Method"
          value={newShare.paymentMethod}
          onChangeText={(text) => setNewShare({ ...newShare, paymentMethod: text })}
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