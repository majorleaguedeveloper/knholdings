import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../apiConfig';
import { StatusBar } from 'expo-status-bar';
import AuthContext from '../../contexts/Authcontext';

const AdminSharesScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/shares/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Failed to fetch share stats:', error.message);
      Alert.alert('Error', 'Failed to load share statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const renderMonthlyItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.memberName}>{item.month || 'Unknown Month'}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Shares:</Text>
          <Text style={styles.value}>{item.shares}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Value:</Text>
          <Text style={styles.valueHighlighted}>{formatCurrency(item.value)}</Text>
        </View>
      </View>
    </View>
  );

  const renderTopMember = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>{item.name || 'Unknown'}</Text>
          <Text style={styles.date}>Rank #{index + 1}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{item.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Total Shares:</Text>
          <Text style={styles.valueHighlighted}>{item.totalShares}</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading share statistics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
        <Text style={styles.loadingText}>No statistics available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar style="dark" />
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Shares:</Text>
          <Text style={styles.summaryValue}>{stats.totalShares}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(stats.totalValue)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Monthly Distribution (Last 12 Months)</Text>
      <FlatList
        data={stats.monthlyDistribution}
        renderItem={renderMonthlyItem}
        keyExtractor={(item, idx) => item.month?.toString() + idx}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No monthly data</Text>}
      />

      <Text style={styles.sectionTitle}>Top Members by Shares</Text>
      <FlatList
        data={stats.topMembers}
        renderItem={renderTopMember}
        keyExtractor={(item, idx) => item._id?.toString() + idx}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No top members</Text>}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
  },
  card: {
    marginBottom: 16,
    marginRight: 12,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 220,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  valueHighlighted: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    margin: 16,
  },
});

export default AdminSharesScreen;