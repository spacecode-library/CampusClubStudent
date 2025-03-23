import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  Share,
  Dimensions,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import DiscountCard, { DiscountData } from '../components/DiscountCard';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale, horizontalScale, verticalScale } from '../utils/responsiveUtils';
import { 
  ArrowLeftIcon, 
  StarIcon,
  LocationPinIcon,
  SaleTagIcon,
  ShareIcon,
  ExternalLinkIcon,
  ClockIcon,
  PhoneIcon,
  InfoIcon,
  MessageIcon,
  MapPinIcon,
} from '../components/icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Skeleton from '../components/SkeletonLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MerchantProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MerchantProfile'>;
type MerchantProfileScreenRouteProp = RouteProp<RootStackParamList, 'MerchantProfile'>;

interface MerchantProfileScreenProps {
  navigation: MerchantProfileScreenNavigationProp;
  route: MerchantProfileScreenRouteProp;
}

interface MerchantData {
  id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  location?: {
    city: string;
    country: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  rating?: number;
  totalDiscounts?: number;
  website?: string;
  isVerified?: boolean;
  phone?: string;
  email?: string;
  hours?: {
    [key: string]: {
      open: string;
      close: string;
      isOpen?: boolean;
    };
  };
  tags?: string[];
  reviews?: number;
}

// Tab types for the merchant profile
type TabType = 'offers' | 'about' | 'reviews';

const MerchantProfileScreen: React.FC<MerchantProfileScreenProps> = ({ navigation, route }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { merchantId } = route.params;
  
  // State
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [discounts, setDiscounts] = useState<DiscountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('offers');
  const [todayHours, setTodayHours] = useState<{ open: string; close: string; isOpen: boolean } | null>(null);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const tabScrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabBarScrollY = useRef(new Animated.Value(0)).current;
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [120, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.9],
    extrapolate: 'clamp'
  });
  
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [0, 0, -20],
    extrapolate: 'clamp'
  });
  
  const coverImageHeight = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [moderateScale(300) + 100, moderateScale(300), moderateScale(200)],
    extrapolate: 'clamp'
  });
  
  const logoScale = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp'
  });
  
  const logoTranslateY = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [0, -moderateScale(40)],
    extrapolate: 'clamp'
  });
  
  const infoSectionTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -moderateScale(40)],
    extrapolate: 'clamp'
  });
  
  // Fetch merchant data and discounts
  useEffect(() => {
    fetchMerchantData();
    fetchMerchantDiscounts();
    checkIfFavorite();
  }, [merchantId]);
  
  // Set today's hours
  useEffect(() => {
    if (merchant?.hours) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = days[new Date().getDay()];
      
      if (merchant.hours[today]) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        const openTimeParts = merchant.hours[today].open.split(':');
        const openHour = parseInt(openTimeParts[0]);
        const openMinutes = parseInt(openTimeParts[1]);
        
        const closeTimeParts = merchant.hours[today].close.split(':');
        const closeHour = parseInt(closeTimeParts[0]);
        const closeMinutes = parseInt(closeTimeParts[1]);
        
        const isCurrentlyOpen = 
          (currentHour > openHour || (currentHour === openHour && currentMinutes >= openMinutes)) &&
          (currentHour < closeHour || (currentHour === closeHour && currentMinutes < closeMinutes));
        
        setTodayHours({
          open: merchant.hours[today].open,
          close: merchant.hours[today].close,
          isOpen: isCurrentlyOpen
        });
      }
    }
  }, [merchant]);
  
  // Mock fetch merchant data from API
  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from API using merchantId
      // For demo, use mock data with simulated delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock merchant data with enhanced information
      const mockMerchant: MerchantData = {
        id: merchantId,
        name: 'Campus Coffee',
        logo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1742&auto=format&fit=crop',
        description: 'Campus Coffee is a student-friendly café with locations near major universities. We offer specialty coffee, snacks, and study spaces with free WiFi. Our mission is to provide a welcoming environment for students to study, socialize, and enjoy quality coffee.',
        location: {
          city: 'Boston',
          country: 'United States',
          address: '123 University Ave, Boston, MA 02215',
          coordinates: {
            latitude: 42.3505,
            longitude: -71.1054
          }
        },
        rating: 4.8,
        totalDiscounts: 5,
        website: 'https://example.com',
        isVerified: true,
        phone: '+1 (617) 555-0123',
        email: 'info@campuscoffee.com',
        hours: {
          monday: { open: '07:00', close: '22:00' },
          tuesday: { open: '07:00', close: '22:00' },
          wednesday: { open: '07:00', close: '22:00' },
          thursday: { open: '07:00', close: '22:00' },
          friday: { open: '07:00', close: '23:00' },
          saturday: { open: '08:00', close: '23:00' },
          sunday: { open: '08:00', close: '21:00' }
        },
        tags: ['Coffee', 'Student Friendly', 'WiFi', 'Study Space'],
        reviews: 237
      };
      
      setMerchant(mockMerchant);
    } catch (error) {
      console.error('Error fetching merchant data:', error);
    }
  };
  
  // Mock fetch merchant discounts from API
  const fetchMerchantDiscounts = async () => {
    try {
      // In a real app, fetch from API using merchantId
      // For demo, use mock data with simulated delay
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mock discount data with more variety
      const mockDiscounts: DiscountData[] = [
        {
          _id: 'discount-1',
          merchantId: merchantId,
          merchantCity: 'Boston',
          merchantCountry: 'United States',
          title: 'Buy 1 Get 1 Free Coffee',
          description: 'Buy any size coffee and get another one free. Valid Monday-Friday, 2-5 PM.',
          discountType: 'OFFLINE',
          discountpercentage: 50,
          remainingUses: 100,
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isOpenAll: true,
          status: 'ACTIVE',
          merchantName: 'Campus Coffee',
          merchantLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
          backgroundImage: 'https://images.unsplash.com/photo-1507914372368-b2b085b925a1?q=80&w=1740&auto=format&fit=crop'
        },
        {
          _id: 'discount-2',
          merchantId: merchantId,
          merchantCity: 'Boston',
          merchantCountry: 'United States',
          title: '25% Off Study Snack Packs',
          description: 'Get 25% off on our study snack packs - includes a sandwich, cookie, and coffee.',
          discountType: 'OFFLINE',
          discountpercentage: 25,
          remainingUses: 75,
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          isOpenAll: true,
          status: 'ACTIVE',
          merchantName: 'Campus Coffee',
          merchantLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
          backgroundImage: 'https://images.unsplash.com/photo-1612199621372-48ac36014d1b?q=80&w=1740&auto=format&fit=crop'
        },
        {
          _id: 'discount-3',
          merchantId: merchantId,
          merchantCity: 'Boston',
          merchantCountry: 'United States',
          title: '10% Student Discount',
          description: 'Students get 10% off all orders with valid student ID.',
          discountType: 'OFFLINE',
          discountpercentage: 10,
          remainingUses: 500,
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          isOpenAll: true,
          status: 'ACTIVE',
          merchantName: 'Campus Coffee',
          merchantLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
          backgroundImage: 'https://images.unsplash.com/photo-1622021142947-da6b288a4219?q=80&w=1738&auto=format&fit=crop'
        },
        {
          _id: 'discount-4',
          merchantId: merchantId,
          merchantCity: 'Boston',
          merchantCountry: 'United States',
          title: 'Free Donut with Coffee',
          description: 'Get a free donut when you buy any size coffee. Available all day, every day.',
          discountType: 'OFFLINE',
          discountpercentage: 20,
          remainingUses: 200,
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          isOpenAll: true,
          status: 'ACTIVE',
          merchantName: 'Campus Coffee',
          merchantLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
          backgroundImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1740&auto=format&fit=crop'
        },
        {
          _id: 'discount-5',
          merchantId: merchantId,
          merchantCity: 'Boston',
          merchantCountry: 'United States',
          title: 'Happy Hour: 50% Off',
          description: 'Get half price on all pastries from 4-6 PM, Monday through Thursday.',
          discountType: 'OFFLINE',
          discountpercentage: 50,
          remainingUses: 120,
          endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
          isOpenAll: false,
          status: 'ACTIVE',
          merchantName: 'Campus Coffee',
          merchantLogo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
          backgroundImage: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1740&auto=format&fit=crop'
        },
      ];
      
      setDiscounts(mockDiscounts);
    } catch (error) {
      console.error('Error fetching merchant discounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Mock check if merchant is favorited
  const checkIfFavorite = async () => {
    try {
      // In a real app, check from API or local storage
      // For demo, set to true to match screenshot
      setIsFavorite(true);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMerchantData();
    fetchMerchantDiscounts();
  };
  
  // Handle favorite toggle
  const handleToggleFavorite = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsFavorite(!isFavorite);
    
    // In a real app, update favorite status via API
    // ApiService.toggleFavoriteMerchant(merchantId, !isFavorite);
  };
  
  // Handle opening website
  const handleOpenWebsite = () => {
    if (merchant?.website) {
      Linking.openURL(merchant.website);
    }
  };
  
  // Handle calling merchant
  const handleCall = () => {
    if (merchant?.phone) {
      Linking.openURL(`tel:${merchant.phone}`);
    }
  };
  
  // Handle emailing merchant
  const handleEmail = () => {
    if (merchant?.email) {
      Linking.openURL(`mailto:${merchant.email}`);
    }
  };
  
  // Handle opening maps
  const handleOpenMaps = () => {
    if (merchant?.location?.coordinates) {
      const { latitude, longitude } = merchant.location.coordinates;
      const label = merchant.name;
      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}(${label})`
      });
      
      if (url) {
        Linking.openURL(url);
      }
    }
  };
  
  // Handle sharing merchant profile
  const handleShare = async () => {
    if (!merchant) return;
    
    try {
      await Share.share({
        message: `Check out ${merchant.name} on CampusClub with exclusive student discounts!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Handle discount press
  const handleDiscountPress = (discount: DiscountData) => {
    navigation.navigate('DiscountDetails', { discountId: discount._id });
  };

  // Handle back button press
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Scroll to appropriate section
    if (scrollViewRef.current) {
      const yOffset = moderateScale(300); // Approximate height of cover section
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  };
  
  // Render stars for rating
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    return (
      <View style={styles.starsContainer}>
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            size={16}
            color={i < fullStars 
              ? colors.primary 
              : i === fullStars && halfStar 
                ? colors.primary 
                : theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
            }
            style={{ marginRight: 2 }}
          />
        ))}
        <Text variant="labelMedium" color={colors.text} style={styles.ratingText}>
          {rating.toFixed(1)}
        </Text>
      </View>
    );
  };

  // Render discount item
  const renderDiscountItem = ({ item, index }: { item: DiscountData; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 100 + index * 100 }}
      style={styles.discountContainer}
    >
      <DiscountCard 
        discount={item} 
        onPress={() => handleDiscountPress(item)} 
        cardType="featured" 
      />
    </MotiView>
  );
  
  const featuredDiscountWidth = Math.min(SCREEN_WIDTH * 0.8, 360);
  
  // Render featured discount item for horizontal carousel
  const renderFeaturedDiscountItem = ({ item, index }: { item: DiscountData; index: number }) => {
    // Gradient colors based on discount percentage
    const getGradientColors = () => {
      if (item.discountpercentage >= 50) {
        return theme === 'dark' 
          ? ['#6a11cb', '#2575fc', 'transparent'] as const
          : ['#8a2be2', '#4169e1', 'transparent'] as const;
      } else if (item.discountpercentage >= 25) {
        return theme === 'dark' 
          ? ['#ff8c00', '#ff5722', 'transparent'] as const
          : ['#ff9800', '#ff5722', 'transparent'] as const;
      } else {
        return theme === 'dark' 
          ? ['#43a047', '#1de9b6', 'transparent'] as const
          : ['#4caf50', '#00bcd4', 'transparent'] as const;
      }
    };
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
                  style={[
          styles.featuredDiscountCard,
          { 
            width: featuredDiscountWidth,
            marginLeft: index === 0 ? SPACING.lg : SPACING.sm,
            marginRight: index === discounts.length - 1 ? SPACING.lg : 0
          }
        ]}
        onPress={() => handleDiscountPress(item)}
      >
        <MotiView
          from={{ opacity: 0.9, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'timing', duration: 200 }}
          style={{ flex: 1 }}
        >
        <Image
          source={{ uri: item.backgroundImage }}
          style={styles.featuredDiscountBg}
          resizeMode="cover"
          blurRadius={1}
        />
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredDiscountGradient}
        />
        
        <View style={styles.featuredDiscountContent}>
          <View style={styles.featuredDiscountHeader}>
            <View style={styles.discountBadge}>
              <Text variant="labelMedium" style={styles.discountBadgeText}>
                {item.discountpercentage}% OFF
              </Text>
            </View>
          </View>
          
          <View style={styles.featuredDiscountInfo}>
            <Text 
              variant="titleMedium" 
              color="#FFFFFF" 
              style={styles.featuredDiscountTitle}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            
            <Text
              variant="bodySmall"
              color="#FFFFFF"
              style={styles.featuredDiscountDesc}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            
            <View style={styles.featuredDiscountFooter}>
              <View style={styles.useCountBadge}>
                <Text variant="labelSmall" style={styles.useCountText}>
                  {item.remainingUses} remaining
                </Text>
              </View>
            </View>
          </View>
        </View>
        </MotiView>
      </TouchableOpacity>
    );
  };
  
  // Render the hours section
  const renderHours = () => {
    if (!merchant?.hours) return null;
    
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' },
    ];
    
    const today = new Date().getDay();
    // Map Sunday (0) to index 6, Monday (1) to index 0, etc.
    const todayIndex = today === 0 ? 6 : today - 1;
    
    return (
      <View style={styles.hoursSection}>
        <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
          Hours
        </Text>
        
        {days.map((day, index) => {
          const isToday = index === todayIndex;
          const hours = merchant.hours?.[day.key];
          
          return hours ? (
            <View 
              key={day.key}
              style={[
                styles.hourRow,
                isToday && {
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(255,255,255,0.05)' 
                    : 'rgba(0,0,0,0.03)',
                  borderRadius: BORDER_RADIUS.sm,
                }
              ]}
            >
              <Text 
                variant="bodyMedium" 
                color={isToday ? colors.primary : colors.text}
                style={[styles.dayLabel, isToday && styles.todayLabel]}
              >
                {day.label}
                {isToday && ' (Today)'}
              </Text>
              
              <Text 
                variant="bodyMedium" 
                color={isToday ? colors.primary : colors.text}
              >
                {hours.open} - {hours.close}
              </Text>
            </View>
          ) : null;
        })}
      </View>
    );
  };
  
  // Render the tags section
  const renderTags = () => {
    if (!merchant?.tags || merchant.tags.length === 0) return null;
    
    return (
      <View style={styles.tagsContainer}>
        {merchant.tags.map((tag, index) => (
          <View 
            key={index}
            style={[
              styles.tagBadge,
              { 
                backgroundColor: theme === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(0,0,0,0.05)' 
              }
            ]}
          >
            <Text variant="labelMedium" color={colors.text}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Render about tab content
  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Description */}
      <View style={styles.sectionContainer}>
        <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
          About
        </Text>
        <Text variant="bodyMedium" color={colors.text} style={styles.description}>
          {merchant?.description}
        </Text>
        
        {/* Tags */}
        {renderTags()}
      </View>
      
      {/* Contact Information */}
      <View style={styles.sectionContainer}>
        <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
          Contact Information
        </Text>
        
        {merchant?.phone && (
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handleCall}
          >
            <PhoneIcon size={18} color={colors.primary} />
            <Text 
              variant="bodyMedium" 
              color={colors.text}
              style={styles.contactText}
            >
              {merchant.phone}
            </Text>
          </TouchableOpacity>
        )}
        
        {merchant?.email && (
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handleEmail}
          >
            <MessageIcon size={18} color={colors.primary} />
            <Text 
              variant="bodyMedium" 
              color={colors.text}
              style={styles.contactText}
            >
              {merchant.email}
            </Text>
          </TouchableOpacity>
        )}
        
        {merchant?.location?.address && (
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handleOpenMaps}
          >
            <MapPinIcon size={18} color={colors.primary} />
            <Text 
              variant="bodyMedium" 
              color={colors.text}
              style={styles.contactText}
            >
              {merchant.location.address}
            </Text>
          </TouchableOpacity>
        )}
        
        {merchant?.website && (
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={handleOpenWebsite}
          >
            <ExternalLinkIcon size={18} color={colors.primary} />
            <Text 
              variant="bodyMedium" 
              color={colors.text}
              style={styles.contactText}
            >
              {merchant.website.replace(/^https?:\/\//i, '')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Hours */}
      {renderHours()}
      
      {/* Map (Placeholder - In a real app, integrate a map component) */}
      <TouchableOpacity 
        style={[
          styles.mapContainer,
          { 
            backgroundColor: theme === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.05)' 
          }
        ]}
        onPress={handleOpenMaps}
      >
        <MapPinIcon size={24} color={colors.primary} />
        <Text 
          variant="bodyMedium" 
          color={colors.text}
          style={styles.mapText}
        >
          View Location on Map
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render offers tab content
  const renderOffersTab = () => (
    <View style={styles.tabContent}>
      {/* Featured Discounts Carousel */}
      <View>
        <Text 
          variant="titleSmall" 
          color={colors.text} 
          style={[styles.sectionTitle, { marginHorizontal: SPACING.lg }]}
        >
          Featured Offers
        </Text>
        
        <FlatList
          data={discounts}
          renderItem={renderFeaturedDiscountItem}
          keyExtractor={item => `featured-${item._id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredDiscountsContainer}
        />
      </View>
      
      {/* All Discounts */}
      <View style={{ marginTop: SPACING.xl }}>
        <Text 
          variant="titleSmall" 
          color={colors.text} 
          style={[styles.sectionTitle, { marginHorizontal: SPACING.lg }]}
        >
          All Offers
        </Text>
        
        {discounts.map((discount, index) => (
          renderDiscountItem({ item: discount, index })
        ))}
      </View>
    </View>
  );
  
  // Render reviews tab content (Placeholder - In a real app, fetch and display actual reviews)
  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionContainer}>
        <View style={styles.reviewSummary}>
          <Text 
            variant="displayMedium" 
            color={colors.text}
            style={styles.ratingBig}
          >
            {merchant?.rating?.toFixed(1) || '0.0'}
          </Text>
          
          {merchant?.rating && (
            <View style={styles.ratingStarsLarge}>
              {[...Array(5)].map((_, i) => {
                const fullStars = Math.floor(merchant.rating || 0);
                const halfStar = (merchant.rating || 0) % 1 >= 0.5;
                
                return (
                  <StarIcon
                    key={i}
                    size={24}
                    color={i < fullStars 
                      ? colors.primary 
                      : i === fullStars && halfStar 
                        ? colors.primary 
                        : theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
                    }
                    style={{ marginRight: 4 }}
                  />
                );
              })}
            </View>
          )}
          
          <Text 
            variant="bodyMedium" 
            color={colors.textSecondary}
            style={styles.reviewCount}
          >
            Based on {merchant?.reviews || 0} reviews
          </Text>
        </View>
        
        {/* Placeholder for actual reviews - In a real app, show list of reviews */}
        <View style={styles.reviewsPlaceholder}>
          <Text 
            variant="bodyLarge" 
            color={colors.textSecondary}
            style={{ textAlign: 'center' }}
          >
            Reviews coming soon!
          </Text>
        </View>
      </View>
    </View>
  );
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'offers':
        return renderOffersTab();
      case 'about':
        return renderAboutTab();
      case 'reviews':
        return renderReviewsTab();
      default:
        return renderOffersTab();
    }
  };
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Skeleton 
        style={[
          styles.skeletonCover, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]} 
      />
      <Skeleton 
        style={[
          styles.skeletonLogo, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]}
      />
      <Skeleton 
        style={[
          styles.skeletonTitle, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]}
      />
      <Skeleton 
        style={[
          styles.skeletonSection, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]}
      />
      <Skeleton 
        style={[
          styles.skeletonDiscount, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]}
      />
      <Skeleton 
        style={[
          styles.skeletonDiscount, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Animated header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            height: 60 + insets.top,
            paddingTop: insets.top,
            opacity: headerOpacity,
            shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.Text 
            style={[
              styles.headerTitle,
              { 
                color: colors.text,
                opacity: headerTitleOpacity,
                transform: [{ translateX: headerTitleOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}]
              }
            ]}
            numberOfLines={1}
          >
            {merchant?.name || 'Merchant Profile'}
          </Animated.Text>
          
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.headerAction}
          >
            <ShareIcon size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {loading ? (
        renderSkeleton()
      ) : (
        <Animated.ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + SPACING.xl,
            }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Cover Image Section */}
          <Animated.View
            style={[
              styles.coverContainer,
              {
                height: coverImageHeight,
              }
            ]}
          >
            <Animated.Image
              source={{ uri: merchant?.coverImage }}
              style={[
                styles.coverImage,
                {
                  transform: [
                    { scale: imageScale },
                    { translateY: imageTranslateY }
                  ]
                }
              ]}
              resizeMode="cover"
            />
            
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.coverGradient}
            />
            
            {/* Back button on cover */}
            <TouchableOpacity 
              style={[styles.coverBackButton, { marginTop: insets.top }]}
              onPress={handleBack}
            >
              <ArrowLeftIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Bottom information on cover */}
            <View style={styles.coverInfoContainer}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [
                      { scale: logoScale },
                      { translateY: logoTranslateY }
                    ]
                  }
                ]}
              >
                <Image
                  source={{ uri: merchant?.logo }}
                  style={styles.logo}
                  resizeMode="cover"
                />
                {merchant?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text variant="labelSmall" color="#FFFFFF">
                      VERIFIED
                    </Text>
                  </View>
                )}
              </Animated.View>
              
              {/* Action button bar */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 300 }}
                style={styles.actionBarContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFavorite && styles.actionButtonActive
                  ]}
                  onPress={handleToggleFavorite}
                  activeOpacity={0.8}
                >
                  <Text
                    variant="titleMedium"
                    color="#FFFFFF"
                    style={styles.actionButtonText}
                  >
                    {isFavorite ? '♥' : '♡'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                  activeOpacity={0.8}
                >
                  <ShareIcon size={22} color="#FFFFFF" />
                </TouchableOpacity>
                
                {merchant?.website && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleOpenWebsite}
                    activeOpacity={0.8}
                  >
                    <ExternalLinkIcon size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </MotiView>
            </View>
          </Animated.View>
          
          {/* Merchant Info Section */}
          <Animated.View
            style={[
              styles.infoSection,
              {
                backgroundColor: colors.card,
                transform: [{ translateY: infoSectionTranslateY }]
              }
            ]}
          >
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
            >
              <View style={styles.nameRatingContainer}>
                <Text variant="titleLarge" color={colors.text} style={styles.merchantName}>
                  {merchant?.name}
                </Text>
                
                {merchant?.rating && renderStars(merchant.rating)}
              </View>
              
              <View style={styles.locationStatusContainer}>
                {merchant?.location && (
                  <View style={styles.locationContainer}>
                    <LocationPinIcon size={14} color={colors.textSecondary} />
                    <Text
                      variant="bodySmall"
                      color={colors.textSecondary}
                      style={styles.locationText}
                    >
                      {merchant.location.city}, {merchant.location.country}
                    </Text>
                  </View>
                )}
                
                {todayHours && (
                  <View style={styles.hoursIndicatorContainer}>
                    <ClockIcon size={14} color={todayHours.isOpen ? colors.success : colors.error} />
                    <Text
                      variant="bodySmall"
                      color={todayHours.isOpen ? colors.success : colors.error}
                      style={styles.hoursIndicatorText}
                    >
                      {todayHours.isOpen ? 'Open Now' : 'Closed'} · {todayHours.open} - {todayHours.close}
                    </Text>
                  </View>
                )}
              </View>
            </MotiView>
            
            {/* Tabs */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 200 }}
              style={styles.tabsContainer}
            >
        <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.tab,
                    activeTab === 'offers' && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary }
                    ]
                  ]}
                  onPress={() => handleTabChange('offers')}
                >
                  <Text
                    variant="labelLarge"
                    color={activeTab === 'offers' ? colors.primary : colors.textSecondary}
                    style={{ fontWeight: '600' }}
                  >
                    Offers ({discounts.length})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.tab,
                    activeTab === 'about' && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary }
                    ]
                  ]}
                  onPress={() => handleTabChange('about')}
                >
                  <Text
                    variant="labelLarge"
                    color={activeTab === 'about' ? colors.primary : colors.textSecondary}
                    style={{ fontWeight: '600' }}
                  >
                    About
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.tab,
                    activeTab === 'reviews' && [
                      styles.activeTab,
                      { borderBottomColor: colors.primary }
                    ]
                  ]}
                  onPress={() => handleTabChange('reviews')}
                >
                  <Text
                    variant="labelLarge"
                    color={activeTab === 'reviews' ? colors.primary : colors.textSecondary}
                    style={{ fontWeight: '600' }}
                  >
                    Reviews ({merchant?.reviews || 0})
                  </Text>
                </TouchableOpacity>
            </MotiView>
          </Animated.View>
          
          {/* Tab Content */}
          {renderTabContent()}
        </Animated.ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
    marginLeft: -40, // Offset the width of the back button
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  coverContainer: {
    width: '100%',
    height: moderateScale(300),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  coverBackButton: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    zIndex: 10,
  },
  coverInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#4C6ED7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  actionBarContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  actionButtonActive: {
    backgroundColor: '#e53935',
  },
  actionButtonText: {
    textAlign: 'center',
  },
  infoSection: {
    padding: SPACING.lg,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    marginTop: -BORDER_RADIUS.lg, // Overlap with cover image
  },
  nameRatingContainer: {
    marginBottom: SPACING.sm,
  },
  merchantName: {
    marginBottom: SPACING.xxs,
    fontWeight: '700',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: SPACING.xs,
  },
  locationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationText: {
    marginLeft: 4,
  },
  hoursIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursIndicatorText: {
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    paddingVertical: SPACING.sm,
    marginRight: SPACING.xl,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabContent: {
    paddingTop: SPACING.md,
  },
  sectionContainer: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  description: {
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  tagBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  contactText: {
    marginLeft: SPACING.sm,
  },
  hoursSection: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  dayLabel: {
    width: 120,
  },
  todayLabel: {
    fontWeight: '600',
  },
  mapContainer: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  mapText: {
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  featuredDiscountsContainer: {
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  featuredDiscountCard: {
    width: '80%', // This will be overridden with the calculated width
    height: moderateScale(180),
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredDiscountBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  featuredDiscountGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.9,
  },
  featuredDiscountContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  featuredDiscountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  discountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFFFFF',
  },
  discountBadgeText: {
    color: '#000000',
    fontWeight: '700',
  },
  featuredDiscountInfo: {
    marginTop: 'auto',
  },
  featuredDiscountTitle: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredDiscountDesc: {
    marginBottom: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuredDiscountFooter: {
    flexDirection: 'row',
  },
  useCountBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  useCountText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  discountContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  reviewSummary: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  ratingStarsLarge: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  reviewCount: {
    marginTop: SPACING.sm,
  },
  reviewsPlaceholder: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  skeletonContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  skeletonCover: {
    height: moderateScale(250),
    width: '100%',
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  skeletonLogo: {
    height: moderateScale(70),
    width: moderateScale(70),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  skeletonTitle: {
    height: moderateScale(30),
    width: '70%',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  skeletonSection: {
    height: moderateScale(100),
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  skeletonDiscount: {
    height: moderateScale(160),
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
});

export default MerchantProfileScreen;