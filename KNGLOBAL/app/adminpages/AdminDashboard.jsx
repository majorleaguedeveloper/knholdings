import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    pendingApprovals: 0,
    totalShares: 0,
    announcements: [],
  });
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [membersRes, sharesRes, announcementsRes] = await Promise.all([
        axios.get('http://192.168.108.159:5000/api/admin/members'),
        axios.get('http://192.168.108.159:5000/api/admin/shares'),
        axios.get('http://192.168.108.159:5000/api/admin/announcements'),
      ]);

      setDashboardData({
        totalMembers: membersRes.data.count,
        pendingApprovals: membersRes.data.data.filter((m) => m.status === 'pending').length,
        totalShares: sharesRes.data.count,
        announcements: announcementsRes.data.data.slice(0, 5), // Show latest 5 announcements
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View>
        <Text>Total Members: {dashboardData.totalMembers}</Text>
        <Text>Pending Approvals: {dashboardData.pendingApprovals}</Text>
        <Text>Total Shares: {dashboardData.totalShares}</Text>
      </View>

      <View>
        <Text>Recent Announcements:</Text>
        {dashboardData.announcements.map((announcement, index) => (
          <Text key={index}>{announcement.title}</Text>
        ))}
      </View>

      <TouchableOpacity onPress={() => router.push('/adminpages/ManageMembers')}>
        <Text>Manage Members</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/adminpages/ManageShares')}>
        <Text>Manage Shares</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/adminpages/ManageAnnouncements')}>
        <Text>Manage Announcements</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AdminDashboard;