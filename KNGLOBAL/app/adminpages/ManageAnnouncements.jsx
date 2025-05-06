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
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    importance: 'medium',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get('http://192.168.46.159:5000/api/admin/announcements', {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
        },
      });
      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await axios.post(
        'http://192.168.46.159:5000/api/admin/announcements',
        newAnnouncement,
        {
          headers: {
            Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        }
      );
      Alert.alert('Success', 'Announcement created');
      setNewAnnouncement({ title: '', content: '', importance: 'medium' });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Announcements</Text>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.announcementCard}>
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementContent}>{item.content}</Text>
            <Text style={styles.announcementImportance}>
              Importance: {item.importance}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !loading && <Text style={styles.noDataText}>No announcements available</Text>
        }
      />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={newAnnouncement.title}
          onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, title: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Content"
          value={newAnnouncement.content}
          onChangeText={(text) => setNewAnnouncement({ ...newAnnouncement, content: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Importance (low, medium, high)"
          value={newAnnouncement.importance}
          onChangeText={(text) =>
            setNewAnnouncement({ ...newAnnouncement, importance: text.toLowerCase() })
          }
        />
        <TouchableOpacity style={styles.button} onPress={createAnnouncement}>
          <FontAwesome name="plus" size={16} color="#fff" />
          <Text style={styles.buttonText}>Create Announcement</Text>
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
  announcementCard: {
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
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  announcementContent: {
    fontSize: 14,
    marginVertical: 5,
  },
  announcementImportance: {
    fontSize: 12,
    color: '#888',
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

export default ManageAnnouncements;