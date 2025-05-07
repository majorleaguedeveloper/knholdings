import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl
} from 'react-native';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import { useRouter } from 'expo-router';

const AllAnnouncements = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const response = await axios.get(
        'http://192.168.45.159:5000/api/member/announcements', 
        config
      );

      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const getImportanceStyle = (importance) => {
    switch(importance) {
      case 'high':
        return styles.highImportance;
      case 'medium':
        return styles.mediumImportance;
      case 'low':
        return styles.lowImportance;
      default:
        return styles.mediumImportance;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading Announcements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Announcements</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0066cc"]}
          />
        }
      >
        {announcements.length > 0 ? (
          announcements.map((announcement, index) => (
            <View 
              key={announcement._id || index} 
              style={[
                styles.announcementCard,
                getImportanceStyle(announcement.importance)
              ]}
            >
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <View style={styles.importanceBadge}>
                  <Text style={styles.importanceText}>
                    {announcement.importance.charAt(0).toUpperCase() + announcement.importance.slice(1)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              
              <View style={styles.announcementFooter}>
                <Text style={styles.dateText}>Posted: {formatDate(announcement.createdAt)}</Text>
                {announcement.expiresAt && (
                  <Text style={styles.expiryText}>
                    Expires: {formatDate(announcement.expiresAt)}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noAnnouncementsContainer}>
            <Text style={styles.noAnnouncementsText}>No announcements available</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#0066cc',
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 5,
  },
  highImportance: {
    borderLeftColor: '#e53935',
  },
  mediumImportance: {
    borderLeftColor: '#fb8c00',
  },
  lowImportance: {
    borderLeftColor: '#4caf50',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  announcementContent: {
    fontSize: 16,
    color: '#444',
    lineHeight: 22,
    marginBottom: 10,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#777',
  },
  expiryText: {
    fontSize: 12,
    color: '#777',
  },
  noAnnouncementsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 10,
  },
  noAnnouncementsText: {
    fontSize: 16,
    color: '#777',
  },
});

export default AllAnnouncements;