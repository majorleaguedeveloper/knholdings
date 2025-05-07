import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';

const ShareHistory = () => {
  const { userToken } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState({
    totalShares: 0,
    shares: [],
    monthlyShares: []
  });
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'monthly'

  useEffect(() => {
    fetchShareData();
  }, []);

  const fetchShareData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      };
      
      const [sharesRes, monthlySharesRes] = await Promise.all([
        axios.get('http://192.168.45.159:5000/api/member/shares', config),
        axios.get('http://192.168.45.159:5000/api/member/shares/monthly', config)
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
    }
  };

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
        <Text style={styles.shareDate}>{formatDate(item.purchaseDate)}</Text>
        <View style={styles.shareQtyPrice}>
          <Text style={styles.shareQuantity}>{item.quantity} {item.quantity === 1 ? 'share' : 'shares'}</Text>
          <Text style={styles.sharePrice}>@ {formatCurrency(item.pricePerShare)}</Text>
        </View>
      </View>
      
      <View style={styles.shareDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}</Text>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMonthlyItem = ({ item }) => (
    <View style={styles.monthlyItem}>
      <View style={styles.monthlyHeader}>
        <Text style={styles.monthlyTitle}>{formatMonthYear(item.month)}</Text>
        <Text style={styles.monthlyShares}>{item.totalShares} {item.totalShares === 1 ? 'share' : 'shares'}</Text>
      </View>
      
      <View style={styles.monthlyTotal}>
        <Text style={styles.monthlyTotalLabel}>Total Investment:</Text>
        <Text style={styles.monthlyTotalValue}>{formatCurrency(item.totalAmount)}</Text>
      </View>
      
      <View style={styles.monthlyDetails}>
        <Text style={styles.monthlyDetailsTitle}>Purchases:</Text>
        {item.purchases.map((purchase, index) => (
          <View key={index} style={styles.purchaseItem}>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading share history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share History</Text>
      </View>
      
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Total Shares</Text>
        <Text style={styles.summaryValue}>{shareData.totalShares}</Text>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Purchases</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
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
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No share purchases found.</Text>
          </View>
        )
      ) : (
        shareData.monthlyShares.length > 0 ? (
          <FlatList
            data={shareData.monthlyShares}
            renderItem={renderMonthlyItem}
            keyExtractor={(item) => item.month}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No monthly share data available.</Text>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4b5563',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#4f46e5',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  shareItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  shareDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  shareQtyPrice: {
    alignItems: 'flex-end',
  },
  shareQuantity: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sharePrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  shareDetails: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  monthlyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111827',
  },
  monthlyShares: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
  },
  monthlyTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  monthlyTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  monthlyTotalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  monthlyDetails: {},
  monthlyDetailsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 10,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  purchaseDate: {
    fontSize: 14,
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
    color: '#111827',
    marginRight: 6,
  },
  purchasePrice: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 6,
  },
  purchaseTotal: {
    fontSize: 14,
    fontWeight: '500',
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
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default ShareHistory;