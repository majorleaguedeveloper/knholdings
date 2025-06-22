import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import AuthContext from '../../contexts/Authcontext';
import axios from 'axios';

const { width } = Dimensions.get('window');

const AdminSharesScreen = () => {
  const { userToken } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [monthlyShares, setMonthlyShares] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  const API_BASE_URL = 'https://knholdingsbackend.onrender.com/api/shares';

  // Generate years array (current year - 5 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  const months = [
    { label: 'January', value: 1 },
    { label: 'February', value: 2 },
    { label: 'March', value: 3 },
    { label: 'April', value: 4 },
    { label: 'May', value: 5 },
    { label: 'June', value: 6 },
    { label: 'July', value: 7 },
    { label: 'August', value: 8 },
    { label: 'September', value: 9 },
    { label: 'October', value: 10 },
    { label: 'November', value: 11 },
    { label: 'December', value: 12 }
  ];

  // Fetch share statistics from API
  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Failed to fetch share stats:', error.message);
      Alert.alert('Error', 'Failed to load share statistics. Please try again.');
    }
  };

  // Fetch available months
  const fetchAvailableMonths = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/available-months`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (data.success) {
        setAvailableMonths(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch available months:', error.message);
    }
  };

  // Fetch shares by month
  const fetchMonthlyShares = async (month = selectedMonth, year = selectedYear) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/monthly/${month}/${year}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (data.success) {
        setMonthlyShares(data.data);
      } else {
        throw new Error(data.message || 'Failed to load monthly shares');
      }
    } catch (error) {
      console.error('Failed to fetch monthly shares:', error.message);
      Alert.alert('Error', 'Failed to load monthly shares. Please try again.');
      setMonthlyShares(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAvailableMonths(),
        fetchMonthlyShares()
      ]);
      setLoading(false);
    };
    initializeData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'overview') {
      await fetchStats();
    } else {
      await fetchMonthlyShares();
    }
    setRefreshing(false);
  };

  const handleDateChange = () => {
    setShowMonthPicker(false);
    fetchMonthlyShares(selectedMonth, selectedYear);
  };

  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const getMonthName = (monthNum) => months.find(m => m.value === monthNum)?.label || 'Unknown';

  // --- Redesigned Card Components ---
  const renderSummaryCards = () => (
    <View style={styles.summaryGrid}>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#e0e7ff', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="pie-chart" size={28} color="#4158D0" />
        <Text style={styles.summaryValue}>{stats?.totalShares || 0}</Text>
        <Text style={styles.summaryLabel}>Total Shares</Text>
      </Animated.View>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#d1fae5', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="cash" size={28} color="#059669" />
        <Text style={styles.summaryValue}>{formatCurrency(stats?.totalValue)}</Text>
        <Text style={styles.summaryLabel}>Total Purchase Value</Text>
      </Animated.View>
    </View>
  );

  const renderMonthlyDistribution = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Monthly Distributions (This Year)</Text>
      <FlatList
        data={stats?.monthlyDistribution}
        renderItem={renderMonthlyItem}
        keyExtractor={(item, idx) => `${item.month}_${idx}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        ListEmptyComponent={<Text style={styles.emptyText}>No monthly data available</Text>}
      />
    </View>
  );

  const renderTopMembers = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Shareholders</Text>
      <FlatList
        data={stats?.topMembers}
        renderItem={renderTopMember}
        keyExtractor={(item, idx) => `${item._id}_${idx}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No top members available</Text>}
      />
    </View>
  );

  const renderOverviewContent = () => (
    <>
      {renderSummaryCards()}
      {renderMonthlyDistribution()}
      {renderTopMembers()}
    </>
  );

  const renderMonthlyStatsCards = () => (
    <View style={styles.summaryGrid}>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#fef9c3', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="trending-up" size={28} color="#eab308" />
        <Text style={styles.summaryValue}>{monthlyShares?.statistics?.totalShares || 0}</Text>
        <Text style={styles.summaryLabel}>Shares Sold</Text>
      </Animated.View>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#bbf7d0', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="wallet" size={28} color="#059669" />
        <Text style={styles.summaryValue}>{formatCurrency(monthlyShares?.statistics?.totalValue)}</Text>
        <Text style={styles.summaryLabel}>Total Revenue</Text>
      </Animated.View>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#f3e8ff', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="people" size={28} color="#a21caf" />
        <Text style={styles.summaryValue}>{monthlyShares?.statistics?.transactionCount || 0}</Text>
        <Text style={styles.summaryLabel}>Transactions</Text>
      </Animated.View>
      <Animated.View style={[styles.summaryCard, styles.cardShadow, { backgroundColor: '#fee2e2', transform: [{ scale: fadeAnim }] }]}> 
        <Ionicons name="calculator" size={28} color="#dc2626" />
        <Text style={styles.summaryValue}>{formatCurrency(monthlyShares?.statistics?.averagePrice)}</Text>
        <Text style={styles.summaryLabel}>Avg. Price</Text>
      </Animated.View>
    </View>
  );

  const renderTopContributors = () => (
    monthlyShares?.topContributors?.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Contributors This Month</Text>
        <FlatList
          data={monthlyShares.topContributors}
          renderItem={renderTopContributor}
          keyExtractor={(item) => item._id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    )
  );

  const renderShareTransactions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share Transactions</Text>
      <FlatList
        data={monthlyShares?.shares}
        renderItem={renderShareTransaction}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>No transactions found for this month</Text>
          </View>
        }
      />
    </View>
  );

  const renderMonthlyContent = () => (
    <>
      {/* Date Picker Header */}
      <View style={styles.pickerHeader}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowMonthPicker(true)}
        >
          <Ionicons name="calendar" size={20} color="#4158D0" />
          <Text style={styles.datePickerText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#4158D0" />
        </TouchableOpacity>
      </View>
      {renderMonthlyStatsCards()}
      {renderTopContributors()}
      {renderShareTransactions()}
    </>
  );

  // --- Redesigned List Items ---
  const renderMonthlyItem = ({ item }) => (
    <View style={styles.monthlyCard}>
      <Text style={styles.monthlyMonth}>{item.month || 'Unknown'}</Text>
      <View style={styles.monthlyStats}>
        <Text style={styles.monthlyValue}>{item.shares} shares</Text>
        <Text style={styles.monthlyAmount}>{formatCurrency(item.value)}</Text>
      </View>
    </View>
  );

  const renderTopMember = ({ item, index }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name || 'Unknown'}</Text>
          <Text style={styles.memberEmail}>{item.email || 'N/A'}</Text>
        </View>
      </View>
      <View style={styles.memberStats}>
        <Text style={styles.memberShares}>{item.totalShares} shares</Text>
      </View>
    </View>
  );

  const renderTopContributor = ({ item, index }) => (
    <View style={styles.contributorCard}>
      <View style={styles.contributorHeader}>
        <Text style={styles.contributorName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.contributorRank}>#{index + 1}</Text>
      </View>
      <View style={styles.contributorStats}>
        <Text style={styles.contributorShares}>Shares:  {item.totalShares}</Text>
        <Text style={styles.contributorAmount}>{formatCurrency(item.totalAmount)}</Text>
        <Text style={styles.contributorTransactions}>{item.transactionCount} transactions</Text>
      </View>
    </View>
  );

  const renderShareTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionUser}>
          <Text style={styles.transactionName}>{item.user?.name || 'Unknown User'}</Text>
          <Text style={styles.transactionEmail}>{item.user?.email || 'N/A'}</Text>
        </View>
        <Text style={styles.transactionDate}>{formatDate(item.purchaseDate)}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Shares:</Text>
          <Text style={styles.transactionValue}>{item.quantity}</Text>
        </View>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Price per Share:</Text>
          <Text style={styles.transactionValue}>{formatCurrency(item.pricePerShare)}</Text>
        </View>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Total Amount:</Text>
          <Text style={styles.transactionHighlight}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Payment Method:</Text>
          <Text style={styles.transactionPayment}>{item.paymentMethod}</Text>
        </View>
      </View>
      {item.notes && (
        <View style={styles.transactionNotes}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  // --- Main Render ---
  if (!fontsLoaded || (loading && !refreshing)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B72F2" />
        <Text style={styles.loadingText}>Loading share data...</Text>
      </View>
    );
  }

  // --- Tab Data for FlatList ---
  const tabData = [
    { key: 'overview', render: renderOverviewContent },
    { key: 'monthly', render: renderMonthlyContent },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#4158D0", "#5B72F2", "#6985FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Shares</Text>
            <Text style={styles.headerSubtitle}>Monitor and track share distribution</Text>
          </View>
        </View>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Ionicons
              name="analytics"
              size={20}
              color={activeTab === 'overview' ? '#FFF' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
            onPress={() => setActiveTab('monthly')}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={activeTab === 'monthly' ? '#FFF' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
              Monthly View
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* Main Content as FlatList to avoid nested VirtualizedLists */}
      <FlatList
        data={tabData.filter(tab => tab.key === activeTab)}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <View style={styles.content}>{item.render()}</View>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month & Year</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Month</Text>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={setSelectedMonth}
                  style={styles.picker}
                >
                  {months.map((month) => (
                    <Picker.Item
                      key={month.value}
                      label={month.label}
                      value={month.value}
                    />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Year</Text>
                <Picker
                  selectedValue={selectedYear}
                  onValueChange={setSelectedYear}
                  style={styles.picker}
                >
                  {years.map((year) => (
                    <Picker.Item
                      key={year}
                      label={year.toString()}
                      value={year}
                    />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleDateChange}>
              <Text style={styles.confirmButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 80,
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#5B72F2',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabText: {
    marginLeft: 8,
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
  },
  content: {
    flex: 1,
    paddingTop: 15,
    paddingBottom: 30,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    minWidth: (width - 56) / 2,
    flex: 1,
    marginBottom: 8,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  summaryValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#2D3748',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  summaryLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 19,
    color: '#2D3748',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  monthlyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: width * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyMonth: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#5B72F2',
    marginBottom: 12,
  },
  monthlyStats: {
  },
  monthlyValue: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    marginBottom: 4,
  },
  monthlyAmount: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#2ECC71',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    backgroundColor: '#5B72F2',
    borderRadius: 12,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontFamily: 'Outfit_700Bold',
    color: 'white',
    fontSize: 14,
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
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  memberShares: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    marginTop: 8,
  },
  contributorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginRight: 12,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contributorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contributorName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  contributorRank: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    color: '#3498db',
    backgroundColor: '#ebf3fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contributorStats: {
    gap: 4,
  },
  contributorShares: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
  },
  contributorAmount: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
  },
  contributorTransactions: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#7f8c8d',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionUser: {
    flex: 1,
  },
  transactionName: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#2c3e50',
  },
  transactionEmail: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  transactionDate: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: '#3498db',
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#7f8c8d',
  },
  transactionValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#2c3e50',
  },
  transactionHighlight: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
  },
  transactionPayment: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#9b59b6',
    textTransform: 'capitalize',
  },
  transactionNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  notesLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#2c3e50',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    height: 150,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: '#4158D0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4158D0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontFamily: 'Outfit_700Bold',
    color: 'white',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 2,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#4158D0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#4158D0',
    marginHorizontal: 8,
  },
  horizontalList: {
    paddingBottom: 8,
  },
});

export default AdminSharesScreen;