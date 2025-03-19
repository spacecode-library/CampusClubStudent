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
  Dimensions,
  NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import DiscountCard, { DiscountData } from '../components/DiscountCard';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { horizontalScale, verticalScale, moderateScale } from '../utils/responsiveUtils';
import { 
  SaleTagIcon, 
  LocationPinIcon, 
  SearchIcon, 
  BellIcon, 
  InfoIcon,
  CloseIcon
} from '../components/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ApiService from '../services/ApiService';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// import { SharedElement } from 'react-navigation-shared-element';
import Skeleton from '../components/SkeletonLoader';
import DiscountBadge from '../components/DiscountBadge'; 


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// UI Constants
const DISCOUNT_BADGE_COLOR = '#E63946'; // Vibrant red color
const DISCOUNT_BADGE_SHADOW_COLOR = 'rgba(230, 57, 70, 0.4)'; // Matching shadow

// Mock data for discounts and categories
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
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
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
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
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
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
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
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
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

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const featuredCarouselRef = useRef<FlatList>(null);
  const featuredScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const featuredCurrentIndex = useRef(0);
  const lastScrollY = useRef(0);
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [featuredDiscounts, setFeaturedDiscounts] = useState<DiscountData[]>([]);
  const [popularDiscounts, setPopularDiscounts] = useState<DiscountData[]>([]);
  const [nearbyDiscounts, setNearbyDiscounts] = useState<DiscountData[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [showBenefitsCard, setShowBenefitsCard] = useState(true);
  
  // Dynamic values for collapsible header
  const APP_BAR_HEIGHT = 60;
  const SEARCH_BAR_HEIGHT = 50;
  const CATEGORIES_HEIGHT = 50;
  const HEADER_EXPANDED_HEIGHT = APP_BAR_HEIGHT + SEARCH_BAR_HEIGHT + CATEGORIES_HEIGHT;
  const HEADER_COLLAPSED_HEIGHT = Platform.OS === 'ios' ? APP_BAR_HEIGHT + insets.top : APP_BAR_HEIGHT;
  
  // Calculate top padding for content
  const contentPaddingTop = HEADER_EXPANDED_HEIGHT + insets.top;
  
  // Animated values for collapsible header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT],
    outputRange: [HEADER_EXPANDED_HEIGHT + insets.top, HEADER_COLLAPSED_HEIGHT],
    extrapolate: 'clamp'
  });
  
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT / 2, HEADER_EXPANDED_HEIGHT],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT],
    outputRange: [0, -50],
    extrapolate: 'clamp'
  });
  
  const categoriesOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT / 1.5, HEADER_EXPANDED_HEIGHT],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });
  
  const categoriesTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_EXPANDED_HEIGHT],
    outputRange: [0, -50],
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

  // Handle scroll event with optimized performance
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        lastScrollY.current = currentScrollY;
      }
    }
  );

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
  
  // Handle search press
  const handleSearchPress = () => {
    navigation.navigate('Explore');
  };
  
  // Handle profile press
  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  // Handle redemption history press
  const handleRedemptionHistoryPress = () => {
    navigation.navigate('RedemptionHistory');
  };
  
  // Close benefits card with haptic feedback
  const handleCloseBenefitsCard = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowBenefitsCard(false);
  };
  
  // Render featured discount card
  const renderFeaturedDiscount = ({item, index}: {item: DiscountData, index: number}) => {
    const isActive = index === featuredCurrentIndex.current;
    
    return (
      <TouchableOpacity
        onPress={() => handleDiscountPress(item)}
        activeOpacity={0.9}
      >
        <View
        >
          <MotiView
            style={[
              styles.featuredCard,
              {
                backgroundColor: colors.card,
                shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
                shadowOpacity: isActive ? 0.3 : 0.1,
                elevation: isActive ? 8 : 4,
              }
            ]}
            animate={{ 
              scale: isActive ? 1 : 0.95,
            }}
            transition={{ 
              type: 'timing',
              duration: 300,
            }}
          >
            <ImageBackground
              source={{ uri: item.backgroundImage }}
              style={styles.featuredCardImage}
              imageStyle={{ borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                style={styles.featuredImageGradient}
              >
                <View style={styles.featuredImageOverlay}>
                  {/* New Premium Discount Badge */}
                  <View style={styles.discountBadgeContainer}>
                    <View style={styles.discountBadge}>
                      <Text variant="titleSmall" style={styles.discountPercent}>
                        {item.discountpercentage}%
                      </Text>
                      <Text variant="labelSmall" style={styles.discountLabel}>
                        OFF
                      </Text>
                    </View>
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
        </View>
      </TouchableOpacity>
    );
  };
  
  // Enhanced pagination dots for carousel
  const renderPaginationDots = () => {
    if (featuredDiscounts.length === 0) return null;
    
    return (
      <View style={styles.paginationContainer}>
        {featuredDiscounts.map((_, index) => {
          const isActive = index === featuredCurrentIndex.current;
          
          return (
            <MotiView 
              key={index} 
              style={[
                styles.paginationDot,
                {
                  backgroundColor: 
                    isActive
                      ? colors.primary 
                      : theme === 'dark' 
                        ? 'rgba(255,255,255,0.3)' 
                        : 'rgba(0,0,0,0.2)',
                  width: isActive ? 24 : 8,
                }
              ]}
              animate={{ 
                width: isActive ? 24 : 8,
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{ 
                type: 'timing',
                duration: 300,
              }}
            />
          );
        })}
      </View>
    );
  };
  
  // Render section header with improved styling
  const renderSectionHeader = (title: string, actionText: string = 'See All', onAction?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text variant="titleMedium" color={colors.text} style={styles.sectionTitle}>
        {title}
      </Text>
      <TouchableOpacity 
        style={styles.sectionAction}
        onPress={onAction}
        activeOpacity={0.7}
      >
        <Text variant="labelMedium" color={colors.primary}>
          {actionText}
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render loading state skeletons with enhanced styling
  const renderSkeletons = () => (
    <View style={[styles.skeletonContainer, { paddingTop: contentPaddingTop + 20 }]}>
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
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Collapsible Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            backgroundColor: colors.background,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            borderBottomWidth: 1,
            paddingTop: insets.top,
          }
        ]}
      >
        {/* App Bar - Always Visible */}
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Text variant="headingLarge" color={colors.text} style={styles.appTitle}>
              CampusClub
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
              {studentInfo?.university || 'Xiamen University Malaysia'}
            </Text>
          </View>
          
          <View style={styles.appBarActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={handleRedemptionHistoryPress}
            >
              <SaleTagIcon size={22} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButton}>
              <BellIcon size={22} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.avatarButton,
                { 
                  backgroundColor: theme === 'dark' 
                    ? `${colors.primary}30` 
                    : `${colors.primary}15`,
                }
              ]}
              onPress={handleProfilePress}
            >
              <Text variant="labelMedium" color={colors.primary} weight="bold">
                {studentInfo?.name ? studentInfo.name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar - Hides on Scroll */}
        <Animated.View 
          style={[
            styles.searchBarContainer,
            {
              opacity: searchBarOpacity,
              transform: [{ translateY: searchBarTranslateY }],
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.searchBar, 
              { 
                backgroundColor: theme === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0,0,0,0.05)' 
              }
            ]}
            onPress={handleSearchPress}
            activeOpacity={0.7}
          >
            <SearchIcon size={18} color={colors.textSecondary} />
            <Text 
              variant="bodyMedium" 
              color={colors.textSecondary}
              style={styles.searchText}
            >
              Search for discounts...
            </Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Categories - Hide on Scroll */}
        <Animated.View 
          style={[
            styles.categoriesWrapper,
            {
              opacity: categoriesOpacity,
              transform: [{ translateY: categoriesTranslateY }],
            }
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && {
                    backgroundColor: 
                      theme === 'dark' 
                        ? `${colors.primary}30` 
                        : `${colors.primary}15`,
                    borderColor: colors.primary,
                  },
                  selectedCategory !== category.id && {
                    borderColor: 
                      theme === 'dark' 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'rgba(0,0,0,0.1)',
                  },
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  variant="labelMedium"
                  color={selectedCategory === category.id ? colors.primary : colors.textSecondary}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
      
      {/* Main Content */}
      {loading ? (
        renderSkeletons()
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentPaddingTop }
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              progressViewOffset={contentPaddingTop}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Premium Benefits Card - Only shown if not dismissed */}
          {showBenefitsCard && (
            <MotiView
              style={[
                styles.benefitsCard,
                {
                  backgroundColor: theme === 'dark' 
                    ? colors.primary + '20' 
                    : colors.primary + '10',
                }
              ]}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 700 }}
            >
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleCloseBenefitsCard}
              >
                <CloseIcon size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.benefitsContent}>
                <View style={styles.benefitsTextContainer}>
                  <Text 
                    variant="titleMedium" 
                    color={colors.primary} 
                    style={{ marginBottom: 4 }}
                  >
                    Premium Benefits
                  </Text>
                  <Text 
                    variant="bodyMedium" 
                    color={colors.text}
                    style={{ marginBottom: 10 }}
                    numberOfLines={2}
                  >
                    Unlock exclusive discounts & perks with Campus Premium
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.premiumButton,
                      { backgroundColor: colors.primary }
                    ]}
                    onPress={() => navigation.navigate('Subscription')}
                  >
                    <Text variant="labelMedium" color="#FFF">
                      Learn More
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.benefitsIconContainer}>
                  <InfoIcon size={40} color={colors.primary} />
                </View>
              </View>
            </MotiView>
          )}
          
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
            
            {/* Enhanced Pagination Dots */}
            {renderPaginationDots()}
          </View>
          
          {/* Popular Offers Section */}
          <View style={styles.section}>
            {renderSectionHeader('Popular Offers')}
            
            <View style={styles.popularContainer}>
              {popularDiscounts.map((discount, index) => (
                <MotiView
                  key={discount._id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 600, delay: 300 + index * 100 }}
                  style={styles.popularItemContainer}
                >
                  <DiscountCard
                    discount={discount}
                    onPress={handleDiscountPress}
                    cardType="regular"
                  />
                </MotiView>
              ))}
            </View>
          </View>
          
          {/* Nearby Discounts Section */}
          <View style={styles.section}>
            {renderSectionHeader('Nearby Discounts', 'See Map')}
            
            <View style={styles.nearbyContainer}>
              {nearbyDiscounts.map((discount, index) => (
                <MotiView
                  key={discount._id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 600, delay: 500 + index * 80 }}
                >
                  <DiscountCard
                    discount={discount}
                    onPress={handleDiscountPress}
                    cardType="minimal"
                  />
                </MotiView>
              ))}
            </View>
          </View>
          
          {/* Bottom padding for tab navigator */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  
  // Header & App Bar - New collapsible design
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 60,
  },
  appBarLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  
  // Search bar
  searchBarContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 40,
    borderRadius: 20,
  },
  searchText: {
    marginLeft: SPACING.xs,
  },
  
  // Categories
  categoriesWrapper: {
    paddingTop: 8,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
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
  
  // Benefits card
  benefitsCard: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitsTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  benefitsIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  
  // Section styles
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionAction: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  
  // Featured discount styles
  featuredContainer: {
    paddingBottom: SPACING.sm,
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
    shadowRadius: 12,
    elevation: 6,
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
  
  // New Discount Badge Design
  discountBadgeContainer: {
    // Container for positioning and shadows
    shadowColor: DISCOUNT_BADGE_SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 10,
  },
  discountBadge: {
    // The badge itself
    backgroundColor: DISCOUNT_BADGE_COLOR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    // Subtle inner shadow for depth
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    // Add a subtle angled cut to the badge for a price tag look
    transform: [{ rotate: '-3deg' }],
  },
  discountPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: -2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  
  merchantLogo: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
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
  
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    height: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  
  // Containers for discounts
  popularContainer: {
    marginTop: SPACING.xs,
  },
  popularItemContainer: {
    marginBottom: SPACING.md,
  },
  nearbyContainer: {
    marginTop: SPACING.xs,
  },
  
  // Skeleton styles
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  skeletonFeatured: {
    width: '100%',
    height: moderateScale(220),
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