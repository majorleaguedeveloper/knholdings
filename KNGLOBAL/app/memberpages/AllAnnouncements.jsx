import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { API_BASE_URL } from '../apiConfig';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const API_URL = `${API_BASE_URL}/member/announcements`;

const AllAnnouncements = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  const fetchAnnouncements = useCallback(async () => {
    if (!userToken) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };

      const response = await axios.get(API_URL, config);
      const fetchedAnnouncements = response.data.data;
      
      setAnnouncements(fetchedAnnouncements);
      setError(null);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Unable to update announcements. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
  }, [userToken, fontsLoaded]);

  // Load initial data and setup auto-refresh
  useEffect(() => {
      fetchAnnouncements();

    // Auto refresh setup
    const interval = setInterval(() => {
      fetchAnnouncements();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  // Refresh control handler
  const onRefresh = useCallback(() => {
    if (!refreshing) {
      setRefreshing(true);
      fetchAnnouncements();
    }
  }, [refreshing, fetchAnnouncements]);

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

  const getImportanceIcon = (importance) => {
    switch(importance) {
      case 'high':
        return <MaterialIcons name="priority-high" size={16} color="#e53935" />;
      case 'medium':
        return <MaterialIcons name="warning" size={16} color="#fb8c00" />;
      case 'low':
        return <MaterialIcons name="info" size={16} color="#4caf50" />;
      default:
        return <MaterialIcons name="info" size={16} color="#fb8c00" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate if announcement is expiring soon (within 3 days)
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 3;
  };

  if (!fontsLoaded) {
    return null; // Don't render anything while fonts are loading
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6f8fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3f51b5"]}
            tintColor="#3f51b5"
          />
        }
      >
        {loading || !fontsLoaded ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10 }}>Loading announcements...</Text>
          </View>
        ) : announcements.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'red', fontSize: 16 }}>No announcements found. Pull to refresh or check your connection.</Text>
          </View>
        ) : (
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
                <View style={[
                  styles.importanceBadge,
                  announcement.importance === 'high' && styles.highImportanceBadge,
                  announcement.importance === 'medium' && styles.mediumImportanceBadge,
                  announcement.importance === 'low' && styles.lowImportanceBadge,
                ]}>
                  {getImportanceIcon(announcement.importance)}
                  <Text style={[
                    styles.importanceText,
                    announcement.importance === 'high' && styles.highImportanceText,
                    announcement.importance === 'medium' && styles.mediumImportanceText,
                    announcement.importance === 'low' && styles.lowImportanceText,
                  ]}>
                    {announcement.importance.charAt(0).toUpperCase() + announcement.importance.slice(1)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.announcementContent}>{announcement.content}</Text>
              
              <View style={styles.announcementFooter}>
                <View style={styles.footerItem}>
                  <FontAwesome name="calendar" size={12} color="#777" style={styles.footerIcon} />
                  <Text style={styles.dateText}>Posted: {formatDate(announcement.createdAt)}</Text>
                </View>
                
                {announcement.expiresAt && (
                  <View style={styles.footerItem}>
                    <FontAwesome name="clock-o" size={12} color={isExpiringSoon(announcement.expiresAt) ? "#e53935" : "#777"} style={styles.footerIcon} />
                    <Text style={[
                      styles.expiryText,
                      isExpiringSoon(announcement.expiresAt) && styles.expiringSoonText
                    ]}>
                      Expires: {formatDate(announcement.expiresAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#3498db',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
    justifyContent: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
      },
      android: {
        elevation: 3,
      },
    }),
    borderLeftWidth: 6,
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
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#333',
    flex: 1,
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginLeft: 8,
  },
  highImportanceBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  mediumImportanceBadge: {
    backgroundColor: 'rgba(251, 140, 0, 0.1)',
  },
  lowImportanceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  importanceText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 4,
  },
  highImportanceText: {
    color: '#e53935',
  },
  mediumImportanceText: {
    color: '#fb8c00',
  },
  lowImportanceText: {
    color: '#4caf50',
  },
  announcementContent: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#444',
    lineHeight: 24,
    marginBottom: 16,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#777',
  },
  expiryText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#777',
  },
  expiringSoonText: {
    color: '#e53935',
    fontFamily: 'Outfit_500Medium',
  },
  noAnnouncementsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 10,
    height: 300,
  },
  noAnnouncementsText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Outfit_500Medium',
    color: '#777',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3f51b5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
  },
});

export default AllAnnouncements;