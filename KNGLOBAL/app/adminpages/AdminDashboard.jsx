import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingApprovals: 0,
    totalShares: 0,
    announcements: [],
  });
  const router = useRouter();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  useEffect(() => {
    // First try to get cached data
    const loadCachedData = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('dashboardData');
        if (cachedData) {
          setDashboardData(JSON.parse(cachedData));
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
      
      // Always fetch fresh data
      fetchDashboardData();
    };
    
    loadCachedData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [membersRes, sharesRes, announcementsRes] = await Promise.all([
        axios.get('http://192.168.108.159:5000/api/admin/members'),
        axios.get('http://192.168.108.159:5000/api/admin/shares'),
        axios.get('http://192.168.108.159:5000/api/admin/announcements'),
      ]);

      const newData = {
        totalMembers: membersRes.data.count,
        pendingApprovals: membersRes.data.data.filter((m) => m.status === 'pending').length,
        totalShares: sharesRes.data.count,
        announcements: announcementsRes.data.data.slice(0, 5), // Show latest 5 announcements
      };
      
      setDashboardData(newData);
      
      // Cache the data
      await AsyncStorage.setItem('dashboardData', JSON.stringify(newData));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchDashboardData();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B72F2" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B72F2" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B72F2']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Overview of cooperative</Text>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#5B72F2', '#3D56D2']}
            style={[styles.statCard, styles.primaryCard]}
          >
            <View style={styles.statIconContainer}>
              <FontAwesome5 name="users" size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboardData.totalMembers}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FF9D42', '#FF8130']}
            style={[styles.statCard, styles.warningCard]}
          >
            <View style={styles.statIconContainer}>
              <MaterialIcons name="pending-actions" size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboardData.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#4CD964', '#2ECC71']}
            style={[styles.statCard, styles.successCard]}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="file-document-multiple" size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{dashboardData.totalShares}</Text>
            <Text style={styles.statLabel}>Total Shares</Text>
          </LinearGradient>
        </View>
        
        {/* Announcements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="announcement" size={22} color="#5B72F2" />
            <Text style={styles.sectionTitle}>Recent Announcements</Text>
          </View>
          
          <View style={styles.announcementsContainer}>
            {dashboardData.announcements.length > 0 ? (
              dashboardData.announcements.map((announcement, index) => (
                <View key={index} style={styles.announcementItem}>
                  <View style={styles.announcementIconContainer}>
                    <Ionicons name="megaphone" size={18} color="#5B72F2" />
                  </View>
                  <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    {announcement.date && (
                      <Text style={styles.announcementDate}>
                        {new Date(announcement.date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No recent announcements</Text>
            )}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="dashboard-customize" size={22} color="#5B72F2" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/adminpages/ManageMembers')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8EFFF' }]}>
                <FontAwesome5 name="user-cog" size={18} color="#5B72F2" />
              </View>
              <Text style={styles.actionText}>Manage Members</Text>
              <MaterialIcons name="chevron-right" size={20} color="#8A96AD" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/adminpages/ManageShares')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E4FFF0' }]}>
                <MaterialCommunityIcons name="file-document-edit" size={18} color="#2ECC71" />
              </View>
              <Text style={styles.actionText}>Manage Shares</Text>
              <MaterialIcons name="chevron-right" size={20} color="#8A96AD" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/adminpages/ManageAnnouncements')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF5E8' }]}>
                <MaterialIcons name="campaign" size={18} color="#FF9D42" />
              </View>
              <Text style={styles.actionText}>Manage Announcements</Text>
              <MaterialIcons name="chevron-right" size={20} color="#8A96AD" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#5B72F2',
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#2D3748',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#718096',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    width: '31%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryCard: {
    backgroundColor: '#5B72F2',
  },
  warningCard: {
    backgroundColor: '#FF9D42',
  },
  successCard: {
    backgroundColor: '#4CD964',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#2D3748',
    marginLeft: 8,
  },
  announcementsContainer: {
    marginBottom: 8,
  },
  announcementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  announcementIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#2D3748',
  },
  announcementDate: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  noDataText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    padding: 20,
  },
  actionsContainer: {
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#2D3748',
  },
});

export default AdminDashboard;