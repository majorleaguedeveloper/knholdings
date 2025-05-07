import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AuthContext from '../../contexts/Authcontext'; // Adjust the path if necessary
import axios from 'axios';
import { useRouter } from 'expo-router';

const MemberDashboard = () => {
  const { userToken } = useContext(AuthContext); // Assuming you have user data in context
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    totalShares: 0,
    sharesList: [],
    announcements: [],
    monthlyShares: []
  });
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log(userToken);
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const [profileRes, sharesRes, announcementsRes, monthlySharesRes] = await Promise.all([
        axios.get('http://192.168.45.159:5000/api/member/profile', config),
        axios.get('http://192.168.45.159:5000/api/member/shares', config),
        axios.get('http://192.168.45.159:5000/api/member/announcements', config),
        axios.get('http://192.168.45.159:5000/api/member/shares/monthly', config)
      ]);

      setDashboardData({
        profile: profileRes.data.data,
        totalShares: sharesRes.data.totalShares,
        sharesList: sharesRes.data.data.slice(0, 5), // Show latest 5 share purchases
        announcements: announcementsRes.data.data.slice(0, 3), // Show latest 3 announcements
        monthlyShares: monthlySharesRes.data.data.slice(0, 6) // Show latest 6 months
      });
    } catch (error) {
      console.error('Error fetching member dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading Member Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      {/* Member Profile Overview */}
      <View>
        <Text>Welcome, {dashboardData.profile?.name}</Text>
        <Text>Email: {dashboardData.profile?.email}</Text>
        <Text>Phone: {dashboardData.profile?.phone || 'Not provided'}</Text>
        <Text>Member Since: {new Date(dashboardData.profile?.createdAt).toLocaleDateString()}</Text>
      </View>

      {/* Shares Summary */}
      <View>
        <Text>Your Shares</Text>
        <Text>Total Shares: {dashboardData.totalShares}</Text>
        
        <Text>Recent Purchases:</Text>
        {dashboardData.sharesList.length > 0 ? (
          dashboardData.sharesList.map((share, index) => (
            <View key={index}>
              <Text>
                {new Date(share.purchaseDate).toLocaleDateString()} - {share.quantity} shares 
                (${share.pricePerShare} per share)
              </Text>
            </View>
          ))
        ) : (
          <Text>No recent share purchases</Text>
        )}
      </View>

      {/* Monthly Share Summary */}
      <View>
        <Text>Monthly Share Summary:</Text>
        {dashboardData.monthlyShares.length > 0 ? (
          dashboardData.monthlyShares.map((monthData, index) => (
            <View key={index}>
              <Text>
                {monthData.month}: {monthData.totalShares} shares (${monthData.totalAmount.toFixed(2)})
              </Text>
            </View>
          ))
        ) : (
          <Text>No monthly share data available</Text>
        )}
      </View>

      {/* Announcements */}
      <View>
        <Text>Announcements:</Text>
        {dashboardData.announcements.length > 0 ? (
          dashboardData.announcements.map((announcement, index) => (
            <View key={index}>
              <Text>{announcement.title}</Text>
              <Text>{announcement.content}</Text>
              <Text>Posted: {new Date(announcement.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <Text>No announcements available</Text>
        )}
      </View>

      {/* Navigation Actions */}
      <TouchableOpacity onPress={() => router.push('/memberpages/UpdateProfile')}>
        <Text>Update Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/memberpages/ShareHistory')}>
        <Text>View Share History</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/memberpages/AllAnnouncements')}>
        <Text>View All Announcements</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MemberDashboard;