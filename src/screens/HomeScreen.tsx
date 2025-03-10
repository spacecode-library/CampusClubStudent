import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Platform,
  FlatList,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import DiscountCard, { DiscountData } from '../components/DiscountCard';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { horizontalScale, verticalScale, moderateScale } from '../utils/responsiveUtils';
import { SaleTagIcon, LocationPinIcon, SearchIcon, BellIcon } from '../components/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApiService from '../services/ApiService';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SharedElement } from 'react-navigation-shared-element';
import Skeleton from '../components/SkeletonLoader';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// For smooth UI testing before API integration
const mockDiscounts: DiscountData[] = [
  {
    _id: 'discount-1',
    merchantId: 'merchant-1',
    merchantCity: 'Kuala Lumpur',
    merchantCountry: 'Malaysia',
    title: 'Red Chief 50% Off',
    description: 'Get 50% off on all shoes',
    discountType: 'OFFLINE',
    discountpercentage: 50,
    startprice: 2000,
    remainingUses: 100,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Red Chief',
    merchantLogo: 'https://logo.clearbit.com/redchief.com',
    backgroundImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop'
  },
  {
    _id: 'discount-2',
    merchantId: 'merchant-2',
    merchantCity: 'Delhi',
    merchantCountry: 'India',
    title: 'Space Code Clothing Sale',
    description: 'Exclusive discounts for students',
    discountType: 'OFFLINE',
    discountpercentage: 25,
    remainingUses: 50,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Space Code',
    backgroundImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1470&auto=format&fit=crop'
  },
  {
    _id: 'discount-3',
    merchantId: 'merchant-3',
    merchantCity: 'Singapore',
    merchantCountry: 'Singapore',
    title: 'Campus Cafe Breakfast Deal',
    description: 'Student breakfast special',
    discountType: 'OFFLINE',
    discountpercentage: 15,
    remainingUses: 200,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Campus Cafe',
    backgroundImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1470&auto=format&fit=crop'
  },
  {
    _id: 'discount-4',
    merchantId: 'merchant-4',
    merchantCity: 'Online',
    merchantCountry: 'Global',
    title: 'Student Premium Subscription',
    description: 'Special student pricing',
    discountType: 'ONLINE',
    discountpercentage: 60,
    storeLink: 'https://example.com',
    remainingUses: 999,
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Spotify',
    merchantLogo: 'https://logo.clearbit.com/spotify.com',
    backgroundImage: 'https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?q=80&w=1374&auto=format&fit=crop'
  },
  {
    _id: 'discount-5',
    merchantId: 'merchant-5',
    merchantCity: 'Online',
    merchantCountry: 'Global',
    title: 'Adobe Creative Cloud Student Plan',
    description: 'Discounted subscription for students',
    discountType: 'ONLINE',
    discountpercentage: 70,
    storeLink: 'https://example.com',
    remainingUses: 999,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    isOpenAll: true,
    status: 'ACTIVE',
    merchantName: 'Adobe',
    merchantLogo: 'https://logo.clearbit.com/adobe.com',
    backgroundImage: 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?q=80&w=1374&auto=format&fit=crop'
  }
];

