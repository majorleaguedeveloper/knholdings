import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  useFonts, 
  Outfit_400Regular, 
  Outfit_500Medium, 
  Outfit_600SemiBold,
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  FontAwesome, 
  FontAwesome5,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather
} from '@expo/vector-icons';

const MemberDashboard = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    totalShares: 0,
    sharesList: [],
    announcements: [],
    monthlyShares: []
  });
  const router = useRouter();
  
  // Load Outfit fonts
  const [fontsLoaded] = useFonts({
    OutfitRegular: Outfit_400Regular,
    OutfitMedium: Outfit_500Medium,
    OutfitSemiBold: Outfit_600SemiBold,
    OutfitBold: Outfit_700Bold,
  });

  // Save dashboard data to AsyncStorage
  const saveDashboardData = async (data) => {
    try {
      await AsyncStorage.setItem('dashboardData', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving dashboard data:', error);
    }
  };

  // Load dashboard data from AsyncStorage
  const loadSavedDashboardData = async () => {
    try {
      const savedData = await AsyncStorage.setItem('dashboardData');
      if (savedData) {
        setDashboardData(JSON.parse(savedData));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading saved dashboard data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (!userToken) {
        console.log('No user token available');
        loadSavedDashboardData();
        return;
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const [profileRes, sharesRes, announcementsRes, monthlySharesRes] = await Promise.all([
        axios.get('http://192.168.108.159:5000/api/member/profile', config),
        axios.get('http://192.168.108.159:5000/api/member/shares', config),
        axios.get('http://192.168.108.159:5000/api/member/announcements', config),
        axios.get('http://192.168.108.159:5000/api/member/shares/monthly', config)
      ]);

      const newData = {
        profile: profileRes.data.data,
        totalShares: sharesRes.data.totalShares,
        sharesList: sharesRes.data.data.slice(0, 5),
        announcements: announcementsRes.data.data.slice(0, 3),
        monthlyShares: monthlySharesRes.data.data.slice(0, 6)
      };
      
      setDashboardData(newData);
      saveDashboardData(newData);
    } catch (error) {
      console.error('Error fetching member dashboard data:', error);
      loadSavedDashboardData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh control handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Fetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [userToken])
  );

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#3498db" />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading Member Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileOverview}>
            <View style={styles.profileIcon}>
              <FontAwesome name="user" size={32} color="#ffffff" />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.welcomeText}>Welcome, {dashboardData.profile?.name}</Text>
              <Text style={styles.memberSince}>Member Since: {new Date(dashboardData.profile?.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="share-social" size={24} color="#3498db" />
            </View>
            <Text style={styles.statValue}>{dashboardData.totalShares}</Text>
            <Text style={styles.statLabel}>Total Shares</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <FontAwesome name="dollar" size={24} color="#2ecc71" />
            </View>
            <Text style={styles.statValue}>
              ${dashboardData.monthlyShares[0]?.totalAmount?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Recent Investment</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="notifications" size={24} color="#e74c3c" />
            </View>
            <Text style={styles.statValue}>
              {dashboardData.announcements.length}
            </Text>
            <Text style={styles.statLabel}>New Alerts</Text>
          </View>
        </View>

        {/* Shares Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Your Shares</Text>
          </View>
          
          {dashboardData.sharesList.length > 0 ? (
            dashboardData.sharesList.map((share, index) => (
              <View key={index} style={styles.shareItem}>
                <View style={styles.shareItemLeft}>
                  <Text style={styles.shareDate}>
                    {new Date(share.purchaseDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.shareQuantity}>
                    {share.quantity} shares
                  </Text>
                </View>
                <Text style={styles.sharePrice}>
                  ${share.pricePerShare} per share
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent share purchases</Text>
          )}
          
          <TouchableOpacity 
            style={styles.viewMoreButton} 
            onPress={() => router.push('/memberpages/ShareHistory')}
          >
            <Text style={styles.viewMoreText}>View All Shares</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {/* Monthly Share Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="calendar-alt" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
          </View>
          
          {dashboardData.monthlyShares.length > 0 ? (
            <View style={styles.chartContainer}>
              {dashboardData.monthlyShares.map((monthData, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar, 
                      { 
                        height: `${Math.min(100, (monthData.totalShares / Math.max(...dashboardData.monthlyShares.map(m => m.totalShares))) * 100)}%` 
                      }
                    ]} 
                  />
                  <Text style={styles.chartLabel}>{monthData.month.substring(0, 3)}</Text>
                  <Text style={styles.chartValue}>{monthData.totalShares}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No monthly data available</Text>
          )}
        </View>

        {/* Announcements */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Announcements</Text>
          </View>
          
          {dashboardData.announcements.length > 0 ? (
            dashboardData.announcements.map((announcement, index) => (
              <View key={index} style={styles.announcementItem}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={2}>
                  {announcement.content}
                </Text>
                <View style={styles.announcementMeta}>
                  <Feather name="clock" size={14} color="#7f8c8d" />
                  <Text style={styles.announcementDate}>
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No announcements available</Text>
          )}
          
          <TouchableOpacity 
            style={styles.viewMoreButton} 
            onPress={() => router.push('/memberpages/AllAnnouncements')}
          >
            <Text style={styles.viewMoreText}>View All Announcements</Text>
            <Ionicons name="chevron-forward" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/memberpages/UpdateProfile')}
          >
            <FontAwesome name="edit" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Update Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => router.push('/memberpages/ShareHistory')}
          >
            <Ionicons name="document-text" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Share History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'OutfitMedium',
    color: '#7f8c8d',
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  profileOverview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileText: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#ffffff',
  },
  memberSince: {
    fontFamily: 'OutfitRegular',
    fontSize: 14,
    color: '#ecf0f1',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    color: '#2c3e50',
  },
  statLabel: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 18,
    color: '#2c3e50',
    marginLeft: 8,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  shareItemLeft: {
    flex: 1,
  },
  shareDate: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#2c3e50',
  },
  shareQuantity: {
    fontFamily: 'OutfitRegular',
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 4,
  },
  sharePrice: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 14,
    color: '#16a085',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  viewMoreText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#3498db',
    marginRight: 4,
  },
  emptyText: {
    fontFamily: 'OutfitRegular',
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingVertical: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginVertical: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 20,
    backgroundColor: '#3498db',
    borderRadius: 4,
    minHeight: 20,
  },
  chartLabel: {
    fontFamily: 'OutfitMedium',
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 6,
  },
  chartValue: {
    fontFamily: 'OutfitRegular',
    fontSize: 10,
    color: '#7f8c8d',
  },
  announcementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  announcementTitle: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 16,
    color: '#2c3e50',
  },
  announcementContent: {
    fontFamily: 'OutfitRegular',
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  announcementDate: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonSecondary: {
    backgroundColor: '#2c3e50',
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
});

export default MemberDashboard;