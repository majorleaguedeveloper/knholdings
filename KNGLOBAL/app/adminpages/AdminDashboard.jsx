import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  MaterialIcons, 
  FontAwesome5,
  Feather
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import AuthContext from '../../contexts/Authcontext';

// Get device dimensions
const { width } = Dimensions.get('window');

const AdminDashboard = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    totalShares: 0,
    totalShareValue: 0,
    announcements: [],
    topMembers: []
  });
  const router = useRouter();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  // Create a memoized fetch function to avoid recreation on every render
  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
    try {
      // Make parallel API calls to get all necessary data
      const [membersRes, sharesStatsRes, announcementsRes] = await Promise.all([
        axios.get('https://knholdingsbackend.onrender.com/api/admin/members', config),
        axios.get('https://knholdingsbackend.onrender.com/api/shares/stats',config),
        axios.get('https://knholdingsbackend.onrender.com/api/admin/announcements', config),
      ]);

      // Process the data
      const newData = {
        totalMembers: membersRes.data.count,
        totalShares: sharesStatsRes.data.data.totalShares || 0,
        totalShareValue: sharesStatsRes.data.data.totalValue || 0,
        announcements: announcementsRes.data.data.slice(0, 5), // Show latest 5 announcements
        topMembers: sharesStatsRes.data.data.topMembers || []
      };
      
      setDashboardData(newData);
    
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {

      
      // Always fetch fresh data
      fetchDashboardData();
    // Setup interval to refresh data every 2 minutes
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 120000); // 2 minutes
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
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
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
      >
        {/* Header with background gradient */}
        <LinearGradient
          colors={['#4158D0', '#3498db', '#3498db']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerContainer}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>KN Holdings Cooperative</Text>
            </View>
            {/* 
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              >
              <MaterialIcons name="refresh" size={22} color="#FFF" />
            </TouchableOpacity>
            */}
          </View>
        </LinearGradient>

        {/* Main Stats Cards */}
        <View style={styles.mainStatsContainer}>
          {/* Total Members Card */}
          <TouchableOpacity 
            onPress={() => router.push('/adminpages/ManageMembers')}
            style={styles.statCardWrapper}
          >
            <LinearGradient
              colors={['#3498db', '#4158D0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <FontAwesome5 name="users" size={24} color="#FFF" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardData.totalMembers}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Total Shares Card */}
          <TouchableOpacity
            onPress={() => router.push('/adminpages/ManageShares')}
            style={styles.statCardWrapper}
          >
            <LinearGradient
              colors={['#3498db', '#3498db']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="file-document-multiple" size={24} color="#FFF" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{dashboardData.totalShares}</Text>
                <Text style={styles.statLabel}>Total Shares</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Share Value Card */}
        <TouchableOpacity
          onPress={() => router.push('/adminpages/ManageShares')}
          style={styles.valueCardContainer}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.valueCard}
          >
            <View style={styles.valueCardContent}>
              <View style={styles.valueIconContainer}>
                <FontAwesome5 name="chart-line" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.valueCardLabel}>Total Share Purchase Price</Text>
                <Text style={styles.valueCardAmount}>{formatCurrency(dashboardData.totalShareValue)}</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Top Members Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <FontAwesome5 name="trophy" size={18} color="#3498db" />
              <Text style={styles.sectionTitle}>Top Members</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/adminpages/MemberRankings')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={18} color="#3498db" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.topMembersContainer}>
            {dashboardData.topMembers && dashboardData.topMembers.length > 0 ? (
              dashboardData.topMembers.slice(0, 3).map((member, index) => (
                <View key={index} style={styles.topMemberItem}>
                  <View style={[styles.memberRankBadge, 
                    index === 0 ? styles.firstRank : 
                    index === 1 ? styles.secondRank : 
                    styles.thirdRank
                  ]}>
                    <Text style={styles.memberRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberSharesContainer}>
                    <Text style={styles.memberSharesValue}>{member.totalShares}</Text>
                    <Text style={styles.memberSharesLabel}>shares</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No member data available</Text>
            )}
          </View>
        </View>
        
        {/* Announcements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="announcement" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Recent Announcements</Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/adminpages/ManageAnnouncements')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Manage</Text>
              <MaterialIcons name="chevron-right" size={18} color="#3498db" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.announcementsContainer}>
            {dashboardData.announcements && dashboardData.announcements.length > 0 ? (
              dashboardData.announcements.map((announcement, index) => (
                <View key={index} style={styles.announcementItem}>
                  <View style={[
                    styles.announcementIconContainer,
                    announcement.importance === 'high' ? styles.highImportance :
                    announcement.importance === 'medium' ? styles.mediumImportance :
                    styles.lowImportance
                  ]}>
                    <Ionicons 
                      name={announcement.importance === 'high' ? "warning" : "megaphone"} 
                      size={18} 
                      color="#FFF" 
                    />
                  </View>
                  <View style={styles.announcementContent}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    {announcement.date && (
                      <Text style={styles.announcementDate}>
                        {new Date(announcement.createdAt || announcement.date).toLocaleDateString()}
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
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="dashboard-customize" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/adminpages/ManageMembers')}
            >
              <LinearGradient
                colors={['#3498db', '#4158D0']}
                style={styles.actionCardGradient}
              >
                <FontAwesome5 name="user-cog" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.actionCardText}>Manage Members</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/adminpages/ManageShares')}
            >
              <LinearGradient
                colors={['#4CD964', '#2ECC71']}
                style={styles.actionCardGradient}
              >
                <MaterialCommunityIcons name="file-document-edit" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.actionCardText}>Manage Shares</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/adminpages/ManageAnnouncements')}
            >
              <LinearGradient
                colors={['#FF9D42', '#FF8130']}
                style={styles.actionCardGradient}
              >
                <MaterialIcons name="campaign" size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.actionCardText}>Announcements</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/adminpages/ShareDistribution')}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.actionCardGradient}
              >
                <FontAwesome5 name="chart-pie" size={22} color="#FFF" />
              </LinearGradient>
              <Text style={styles.actionCardText}>Share Distribution</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>KN Holdings Cooperative</Text>
          <Text style={styles.copyrightText}>© {new Date().getFullYear()} All Rights Reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 80,
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
    color: '#3498db',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 15,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCardWrapper: {
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    marginLeft: 12,
  },
  statValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  valueCardContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 16,
  },
  valueCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  valueCardLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  valueCardAmount: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#2D3748',
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#3498db',
  },
  topMembersContainer: {
    marginBottom: 5,
  },
  topMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  memberRankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  firstRank: {
    backgroundColor: '#FFD700',
  },
  secondRank: {
    backgroundColor: '#C0C0C0',
  },
  thirdRank: {
    backgroundColor: '#CD7F32',
  },
  memberRankText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#2D3748',
  },
  memberEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#718096',
  },
  memberSharesContainer: {
    alignItems: 'center',
  },
  memberSharesValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#3498db',
  },
  memberSharesLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#718096',
  },
  announcementsContainer: {
    marginBottom: 5,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highImportance: {
    backgroundColor: '#FF6B6B',
  },
  mediumImportance: {
    backgroundColor: '#FF9D42',
  },
  lowImportance: {
    backgroundColor: '#3498db',
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
    padding: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionCardGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionCardText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#2D3748',
    textAlign: 'center',
  },
  footer: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#3498db',
  },
  copyrightText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
});

export default AdminDashboard;