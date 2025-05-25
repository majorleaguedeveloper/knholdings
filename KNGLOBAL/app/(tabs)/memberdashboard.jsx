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
  Dimensions,
  ImageBackground
} from 'react-native';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
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

// Get screen dimensions for responsive sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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



  const fetchDashboardData = async () => {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
    try {           
      const [profileRes, sharesRes, announcementsRes, monthlySharesRes] = await Promise.all([
        axios.get('https://knholdingsbackend.onrender.com/api/member/profile', config),
        axios.get('https://knholdingsbackend.onrender.com/api/member/shares', config),
        axios.get('https://knholdingsbackend.onrender.com/api/member/announcements', config),
        axios.get('https://knholdingsbackend.onrender.com/api/member/shares/monthly', config)
      ]);

      const newData = {
        profile: profileRes.data.data,
        totalShares: sharesRes.data.totalShares,
        sharesList: sharesRes.data.data.slice(0, 3),
        allAnnouncements: announcementsRes.data.data,
        announcements: announcementsRes.data.data.slice(0, 3),
        monthlyShares: monthlySharesRes.data.data.slice(0, 6)
      };
      
      setDashboardData(newData);
    } catch (error) {
      console.error('Error fetching member dashboard data:', error);
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

  // Format currency amounts
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format month and year for monthly summary
  const formatMonthYear = (monthStr) => {
    if (!monthStr) return 'Unknown';
    
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Calculate investment stats and growth
  const getStatsData = () => {
    if (!dashboardData.monthlyShares || dashboardData.monthlyShares.length === 0) {
      return { 
        totalMonthlyAmount: 0,
        averageShares: 0,
        growthPercentage: 0,
        monthlyData: []
      };
    }
    
    const totalAmount = dashboardData.monthlyShares.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const averageShares = dashboardData.monthlyShares.reduce((sum, item) => sum + item.totalShares, 0) / dashboardData.monthlyShares.length;
    
    // Calculate growth (if there are at least 2 months of data)
    let growthPercentage = 0;
    if (dashboardData.monthlyShares.length >= 2) {
      const sortedData = [...dashboardData.monthlyShares].sort((a, b) => {
        return new Date(a.month) - new Date(b.month);
      });
      
      const oldest = sortedData[sortedData.length - 2].totalShares;
      const newest = sortedData[sortedData.length - 1].totalShares;
      
      if (oldest > 0) {
        growthPercentage = ((newest - oldest) / oldest) * 100;
      }
    }
    
    return {
      totalMonthlyAmount: totalAmount,
      averageShares: averageShares,
      growthPercentage: growthPercentage,
      monthlyData: dashboardData.monthlyShares
    };
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={[styles.loadingText, {fontFamily: 'System'}]}>Loading fonts...</Text>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3498db"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with gradient background */}
        <View style={styles.header}>
          <View style={styles.headerOverlay}>
            <View style={styles.profileSection}>
              <View style={styles.profileIcon}>
                <FontAwesome name="user" size={28} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.welcomeText} numberOfLines={1}>
                  Welcome, {dashboardData.profile?.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name="calendar-check" size={12} color="#eff6ff" style={styles.smallIcon} />
                  <Text style={styles.memberSince}>
                    Member Since: {dashboardData.profile?.createdAt ? new Date(dashboardData.profile.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, styles.sharesIconBg]}>
              <MaterialCommunityIcons name="chart-pie" size={22} color="blue" />
            </View>
            <View style={styles.statsTextContainer}>
              <Text style={styles.statsValue}>{dashboardData.totalShares}</Text>
              <Text style={styles.statsLabel}>Total Shares</Text>
            </View>
          </View>
          
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, styles.growthIconBg]}>
              <Feather name="trending-up" size={22} color="#10b981" />
            </View>
            <View style={styles.statsTextContainer}>
              <Text style={styles.statsValue}>
                {statsData.averageShares.toFixed(2)}
              </Text>
              <Text style={styles.statsLabel}>Average Monthly Shares</Text>
            </View>
          </View>
          
          <View style={styles.statsCard}>
            <View style={[styles.statsIconContainer, styles.alertIconBg]}>
              <Ionicons name="notifications" size={22} color="red" />
            </View>
            <View style={styles.statsTextContainer}>
              <Text style={styles.statsValue}>{dashboardData.allAnnouncements.length}</Text>
              <Text style={styles.statsLabel}>Alerts</Text>
            </View>
          </View>
        </View>

        {/* Monthly Summary Section - Inspired by ShareHistory */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Monthly Summary</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/memberpages/ShareHistory')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#3498db" />
            </TouchableOpacity>
          </View>

          {dashboardData.monthlyShares.length > 0 ? (
            <ScrollView 
              horizontal={true} 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthlyCardsContainer}
            >
              {dashboardData.monthlyShares.map((item, index) => (
                <View key={index} style={styles.monthlyCard}>
                  <View style={styles.monthlyHeader}>
                    <View style={styles.monthlyTitleContainer}>
                      <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#3498db" />
                      <Text style={styles.monthlyTitle}>{formatMonthYear(item.month)}</Text>
                    </View>
                    <View style={styles.monthlySharesContainer}>
                      <MaterialCommunityIcons name="chart-timeline-variant" size={16} color="#3498db" />
                      <Text style={styles.monthlyShares}>{item.totalShares} {item.totalShares === 1 ? 'share' : 'shares'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.monthlyInvestment}>
                    <Text style={styles.investmentLabel}>Total Investment:</Text>
                    <Text style={styles.investmentValue}>{formatCurrency(item.totalAmount)}</Text>
                  </View>
                  
                  {/* Mini Purchase History */}
                  <View style={styles.purchaseHistory}>
                    <Text style={styles.purchaseHistoryTitle}>Purchases</Text>
                    {item.purchases.slice(0, 2).map((purchase, idx) => (
                      <View key={idx} style={styles.purchaseItem}>
                        <Text style={styles.purchaseDate}>{new Date(purchase.purchaseDate).toLocaleDateString()}</Text>
                        <View style={styles.purchaseDetails}>
                          <Text style={styles.purchaseQty}>{purchase.quantity}</Text>
                          <Text style={styles.purchasePrice}>{formatCurrency(purchase.totalAmount)}</Text>
                        </View>
                      </View>
                    ))}
                    {item.purchases.length > 2 && (
                      <Text style={styles.morePurchases}>+ {item.purchases.length - 2} more</Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="calendar-alert" size={36} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No monthly data available</Text>
            </View>
          )}
        </View>

        {/* Recent Share Purchases */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Recent Purchases</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/memberpages/ShareHistory')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#3498db" />
            </TouchableOpacity>
          </View>

          {dashboardData.sharesList.length > 0 ? (
            dashboardData.sharesList.map((share, index) => (
              <View key={index} style={styles.shareItem}>
                <View style={styles.shareHeader}>
                  <View style={styles.shareDateContainer}>
                    <MaterialCommunityIcons name="calendar-month" size={16} color="#3498db" style={styles.icon} />
                    <Text style={styles.shareDate}>{formatDate(share.purchaseDate)}</Text>
                  </View>
                  <View style={styles.shareQtyPrice}>
                    <Text style={styles.shareQuantity}>
                      {share.quantity} {share.quantity === 1 ? 'share' : 'shares'}
                    </Text>
                    <Text style={styles.sharePrice}>@ {formatCurrency(share.pricePerShare)}</Text>
                  </View>
                </View>
                
                <View style={styles.shareDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      <FontAwesome5 name="money-bill-wave" size={12} color="#6b7280" /> Total Amount:
                    </Text>
                    <Text style={styles.detailValue}>{formatCurrency(share.totalAmount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      <FontAwesome5 name="credit-card" size={12} color="#6b7280" /> Payment Method:
                    </Text>
                    <Text style={styles.detailValue}>{share.paymentMethod.charAt(0).toUpperCase() + share.paymentMethod.slice(1)}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="chart-line-variant" size={36} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No recent share purchases</Text>
            </View>
          )}
        </View>

        {/* Announcements */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Announcements</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/memberpages/AllAnnouncements')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#3498db" />
            </TouchableOpacity>
          </View>

          {dashboardData.announcements.length > 0 ? (
            dashboardData.announcements.map((announcement, index) => (
              <View key={index} style={styles.announcementItem}>
                <View style={styles.announcementHeader}>
                  <View style={styles.announcementBadge}>
                    <MaterialCommunityIcons name="bell-ring" size={14} color="#ffffff" />
                  </View>
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                </View>
                <Text style={styles.announcementContent} numberOfLines={2}>
                  {announcement.content}
                </Text>
                <View style={styles.announcementFooter}>
                  <View style={styles.dateContainer}>
                    <Feather name="clock" size={12} color="#6b7280" />
                    <Text style={styles.announcementDate}>
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons name="bell-off" size={36} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No announcements available</Text>
            </View>
          )}
        </View>

        {/* Extra padding at bottom to prevent content being hidden by tab bar */}
        <View style={styles.bottomSpacer} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingBottom: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 0, // Extra padding to account for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'OutfitRegular',
  },
  // Header Styles
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#3498db',
    overflow: 'hidden',
    height: 140,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 35
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeText: {
    fontFamily: 'OutfitBold',
    fontSize: 22,
    color: '#ffffff',
    marginBottom: 4,
  },
  memberSince: {
    fontFamily: 'OutfitRegular',
    fontSize: 14,
    color: '#eff6ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIcon: {
    marginRight: 4,
  },
  
  // Quick Stats Cards
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -35,
    marginBottom: 16,
  },
  statsCard: {
    width: SCREEN_WIDTH / 3.5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sharesIconBg: {
    backgroundColor: '#eff6ff',
  },
  growthIconBg: {
    backgroundColor: '#ecfdf5',
  },
  alertIconBg: {
    backgroundColor: '#fef3c7',
  },
  statsTextContainer: {
    alignItems: 'center',
  },
  statsValue: {
    fontFamily: 'OutfitBold',
    fontSize: 18,
    color: '#111827',
  },
  statsLabel: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Section Containers
  sectionContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#3498db',
    marginRight: 2,
  },
  
  // Monthly Summary Cards
  monthlyCardsContainer: {
    paddingRight: 8,
    paddingBottom: 8,
  },
  monthlyCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyTitle: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 16,
    color: '#111827',
    marginLeft: 6,
  },
  monthlySharesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthlyShares: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 13,
    color: '#3498db',
    marginLeft: 4,
  },
  monthlyInvestment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  investmentLabel: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#4b5563',
  },
  investmentValue: {
    fontFamily: 'OutfitBold',
    fontSize: 14,
    color: '#111827',
  },
  purchaseHistory: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  purchaseHistoryTitle: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#111827',
    marginBottom: 6,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  purchaseDate: {
    fontFamily: 'OutfitRegular',
    fontSize: 13,
    color: '#6b7280',
  },
  purchaseDetails: {
    flexDirection: 'row',
  },
  purchaseQty: {
    fontFamily: 'OutfitRegular',
    fontSize: 13,
    color: '#111827',
    marginRight: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purchasePrice: {
    fontFamily: 'OutfitMedium',
    fontSize: 13,
    color: '#111827',
  },
  morePurchases: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  
  // Share Items
  shareItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shareDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  shareDate: {
    fontSize: 14,
    fontFamily: 'OutfitMedium',
    color: '#111827',
  },
  shareQtyPrice: {
    alignItems: 'flex-end',
  },
  shareQuantity: {
    fontSize: 14,
    fontFamily: 'OutfitSemiBold',
    color: '#111827',
  },
  sharePrice: {
    fontSize: 13,
    fontFamily: 'OutfitRegular',
    color: '#6b7280',
    marginTop: 2,
  },
  shareDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'OutfitRegular',
    color: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'OutfitMedium',
    color: '#111827',
  },
  
  // Announcement Items
  announcementItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
 announcementBadge: {
    backgroundColor: '#3498db',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  announcementTitle: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  announcementContent: {
    fontFamily: 'OutfitRegular',
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  announcementDate: {
    fontFamily: 'OutfitRegular',
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  
  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontFamily: 'OutfitMedium',
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: '#3498db',
  },
  actionButtonText: {
    fontFamily: 'OutfitSemiBold',
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  
  // Bottom Spacer
  bottomSpacer: {
    height: 80,
  }
});

export default MemberDashboard;