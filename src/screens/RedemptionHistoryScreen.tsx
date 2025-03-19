import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, horizontalScale, verticalScale } from '../utils/responsiveUtils';
import { CalendarIcon, FilterIcon, SaleTagIcon } from '../components/icons';
import ApiService from '../services/ApiService';
import Skeleton from '../components/SkeletonLoader';
import { MotiView } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';


type RedemptionHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RedemptionHistory'>;

interface RedemptionHistoryScreenProps {
  navigation: RedemptionHistoryScreenNavigationProp;
}

// Redemption interface based on backend model
interface Redemption {
  _id: string;
  studentId: string;
  discountId: {
    _id: string;
    title: string;
    description: string;
    discountType: string;
    merchantName?: string;
    discountpercentage: number;
  };
  redemptionCode: string;
  redemptionDate: string;
  isRedeemed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Status filter types
type FilterStatus = 'all' | 'active' | 'expired';

const RedemptionHistoryScreen: React.FC<RedemptionHistoryScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [moderateScale(110), moderateScale(70)],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp'
  });
  
  // Load redemption history
  useEffect(() => {
    fetchRedemptionHistory();
  }, [filterStatus]);
  
  // Fetch redemption history from API
  const fetchRedemptionHistory = async () => {
    try {
      setLoading(true);
      
      // Mock studentId for testing or get it from another source
      // This fixes the void return type error
      let studentId: string = 'defaultStudentId';
      try {
        // Try to get user info from AsyncStorage
        const userInfo = await AsyncStorage.getItem('@campusclub:user');
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          if (userData.id) {
            studentId = userData.id;
          }
        }
      } catch (error) {
        console.error('Error getting student ID:', error);
      }
      
      const response = await ApiService.getRedemptionHistory(studentId);
      
      if (response.success && response.data) {
        // Filter based on selected status
        let filteredData = response.data;
        if (filterStatus === 'active') {
          // Active redemptions - those that are within validity period
          const now = new Date();
          filteredData = filteredData.filter((item) =>
            item.isRedeemed && new Date(item.redemptionDate) > now
          );
        } else if (filterStatus === 'expired') {
          // Expired redemptions
          const now = new Date();
          filteredData = filteredData.filter((item) =>
            !item.isRedeemed || new Date(item.redemptionDate) <= now
          );
        }
        
        setRedemptions(filteredData);
      }
    } catch (error) {
      console.error('Error fetching redemption history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRedemptionHistory();
  };
  
  // Toggle filter menu
  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };
  
  // Set filter
  const applyFilter = (status: FilterStatus) => {
    setFilterStatus(status);
    setFilterOpen(false);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Determine if a redemption is still active
  const isRedemptionActive = (redemption: Redemption) => {
    const now = new Date();
    const redemptionDate = new Date(redemption.redemptionDate);
    // Add 30 days as an example expiration period (adjust based on your business logic)
    redemptionDate.setDate(redemptionDate.getDate() + 30);
    return redemption.isRedeemed && redemptionDate > now;
  };

  // Render a single redemption item
  const renderRedemptionItem = ({ item, index }: { item: Redemption, index: number }) => {
    const isActive = isRedemptionActive(item);
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 100 }}
        style={[
          styles.redemptionCard,
          { 
            backgroundColor: colors.card,
            shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
          }
        ]}
      >
        {/* Status badge */}
        <View 
          style={[
            styles.statusBadge,
            { 
              backgroundColor: isActive 
                ? `${colors.success}15` 
                : `${colors.textTertiary}15`
            }
          ]}
        >
          <Text 
            variant="labelSmall" 
            color={isActive ? colors.success : colors.textTertiary}
          >
            {isActive ? 'Active' : 'Expired'}
          </Text>
        </View>
        
        {/* Discount info */}
        <View style={styles.cardHeader}>
          <Text 
            variant="titleMedium" 
            color={colors.text}
            numberOfLines={1}
            style={styles.title}
          >
            {item.discountId.title}
          </Text>
          <Text 
            variant="labelLarge" 
            color={colors.primary}
            style={styles.discountPercent}
          >
            {item.discountId.discountpercentage}% OFF
          </Text>
        </View>
        
        {/* Merchant info if available */}
        {item.discountId.merchantName && (
          <Text 
            variant="bodySmall" 
            color={colors.textSecondary}
            style={styles.merchantName}
          >
            {item.discountId.merchantName}
          </Text>
        )}
        
        {/* Redemption details */}
        <View style={styles.codeContainer}>
          <Text 
            variant="labelSmall" 
            color={colors.textSecondary}
          >
            REDEMPTION CODE
          </Text>
          <Text 
            variant="labelLarge" 
            color={colors.text}
            style={styles.code}
          >
            {item.redemptionCode}
          </Text>
        </View>
        
        {/* Date info */}
        <View style={styles.dateContainer}>
          <CalendarIcon size={14} color={colors.textSecondary} />
          <Text 
            variant="bodySmall" 
            color={colors.textSecondary}
            style={styles.dateText}
          >
            Redeemed on {formatDate(item.redemptionDate)}
          </Text>
        </View>
        
        {/* View Details button */}
        <TouchableOpacity
          style={[
            styles.viewButton,
            { borderColor: colors.primary }
          ]}
          onPress={() => {
            if (isActive) {
              navigation.navigate('ActiveRedemptions', { redemptionId: item._id });
            }
          }}
        >
          <Text 
            variant="labelMedium" 
            color={colors.primary}
          >
            {isActive ? 'View Details' : 'View History'}
          </Text>
        </TouchableOpacity>
      </MotiView>
    );
  };
  
  // Empty state component
  const EmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconContainer,
            { backgroundColor: `${colors.primary}10` }
          ]}
        >
          <SaleTagIcon size={40} color={colors.primary} />
        </View>
        <Text
          variant="titleMedium"
          color={colors.text}
          style={styles.emptyTitle}
        >
          No Redemptions Yet
        </Text>
        <Text
          variant="bodyMedium"
          color={colors.textSecondary}
          style={styles.emptyText}
        >
          When you redeem discounts, they will appear here. Explore available discounts now!
        </Text>
        <TouchableOpacity
          style={[
            styles.exploreButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={() => navigation.navigate('Explore')}
        >
          <Text
            variant="labelMedium"
            color={colors.buttonText}
          >
            Explore Discounts
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const LoadingComponent = () => {
    return (
      <>
        {Array(3).fill(0).map((_, index) => (
          <Skeleton
            key={`skeleton-${index}`}
            style={[
              styles.skeletonCard,
              { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
            ]}
          />
        ))}
      </>
    );
  };
  
  
  // Render filter options
  const renderFilterOptions = () => {
    if (!filterOpen) return null;
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[
          styles.filterOptions,
          { 
            backgroundColor: colors.card,
            shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
            top: insets.top + moderateScale(70)
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.filterOption,
            filterStatus === 'all' && { backgroundColor: `${colors.primary}15` }
          ]}
          onPress={() => applyFilter('all')}
        >
          <Text 
            variant="bodyMedium" 
            color={filterStatus === 'all' ? colors.primary : colors.text}
          >
            All Redemptions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterOption,
            filterStatus === 'active' && { backgroundColor: `${colors.primary}15` }
          ]}
          onPress={() => applyFilter('active')}
        >
          <Text 
            variant="bodyMedium" 
            color={filterStatus === 'active' ? colors.primary : colors.text}
          >
            Active Only
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterOption,
            filterStatus === 'expired' && { backgroundColor: `${colors.primary}15` }
          ]}
          onPress={() => applyFilter('expired')}
        >
          <Text 
            variant="bodyMedium" 
            color={filterStatus === 'expired' ? colors.primary : colors.text}
          >
            Expired
          </Text>
        </TouchableOpacity>
      </MotiView>
    );
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            backgroundColor: colors.background,
            height: headerHeight,
            paddingTop: insets.top,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            { opacity: headerOpacity }
          ]}
        >
          <View style={styles.headerLeft}>
            <Text variant="headingLarge" color={colors.text}>
              Redemption History
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              View all your redeemed discounts
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={toggleFilter}
          >
            <FilterIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {/* Filter options dropdown */}
      {renderFilterOptions()}
      
      {/* Main Content */}
      <Animated.FlatList
        data={redemptions}
        renderItem={renderRedemptionItem}
        keyExtractor={item => item._id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: moderateScale(120) + insets.top },
          redemptions.length === 0 && { flex: 1 }
        ]}
        ListEmptyComponent={loading ? <LoadingComponent /> : <EmptyState />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={moderateScale(120) + insets.top}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOptions: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 101,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  filterOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  redemptionCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  title: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  discountPercent: {
    
  },
  merchantName: {
    marginBottom: SPACING.md,
  },
  codeContainer: {
    marginBottom: SPACING.sm,
  },
  code: {
    letterSpacing: 1,
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dateText: {
    marginLeft: 6,
  },
  viewButton: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  exploreButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonCard: {
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
});


export default RedemptionHistoryScreen;