// Categories for filtering discounts
const categories = [
  { id: 'all', name: 'All', icon: '🔍' },
  { id: 'food', name: 'Food & Drinks', icon: '🍔' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'education', name: 'Education', icon: '📚' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const featuredCarouselRef = useRef<FlatList>(null);
  const featuredScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const featuredCurrentIndex = useRef(0);
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [featuredDiscounts, setFeaturedDiscounts] = useState<DiscountData[]>([]);
  const [popularDiscounts, setPopularDiscounts] = useState<DiscountData[]>([]);
  const [nearbyDiscounts, setNearbyDiscounts] = useState<DiscountData[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [moderateScale(170), moderateScale(70)],
    extrapolate: 'clamp'
  });
  
  const categoriesOpacity = scrollY.interpolate({
    inputRange: [0, 100, 130],
    outputRange: [1, 0.7, 0],
    extrapolate: 'clamp'
  });
  
  const searchBarScale = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0.85],
    extrapolate: 'clamp'
  });
  
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 140],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  // Fetch data on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
      startAutoScroll();
      
      return () => {
        // Clear auto-scroll timer when screen loses focus
        if (featuredScrollTimer.current) {
          clearInterval(featuredScrollTimer.current);
          featuredScrollTimer.current = null;
        }
      };
    }, [])
  );

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    
    try {
      // For quick UI testing, use mock data
      // In production, replace with actual API calls
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Get student info
      try {
        const studentStatus = await ApiService.getStudentStatus();
        if (studentStatus.success && studentStatus.data) {
          setStudentInfo(studentStatus.data);
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
      
      // Get featured discounts (first 3 from mock)
      setFeaturedDiscounts(mockDiscounts.slice(0, 3));
      
      // Get popular discounts (items 2-3 from mock)
      setPopularDiscounts(mockDiscounts.slice(1, 4));
      
      // Get nearby discounts (all except first from mock)
      setNearbyDiscounts(mockDiscounts.slice(1));
      
      // Set all discounts
      setDiscounts(mockDiscounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Auto-scroll featured discounts carousel
  const startAutoScroll = () => {
    if (featuredScrollTimer.current) {
      clearInterval(featuredScrollTimer.current);
    }
    
    featuredScrollTimer.current = setInterval(() => {
      if (featuredDiscounts.length > 0 && featuredCarouselRef.current) {
        featuredCurrentIndex.current = 
          (featuredCurrentIndex.current + 1) % featuredDiscounts.length;
        
        featuredCarouselRef.current.scrollToIndex({
          index: featuredCurrentIndex.current,
          animated: true,
          viewPosition: 0.5
        });
      }
    }, 5000); // Scroll every 5 seconds
  };

  // Handle refreshing
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, []);

  // Handle discount press
  const handleDiscountPress = (discount: DiscountData) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Navigate to discount details screen
    navigation.navigate('DiscountDetails', { discountId: discount._id });
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
    
    // In a real app, filter discounts based on category
    // For this example, we're just changing the selection UI
  };
  
  // Render category button
  const renderCategoryButton = ({item}: {item: typeof categories[0]}) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.categoryButton,
        selectedCategory === item.id && {
          backgroundColor: 
            theme === 'dark' 
              ? `${colors.primary}30` 
              : `${colors.primary}15`,
          borderColor: colors.primary,
        },
        selectedCategory !== item.id && {
          borderColor: 
            theme === 'dark' 
              ? 'rgba(255,255,255,0.2)' 
              : 'rgba(0,0,0,0.1)',
        },
      ]}
      onPress={() => handleCategorySelect(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text
        variant="labelMedium"
        color={selectedCategory === item.id ? colors.primary : colors.textSecondary}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  // Render featured discount card
  const renderFeaturedDiscount = ({item, index}: {item: DiscountData, index: number}) => (
    <TouchableOpacity
      onPress={() => handleDiscountPress(item)}
      activeOpacity={0.9}
    >
      <SharedElement 
        id={`discount.${item._id}.card`}
        style={styles.featuredCardWrapper}
      >
        <MotiView
          style={[
            styles.featuredCard,
            {
              backgroundColor: colors.card,
              shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
            }
          ]}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: index * 100 }}
        >
          <ImageBackground
            source={{ uri: item.backgroundImage }}
            style={styles.featuredCardImage}
            imageStyle={{ borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
              style={styles.featuredImageGradient}
            >
              <View style={styles.featuredImageOverlay}>
                {/* Discount Badge */}
                <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                  <Text variant="titleSmall" color="#FFFFFF" weight="bold">
                    {item.discountpercentage}%
                  </Text>
                  <Text variant="labelSmall" color="#FFFFFF">
                    OFF
                  </Text>
                </View>
                
                {/* Merchant Logo */}
                {item.merchantLogo && (
                  <Image
                    source={{ uri: item.merchantLogo }}
                    style={styles.merchantLogo}
                  />
                )}
              </View>
            </LinearGradient>
          </ImageBackground>
          
          <View style={styles.featuredCardContent}>
            <View style={styles.featuredCardHeader}>
              <Text variant="titleMedium" color={colors.text} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            
            <View style={styles.featuredCardFooter}>
              <View style={styles.merchantInfo}>
                <Text variant="bodySmall" color={colors.textSecondary}>
                  {item.merchantName}
                </Text>
              </View>
              
              <View style={styles.featuredMetaInfo}>
                <View style={styles.locationInfo}>
                  <LocationPinIcon size={14} color={colors.textSecondary} />
                  <Text variant="labelSmall" color={colors.textSecondary} style={styles.metaText}>
                    {item.discountType === 'ONLINE' ? 'Online' : item.merchantCity}
                  </Text>
                </View>
                
                <View style={[
                  styles.discountType,
                  { 
                    backgroundColor: item.discountType === 'ONLINE' 
                      ? `${colors.info}15` 
                      : `${colors.success}15` 
                  }
                ]}>
                  <Text 
                    variant="labelSmall" 
                    color={item.discountType === 'ONLINE' ? colors.info : colors.success}
                  >
                    {item.discountType === 'ONLINE' ? 'Online' : 'In-Store'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </MotiView>
      </SharedElement>
    </TouchableOpacity>
  );
  
  // Render popular discount
  const renderPopularDiscount = ({item, index}: {item: DiscountData, index: number}) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 300 + index * 100 }}
      style={styles.popularItemContainer}
    >
      <DiscountCard
        discount={item}
        onPress={handleDiscountPress}
        cardType="regular"
      />
    </MotiView>
  );
  
  // Render nearby discount
  const renderNearbyDiscount = ({item, index}: {item: DiscountData, index: number}) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600, delay: 500 + index * 80 }}
    >
      <DiscountCard
        discount={item}
        onPress={handleDiscountPress}
        cardType="minimal"
      />
    </MotiView>
  );
  
  // Render section header
  const renderSectionHeader = (title: string, actionText: string = 'See All', onAction?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text variant="titleSmall" color={colors.text}>
        {title}
      </Text>
      <TouchableOpacity onPress={onAction}>
        <Text variant="labelMedium" color={colors.primary}>
          {actionText}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render loading state skeletons
  const renderSkeletons = () => (
    <View style={styles.skeletonContainer}>
      {/* Featured skeleton */}
      <Skeleton style={[styles.skeletonFeatured, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      
      {/* Section title skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton style={[styles.skeletonSectionTitle, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
        <Skeleton style={[styles.skeletonSectionAction, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      </View>
      
      {/* Popular discount skeletons */}
      <Skeleton style={[styles.skeletonPopular, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      <Skeleton style={[styles.skeletonPopular, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      
      {/* Section title skeleton */}
      <View style={styles.sectionHeader}>
        <Skeleton style={[styles.skeletonSectionTitle, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
        <Skeleton style={[styles.skeletonSectionAction, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      </View>
      
      {/* Nearby discount skeletons */}
      <Skeleton style={[styles.skeletonNearby, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      <Skeleton style={[styles.skeletonNearby, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
      <Skeleton style={[styles.skeletonNearby, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
    </View>
  );

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
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            paddingTop: insets.top > 0 ? insets.top : SPACING.md,
            borderBottomWidth: 1,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text variant="headingLarge" color={colors.text} style={styles.appTitle}>
              CampusClub
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
              {studentInfo?.university || 'Xiamen University Malaysia'}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <BellIcon size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.avatarContainer,
                { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary }
              ]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text variant="labelMedium" color={colors.primary}>
                {studentInfo?.name ? studentInfo.name.charAt(0) : 'S'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <Animated.View 
          style={[
            styles.searchBarContainer, 
            { 
              opacity: searchBarOpacity,
              transform: [{ scale: searchBarScale }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.searchBar, 
              { 
                backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary 
              }
            ]}
            onPress={() => navigation.navigate('Explore')}
            activeOpacity={0.7}
          >
            <SearchIcon size={18} color={colors.textSecondary} />
            <Text 
              variant="bodyMedium" 
              color={colors.textSecondary}
              style={styles.searchText}
            >
              Search for discounts
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Categories Horizontal Scroll */}
        <Animated.View style={{ opacity: categoriesOpacity }}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            data={categories}
            renderItem={renderCategoryButton}
            keyExtractor={item => item.id}
          />
        </Animated.View>
      </Animated.View>
      
      {/* Main Content */}
      {loading ? (
        renderSkeletons()
      ) : (
        <Animated.ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: moderateScale(180) + insets.top }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={moderateScale(180) + insets.top}
            />
          }
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Featured Section */}
          <View style={styles.section}>
            {renderSectionHeader('Featured Deals')}
            
            <FlatList
              ref={featuredCarouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={moderateScale(310) + SPACING.md}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={styles.featuredContainer}
              data={featuredDiscounts}
              renderItem={renderFeaturedDiscount}
              keyExtractor={item => item._id}
              onMomentumScrollEnd={(e) => {
                // Update current index for auto-scroll
                const newIndex = Math.round(
                  e.nativeEvent.contentOffset.x / 
                  (moderateScale(310) + SPACING.md)
                );
                featuredCurrentIndex.current = newIndex;
              }}
            />
            
            {/* Pagination Dots */}
            {featuredDiscounts.length > 0 && (
              <View style={styles.paginationContainer}>
                {featuredDiscounts.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: 
                          index === featuredCurrentIndex.current 
                            ? colors.primary 
                            : theme === 'dark' 
                              ? 'rgba(255,255,255,0.3)' 
                              : 'rgba(0,0,0,0.2)',
                        width: index === featuredCurrentIndex.current ? 20 : 8
                      }
                    ]} 
                  />
                ))}
              </View>
            )}
          </View>
          
          {/* Popular Offers Section */}
          <View style={styles.section}>
            {renderSectionHeader('Popular Offers')}
            
            <View style={styles.popularContainer}>
              <FlatList
                data={popularDiscounts}
                renderItem={renderPopularDiscount}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                removeClippedSubviews={false}
              />
            </View>
          </View>
          
          {/* Nearby Discounts Section */}
          <View style={styles.section}>
            {renderSectionHeader('Nearby Discounts', 'See Map')}
            
            <View style={styles.nearbyContainer}>
              <FlatList
                data={nearbyDiscounts}
                renderItem={renderNearbyDiscount}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                removeClippedSubviews={false}
              />
            </View>
          </View>
          
          {/* Bottom padding for tab navigator */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: moderateScale(28),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  avatarContainer: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  searchText: {
    marginLeft: SPACING.xs,
  },
  categoriesContainer: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  categoryButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featuredContainer: {
    paddingBottom: SPACING.xs,
  },
  featuredCardWrapper: {
    width: moderateScale(310),
    marginRight: SPACING.md,
  },
  featuredCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  featuredCardImage: {
    width: '100%',
    height: moderateScale(170),
  },
  featuredImageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  featuredImageOverlay: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  merchantLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#FFFFFF',
  },
  featuredCardContent: {
    padding: SPACING.md,
  },
  featuredCardHeader: {
    marginBottom: SPACING.xs,
  },
  featuredCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  merchantInfo: {
    flex: 1,
  },
  featuredMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  metaText: {
    marginLeft: 4,
  },
  discountType: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  popularContainer: {
    
  },
  popularItemContainer: {
    marginBottom: SPACING.md,
  },
  nearbyContainer: {
    
  },
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: moderateScale(180),
  },
  skeletonFeatured: {
    width: '100%',
    height: moderateScale(240),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonSectionAction: {
    width: 60,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
  },
  skeletonPopular: {
    width: '100%',
    height: moderateScale(130),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  skeletonNearby: {
    width: '100%',
    height: moderateScale(70),
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
});

export default HomeScreen;