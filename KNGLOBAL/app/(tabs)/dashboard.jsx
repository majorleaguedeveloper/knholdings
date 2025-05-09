import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingApprovals: 0,
    totalShares: 0,
    totalValue: 0,
    recentTransactions: [],
    monthlyDistribution: [],
    memberShares: 0,
    memberSharesHistory: [],
    announcements: [],
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      console.log(`userdata: ${userData}`);
      console.log(`userdata: ${token}`);
      
      

      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        fetchDashboardData(parsedUser, token);
      } else {
        router.push('/auth/login'); // Redirect to login if no user data
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchDashboardData = async (user, token) => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (user.role === 'admin') {
        const [membersRes, sharesStatsRes, allSharesRes] = await Promise.all([
          axios.get('http://192.168.220.159:5000/api/admin/members', config),
          axios.get('http://192.168.220.159:5000/api/shares/stats', config),
          axios.get('http://192.168.220.159:5000/api/admin/shares', config),
        ]);

        setDashboardData({
          totalMembers: membersRes.data.count,
          pendingApprovals: membersRes.data.data.filter((m) => m.status === 'pending').length,
          totalShares: sharesStatsRes.data.data.totalShares,
          totalValue: sharesStatsRes.data.data.totalValue,
          recentTransactions: allSharesRes.data.data.slice(0, 5),
          monthlyDistribution: sharesStatsRes.data.data.monthlyDistribution,
        });
      } else {
        const [memberSharesRes, announcementsRes] = await Promise.all([
          axios.get('http://192.168.220.159:5000/api/member/shares', config),
          axios.get('http://192.168.220.159:5000/api/member/announcements', config),
        ]);

        setDashboardData({
          memberShares: memberSharesRes.data.totalShares,
          memberSharesHistory: memberSharesRes.data.data,
          announcements: announcementsRes.data.data,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('userToken');
    fetchDashboardData(user, token);
  };

  const renderAdminDashboard = () => {
    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    const monthlyData = {
      labels: dashboardData.monthlyDistribution.slice(0, 6).map((item) => {
        const [year, month] = item.month.split('-');
        return `${month}/${year.slice(2)}`;
      }).reverse(),
      datasets: [
        {
          data: dashboardData.monthlyDistribution.slice(0, 6).map((item) => item.shares).reverse(),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity
          onPress={() => router.push('/adminpages/AdminDashboard')}
        >AdminDashboard</TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/adminpages/ManageAnnouncements')}
        >Manage Announcements</TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/adminpages/ManageMembers')}
        >Manage Members</TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/adminpages/ManageShares')}
        >Manage Shares</TouchableOpacity>
        <View style={styles.cardsContainer}>
          <DashboardCard title="Members" value={dashboardData.totalMembers} />
          <DashboardCard title="Pending Approvals" value={dashboardData.pendingApprovals} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Monthly Share Distribution</Text>
          {dashboardData.monthlyDistribution.length > 0 ? (
            <LineChart
              data={monthlyData}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No monthly data available</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderMemberDashboard = () => {
    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <view>
          <TouchableOpacity onPress={() => router.push('/memberpages/MemberDashboard')}>
            <Text>MemberDashboard</Text>
          </TouchableOpacity>
        </view>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Shares</Text>
          <Text style={styles.cardValue}>{dashboardData.memberShares}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {dashboardData.announcements.length > 0 ? (
            dashboardData.announcements.map((announcement, index) => (
              <Text key={index} style={styles.announcementText}>
                {announcement.message}
              </Text>
            ))
          ) : (
            <Text style={styles.noDataText}>No announcements available</Text>
          )}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === 'admin' ? 'Admin Dashboard' : 'Member Dashboard'}
        </Text>
      </View>
      {user?.role === 'admin' ? renderAdminDashboard() : renderMemberDashboard()}
    </SafeAreaView>
  );
};

const DashboardCard = ({ title, value }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 10,
    marginVertical: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  announcementText: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 10,
  },
});

export default Dashboard;