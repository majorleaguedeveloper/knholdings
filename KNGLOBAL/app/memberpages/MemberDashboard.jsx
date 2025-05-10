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
  StatusBar,
  Dimensions
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
import { LineChart } from 'react-native-chart-kit';

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
      const savedData = await AsyncStorage.getItem('dashboardData');
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
        axios.get('http://192.168.176.253:5000/api/member/profile', config),
        axios.get('http://192.168.176.253:5000/api/member/shares', config),
        axios.get('http://192.168.176.253:5000/api/member/announcements', config),
        axios.get('http://192.168.176.253:5000/api/member/shares/monthly', config)
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

  // Format data for line chart
  const formatChartData = () => {
    if (!dashboardData.monthlyShares || dashboardData.monthlyShares.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }]
      };
    }

    // Sort monthly shares by date
    const sortedData = [...dashboardData.monthlyShares].sort((a, b) => {
      const getMonthNumber = (month) => {
        const months = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
        return months.indexOf(month);
      };
      return getMonthNumber(a.month) - getMonthNumber(b.month);
    });

    return {
      labels: sortedData.map(item => item.month.substring(0, 3)),
      datasets: [{
        data: sortedData.map(item => item.totalShares),
        color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  // Format data for summary stats
  const getStatsData = () => {
    if (!dashboardData.monthlyShares || dashboardData.monthlyShares.length === 0) {
      return { 
        totalMonthlyAmount: 0,
        averageShares: 0,
        growthPercentage: 0
      };
    }
    
    const totalAmount = dashboardData.monthlyShares.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const averageShares = dashboardData.monthlyShares.reduce((sum, item) => sum + item.totalShares, 0) / dashboardData.monthlyShares.length;
    
    // Calculate growth (if there are at least 2 months of data)
    let growthPercentage = 0;
    if (dashboardData.monthlyShares.length >= 2) {
      const sortedData = [...dashboardData.monthlyShares].sort((a, b) => {
        const getMonthNumber = (month) => {
          const months = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
          return months.indexOf(month);
        };
        return getMonthNumber(a.month) - getMonthNumber(b.month);
      });
      
      const oldest = sortedData[0].totalShares;
      const newest = sortedData[sortedData.length - 1].totalShares;
      
      if (oldest > 0) {
        growthPercentage = ((newest - oldest) / oldest) * 100;
      }
    }
    
    return {
      totalMonthlyAmount: totalAmount,
      averageShares: averageShares,
      growthPercentage: growthPercentage
    };
  };

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

  const statsData = getStatsData();
  const chartData = formatChartData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileOverview}>
            <View style={styles.profileIcon}>
              <FontAwesome name="user" size={30} color="#ffffff" />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.welcomeText} numberOfLines={1}>
                Welcome, {dashboardData.profile?.name}
              </Text>
              <Text style={styles.memberSince}>
                Member Since: {new Date(dashboardData.profile?.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.sharesIconBg]}>
                <Ionicons name="share-social" size={22} color="#3498db" />
              </View>
              <Text style={styles.statValue}>{dashboardData.totalShares}</Text>
              <Text style={styles.statLabel}>Total Shares</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.investmentIconBg]}>
                <FontAwesome name="dollar" size={22} color="#2ecc71" />
              </View>
              <Text style={styles.statValue}>
                ${dashboardData.monthlyShares[0]?.totalAmount?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.statLabel}>Recent Investment</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.alertsIconBg]}>
                <Ionicons name="notifications" size={22} color="#e74c3c" />
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
                <View 
                  key={index} 
                  style={[
                    styles.shareItem, 
                    index === dashboardData.sharesList.length - 1 ? styles.noBorder : null
                  ]}
                >
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

          {/* Monthly Share Summary with Line Chart */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="calendar-alt" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Monthly Summary</Text>
            </View>
            
            {dashboardData.monthlyShares.length > 0 ? (
              <>
                {/* Chart */}
                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={SCREEN_WIDTH - 64}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(127, 140, 141, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '6',
                        strokeWidth: '2',
                        stroke: '#3498db'
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                {/* Summary Statistics */}
                <View style={styles.monthlySummaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>
                      ${statsData.totalMonthlyAmount.toFixed(2)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Total Investment</Text>
                  </View>
                  
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>
                      {statsData.averageShares.toFixed(1)}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Avg. Monthly Shares</Text>
                  </View>
                  
                  <View style={styles.summaryStatItem}>
                    <View style={styles.growthContainer}>
                      <Text style={[
                        styles.summaryStatValue,
                        statsData.growthPercentage >= 0 ? styles.positiveGrowth : styles.negativeGrowth
                      ]}>
                        {statsData.growthPercentage.toFixed(1)}%
                      </Text>
                      {statsData.growthPercentage >= 0 ? (
                        <Feather name="trending-up" size={16} color="#2ecc71" style={styles.growthIcon} />
                      ) : (
                        <Feather name="trending-down" size={16} color="#e74c3c" style={styles.growthIcon} />
                      )}
                    </View>
                    <Text style={styles.summaryStatLabel}>Period Growth</Text>
                  </View>
                </View>
              </>
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
                <View 
                  key={index} 
                  style={[
                    styles.announcementItem, 
                    index === dashboardData.announcements.length - 1 ? styles.noBorder : null
                  ]}
                >
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
              <FontAwesome name="edit" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Update Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => router.push('/memberpages/ShareHistory')}
            >
              <Ionicons name="document-text" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Share History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
    paddingHorizontal: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statCard: {
    width: SCREEN_WIDTH / 2.5,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sharesIconBg: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
  },
  investmentIconBg: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  alertsIconBg: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  statValue: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    color: '#2c3e50',
  },
  statLabel: {
    fontFamily: 'OutfitRegular',
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  noBorder: {
    borderBottomWidth: 0,
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
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 8,
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
    alignItems: 'center',
    marginVertical: 10,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  monthlySummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  summaryStatValue: {
    fontFamily: 'OutfitBold',
    fontSize: 16,
    color: '#2c3e50',
  },
  summaryStatLabel: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  growthIcon: {
    marginLeft: 4,
  },
  positiveGrowth: {
    color: '#2ecc71',
  },
  negativeGrowth: {
    color: '#e74c3c',
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
    marginBottom: 200,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
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