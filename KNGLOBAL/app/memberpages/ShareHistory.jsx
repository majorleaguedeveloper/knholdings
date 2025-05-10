import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5 
} from '@expo/vector-icons';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';

const ShareHistory = () => {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shareData, setShareData] = useState({
    totalShares: 0,
    shares: [],
    monthlyShares: []
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monthly'

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  const fetchShareData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const [sharesRes, monthlySharesRes] = await Promise.all([
        axios.get('http://192.168.176.253:5000/api/member/shares', config),
        axios.get('http://192.168.176.253:5000/api/member/shares/monthly', config)
      ]);

      setShareData({
        totalShares: sharesRes.data.totalShares,
        shares: sharesRes.data.data,
        monthlyShares: monthlySharesRes.data.data
      });
    } catch (error) {
      console.error('Error fetching share data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchShareData();
  }, []);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchShareData();
      return () => {};
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShareData();
  }, []);

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatMonthYear = (monthStr) => {
    if (!monthStr) return 'Unknown';
    
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const renderShareItem = ({ item }) => (
    <View style={styles.shareItem}>
      <View style={styles.shareHeader}>
        <View style={styles.shareDateContainer}>
          <MaterialCommunityIcons name="calendar-month" size={18} color="#4f46e5" style={styles.icon} />
          <Text style={styles.shareDate}>{formatDate(item.purchaseDate)}</Text>
        </View>
        <View style={styles.shareQtyPrice}>
          <Text style={styles.shareQuantity}>{item.quantity} {item.quantity === 1 ? 'share' : 'shares'}</Text>
          <Text style={styles.sharePrice}>@ {formatCurrency(item.pricePerShare)}</Text>
        </View>
      </View>
      
      <View style={styles.shareDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            <FontAwesome5 name="money-bill-wave" size={14} color="#6b7280" style={styles.detailIcon} /> Total Amount:
          </Text>
          <Text style={styles.detailValue}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            <FontAwesome5 name="credit-card" size={14} color="#6b7280" style={styles.detailIcon} /> Payment Method:
          </Text>
          <Text style={styles.detailValue}>{item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}</Text>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>
              <MaterialCommunityIcons name="note-text-outline" size={16} color="#111827" style={styles.notesIcon} /> Notes:
            </Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMonthlyItem = ({ item }) => (
    <View style={styles.monthlyItem}>
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleContainer}>
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#4f46e5" style={styles.monthlyIcon} />
          <Text style={styles.monthlyTitle}>{formatMonthYear(item.month)}</Text>
        </View>
        <View style={styles.monthlySharesContainer}>
          <MaterialCommunityIcons name="chart-timeline-variant" size={18} color="#4f46e5" style={styles.sharesIcon} />
          <Text style={styles.monthlyShares}>{item.totalShares} {item.totalShares === 1 ? 'share' : 'shares'}</Text>
        </View>
      </View>
      
      <View style={styles.monthlyTotal}>
        <Text style={styles.monthlyTotalLabel}>
          <FontAwesome5 name="money-bill-alt" size={14} color="#4b5563" /> Total Investment:
        </Text>
        <Text style={styles.monthlyTotalValue}>{formatCurrency(item.totalAmount)}</Text>
      </View>
      
      <View style={styles.monthlyDetails}>
        <View style={styles.monthlyDetailsTitleRow}>
          <MaterialCommunityIcons name="file-document-outline" size={18} color="#111827" />
          <Text style={styles.monthlyDetailsTitle}>Purchase History</Text>
        </View>
        {item.purchases.map((purchase, index) => (
          <View key={index} style={[
            styles.purchaseItem, 
            index === item.purchases.length - 1 && styles.lastPurchaseItem
          ]}>
            <Text style={styles.purchaseDate}>{formatDate(purchase.purchaseDate)}</Text>
            <View style={styles.purchaseDetails}>
              <Text style={styles.purchaseQty}>{purchase.quantity} {purchase.quantity === 1 ? 'share' : 'shares'}</Text>
              <Text style={styles.purchasePrice}>@ {formatCurrency(purchase.pricePerShare)}</Text>
              <Text style={styles.purchaseTotal}>= {formatCurrency(purchase.totalAmount)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={[styles.loadingText, {fontFamily: 'System'}]}>Loading fonts...</Text>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading share history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share History</Text>
      </View>
      
      <View style={styles.summary}>
        <View style={styles.summaryIconContainer}>
          <MaterialCommunityIcons name="chart-pie" size={28} color="#4f46e5" />
        </View>
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryTitle}>Total Shares</Text>
          <Text style={styles.summaryValue}>{shareData.totalShares}</Text>
        </View>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <MaterialCommunityIcons 
            name="format-list-bulleted" 
            size={18} 
            color={activeTab === 'all' ? "#4f46e5" : "#6b7280"} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <MaterialCommunityIcons 
            name="calendar-month-outline" 
            size={18} 
            color={activeTab === 'monthly' ? "#4f46e5" : "#6b7280"} 
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>Monthly Summary</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'all' ? (
        shareData.shares.length > 0 ? (
          <FlatList
            data={shareData.shares}
            renderItem={renderShareItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="information-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No share purchases found.</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        shareData.monthlyShares.length > 0 ? (
          <FlatList
            data={shareData.monthlyShares}
            renderItem={renderMonthlyItem}
            keyExtractor={(item) => item.month}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4f46e5"]} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-alert" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No monthly share data available.</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
    fontFamily: 'Outfit_400Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontFamily: 'Outfit_500Medium',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: 'Outfit_400Regular',
  },
  summaryValue: {
    fontSize: 28,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4f46e5',
    fontFamily: 'Outfit_600SemiBold',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  shareItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shareDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  shareDate: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    color: '#111827',
  },
  shareQtyPrice: {
    alignItems: 'flex-end',
  },
  shareQuantity: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  sharePrice: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6b7280',
    marginTop: 2,
  },
  shareDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#111827',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#111827',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesIcon: {
    marginRight: 6,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#4b5563',
    fontStyle: 'italic',
  },
  monthlyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'center',
  },
  monthlyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyIcon: {
    marginRight: 8,
  },
  monthlyTitle: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  monthlySharesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sharesIcon: {
    marginRight: 4,
  },
  monthlyShares: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4f46e5',
  },
  monthlyTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  monthlyTotalLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#4b5563',
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyTotalValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  monthlyDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  monthlyDetailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthlyDetailsTitle: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginLeft: 6,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  lastPurchaseItem: {
    borderBottomWidth: 0,
  },
  purchaseDate: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#4b5563',
    flex: 1,
  },
  purchaseDetails: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  },
  purchaseQty: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#111827',
    marginRight: 6,
  },
  purchasePrice: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6b7280',
    marginRight: 6,
  },
  purchaseTotal: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    marginLeft: 6,
  }
});

export default ShareHistory;