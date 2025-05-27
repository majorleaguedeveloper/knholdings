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
  TextInput,
  Platform
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import AuthContext from '../../contexts/Authcontext';
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  MaterialIcons, 
  FontAwesome5,
  AntDesign,
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
import { API_BASE_URL } from '../apiConfig';

const MemberRankings = () => {
  const { userToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalShares, setTotalShares] = useState(0);
  const [totalShareValue, setTotalShareValue] = useState(0);
  const [sharePrice, setSharePrice] = useState(10);
  const router = useRouter();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold
  });

  // Fetch member rankings and share stats in the same style as AdminSharesScreen
  const fetchMemberRankings = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Fetch all members
      const membersRes = await axios.get(`${API_BASE_URL}/admin/members`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // Fetch share stats (topMembers contains correct individual shares)
      const sharesStatsRes = await axios.get(`${API_BASE_URL}/shares/stats`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const membersData = membersRes.data;
      const sharesStatsData = sharesStatsRes.data;
      if (membersData.success && sharesStatsData.success) {
        const allMembers = membersData.data || [];
        const sharesData = sharesStatsData.data || {};
        const topMembers = sharesData.topMembers || [];
        const currentSharePrice = sharesData.sharePrice || 10;
        setSharePrice(currentSharePrice);
        setTotalShares(sharesData.totalShares || 0);
        setTotalShareValue(sharesData.totalValue || 0);
        // Map topMembers by _id (not id) for correct matching
        const topMembersMap = new Map();
        topMembers.forEach(member => {
          if (member && member._id) {
            topMembersMap.set(member._id, member);
          }
        });
        // Merge topMembers data into allMembers by _id
        const membersList = allMembers.map(member => {
          const topMemberData = topMembersMap.get(member._id);
          const shares = topMemberData ? topMemberData.totalShares : 0;
          return {
            ...member,
            totalShares: shares,
            totalValue: shares * currentSharePrice
          };
        });
        membersList.sort((a, b) => b.totalShares - a.totalShares);
        setMembers(membersList);
      } else {
        throw new Error('Failed to load member or share stats');
      }
    } catch (error) {
      if (error.response) {
        console.error('Error fetching member rankings:', error.response.status, error.response.data);
      } else {
        console.error('Error fetching member rankings:', error.message);
      }
      setMembers([]);
      setTotalShares(0);
      setTotalShareValue(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (userToken) fetchMemberRankings();
  }, [userToken, fetchMemberRankings]);

  const onRefresh = useCallback(() => {
    fetchMemberRankings();
  }, [fetchMemberRankings]);

  // Function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Function to filter and sort members
  const getFilteredMembers = () => {
    // First apply search filter
    let filteredList = members;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredList = members.filter(member => 
        member.name?.toLowerCase().includes(query) || 
        member.email?.toLowerCase().includes(query)
      );
    }
    
    // Then apply count filter
    if (filter === 'top10') {
      filteredList = filteredList.slice(0, 10);
    } else if (filter === 'top25') {
      filteredList = filteredList.slice(0, 25);
    } else if (filter === 'top50') {
      filteredList = filteredList.slice(0, 50);
    }
    
    // Sort based on shares count
    if (sortOrder === 'asc') {
      return [...filteredList].sort((a, b) => a.totalShares - b.totalShares);
    } else {
      return [...filteredList].sort((a, b) => b.totalShares - a.totalShares);
    }
  };

  // Get the filtered and sorted list
  const filteredMembers = getFilteredMembers();

  // Award badge based on rank
  const getRankBadge = (index) => {
    if (sortOrder === 'desc') {
      if (index === 0) return { style: styles.firstRank, icon: 'trophy', color: '#FFD700' };
      if (index === 1) return { style: styles.secondRank, icon: 'trophy', color: '#C0C0C0' };
      if (index === 2) return { style: styles.thirdRank, icon: 'trophy', color: '#CD7F32' };
      if (index < 10) return { style: styles.topTenRank, icon: 'star', color: '#FFFFFF' };
    }
    return { style: styles.regularRank, icon: 'user', color: '#FFFFFF' };
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B72F2" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B72F2" />
        <Text style={styles.loadingText}>Loading member rankings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with background gradient */}
      <LinearGradient
        colors={['#4158D0', '#5B72F2', '#6985FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Member Rankings</Text>
            <Text style={styles.headerSubtitle}>{members.length} Members</Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <MaterialIcons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Summary Stats Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <FontAwesome5 name="trophy" size={20} color="#FFD700" style={styles.summaryIcon} />
          <View>
            <Text style={styles.summaryTitle}>Top Member</Text>
            <Text style={styles.summaryValue}>
              {members.length > 0 ? members[0]?.name || 'N/A' : 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryCard}>
          <MaterialCommunityIcons name="file-document-multiple" size={20} color="#5B72F2" style={styles.summaryIcon} />
          <View>
            <Text style={styles.summaryTitle}>Total Shares</Text>
            <Text style={styles.summaryValue}>
              {totalShares.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Share Value Card */}
      <View style={styles.valueCardContainer}>
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
              <Text style={styles.valueCardAmount}>{formatCurrency(totalShareValue)}</Text>
            </View>
          </View>
          
        </LinearGradient>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A0AEC0"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#A0AEC0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'all' && styles.activeFilterPill]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All Members</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'top10' && styles.activeFilterPill]}
            onPress={() => setFilter('top10')}
          >
            <Text style={[styles.filterText, filter === 'top10' && styles.activeFilterText]}>Top 10</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'top25' && styles.activeFilterPill]}
            onPress={() => setFilter('top25')}
          >
            <Text style={[styles.filterText, filter === 'top25' && styles.activeFilterText]}>Top 25</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterPill, filter === 'top50' && styles.activeFilterPill]}
            onPress={() => setFilter('top50')}
          >
            <Text style={[styles.filterText, filter === 'top50' && styles.activeFilterText]}>Top 50</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortPill, sortOrder === 'desc' ? styles.activeDescSort : styles.activeAscSort]}
            onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            <Text style={styles.sortText}>Sort</Text>
            {sortOrder === 'desc' ? (
              <AntDesign name="arrowdown" size={14} color="#FFF" />
            ) : (
              <AntDesign name="arrowup" size={14} color="#FFF" />
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Member Rankings List */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5B72F2']}
            tintColor="#5B72F2"
          />
        }
      >
        <View style={styles.rankingsContainer}>
          {filteredMembers.length > 0 ? (
            <>
              <View style={styles.tableHeader}>
                <Text style={styles.rankHeaderText}>Rank</Text>
                <Text style={styles.nameHeaderText}>Member</Text>
                <Text style={styles.sharesHeaderText}>Shares</Text>
                <Text style={styles.valueHeaderText}>Value</Text>
              </View>
              
              {filteredMembers.map((member, index) => {
                const rankBadge = getRankBadge(index);
                
                return (
                  <TouchableOpacity 
                    key={member.id || index} 
                    style={styles.memberItem}
                  >
                    <View style={[styles.rankBadge, rankBadge.style]}>
                      {sortOrder === 'desc' && index < 3 ? (
                        <FontAwesome5 name={rankBadge.icon} size={14} color={rankBadge.color} />
                      ) : (
                        <Text style={styles.rankText}>{index + 1}</Text>
                      )}
                    </View>
                    
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>{member.name || 'Unknown'}</Text>
                      <Text style={styles.memberEmail} numberOfLines={1}>{member.email || 'No email'}</Text>
                    </View>
                    
                    <View style={styles.sharesContainer}>
                      <Text style={styles.sharesValue}>{member.totalShares.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.valueContainer}>
                      <Text style={styles.shareValue}>{formatCurrency(member.totalValue)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Feather name="search" size={50} color="#CBD5E0" />
              <Text style={styles.noResultsText}>No members found</Text>
              <Text style={styles.noResultsSubtext}>Try adjusting your search criteria</Text>
            </View>
          )}
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
    color: '#5B72F2',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
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
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 15,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryIcon: {
    marginRight: 12,
  },
  summaryTitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#718096',
  },
  summaryValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#2D3748',
  },
  valueCardContainer: {
    marginHorizontal: 16,
    marginBottom: 15,
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
  shareInfoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  shareInfoText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#2D3748',
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    marginRight: 10,
  },
  activeFilterPill: {
    backgroundColor: '#5B72F2',
  },
  filterText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#718096',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 5,
  },
  activeDescSort: {
    backgroundColor: '#FF6B6B',
  },
  activeAscSort: {
    backgroundColor: '#4CD964',
  },
  sortText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  rankingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  rankHeaderText: {
    width: 50,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  nameHeaderText: {
    flex: 1,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#718096',
  },
  sharesHeaderText: {
    width: 60,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  valueHeaderText: {
    width: 80,
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#718096',
    textAlign: 'right',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  topTenRank: {
    backgroundColor: '#5B72F2',
  },
  regularRank: {
    backgroundColor: '#CBD5E0',
  },
  rankText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
    marginRight: 5,
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
  },
  sharesContainer: {
    width: 60,
    alignItems: 'center',
  },
  sharesValue: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#5B72F2',
  },
  valueContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  shareValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
    color: '#2D3748',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
    color: '#2D3748',
    marginTop: 15,
  },
  noResultsSubtext: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#718096',
    marginTop: 5,
  },
  footer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 16,
    color: '#5B72F2',
  },
  copyrightText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
});

export default MemberRankings;