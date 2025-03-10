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
} from '../components/icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/ApiService';
import * as Haptics from 'expo-haptics';
import Skeleton from '../components/SkeletonLoader';

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
  };
  rating?: number;
  totalDiscounts?: number;
  website?: string;
  isVerified?: boolean;
}

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
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp'
  });
  
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp'
  });
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [-100, 0],
    extrapolate: 'clamp'
  });

  // Fetch merchant data and discounts
  useEffect(() => {
    fetchMerchantData();
    fetchMerchantDiscounts();
    checkIfFavorite();
  }, [merchantId]);
  
  // Mock fetch merchant data from API
  const fetchMerchantData = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from API using merchantId
      // For demo, use mock data with simulated delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock merchant data
      const mockMerchant: MerchantData = {
        id: merchantId,
        name: 'Campus Coffee',
        logo: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1742&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1742&auto=format&fit=crop',
        description: 'Campus Coffee is a student-friendly café with locations near major universities. We offer specialty coffee, snacks, and study spaces with free WiFi.',
        location: {
          city: 'Boston',
          country: 'United States'
        },
        rating: 4.8,
        totalDiscounts: 5,
        website: 'https://example.com',
        isVerified: true
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
      
      // Mock discount data
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
      // For demo, random value
      setIsFavorite(Math.random() > 0.5);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: 100 + index * 100 }}
      style={styles.discountContainer}
    >
      <DiscountCard 
        discount={item} 
        onPress={handleDiscountPress} 
        cardType="regular" 
      />
    </MotiView>
  );
  
  // Render loading skeleton
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <Skeleton 
        style={[
          styles.skeletonHeader, 
          { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }
        ]} 
      />
      <Skeleton 
        style={[
          styles.skeletonDetail, 
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

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <SaleTagIcon size={40} color={colors.textSecondary} />
      <Text 
        variant="titleSmall" 
        color={colors.text}
        style={styles.emptyTitle}
      >
        No Discounts Available
      </Text>
      <Text 
        variant="bodyMedium" 
        color={colors.textSecondary}
        style={styles.emptyText}
      >
        This merchant doesn't have any active discounts right now. Check back later!
      </Text>
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
            backgroundColor: colors.background,
            height: 60 + insets.top,
            paddingTop: insets.top,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
            shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text 
            variant="titleMedium" 
            color={colors.text}
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {merchant?.name || 'Merchant Profile'}
          </Text>
          
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
        <Animated.FlatList
          data={discounts}
          renderItem={renderDiscountItem}
          keyExtractor={item => item._id}
          ListEmptyComponent={renderEmptyState}
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
          ListHeaderComponent={() => (
            merchant ? (
              <>
                {/* Hero Section with Cover Image */}
                <Animated.View
                  style={[
                    styles.coverImageContainer,
                    {
                      transform: [{ scale: imageScale }],
                      opacity: imageOpacity,
                    }
                  ]}
                >
                  <Image
                    source={{ uri: merchant.coverImage }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                    style={styles.coverGradient}
                  />
                </Animated.View>
                
                {/* Merchant Details Card */}
                <MotiView
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500 }}
                  style={[
                    styles.merchantCard,
                    {
                      backgroundColor: colors.card,
                      shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.1)',
                    }
                  ]}
                >
                  {/* Logo and Actions Row */}
                  <View style={styles.merchantHeader}>
                    <View style={styles.merchantLogoContainer}>
                      <Image
                        source={{ uri: merchant.logo }}
                        style={styles.merchantLogo}
                        resizeMode="cover"
                      />
                      {merchant.isVerified && (
                        <View 
                          style={[
                            styles.verifiedBadge,
                            { backgroundColor: colors.primary }
                          ]}
                        >
                          <Text 
                            variant="labelSmall" 
                            color="#FFFFFF"
                          >
                            VERIFIED
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.merchantHeaderActions}>
                      <TouchableOpacity
                        onPress={handleToggleFavorite}
                        style={[
                          styles.favoriteButton,
                          {
                            backgroundColor: isFavorite 
                              ? theme === 'dark' ? 'rgba(255,100,100,0.2)' : 'rgba(255,100,100,0.1)'
                              : theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                          }
                        ]}
                      >
                        <Text
                          variant="labelMedium"
                          color={isFavorite ? colors.error : colors.text}
                        >
                          {isFavorite ? '♥ Favorited' : '♡ Favorite'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Merchant Name and Rating */}
                  <View style={styles.merchantNameContainer}>
                    <Text
                      variant="titleLarge"
                      color={colors.text}
                      style={styles.merchantName}
                    >
                      {merchant.name}
                    </Text>
                    
                    {merchant.rating && renderStars(merchant.rating)}
                  </View>
                  
                  {/* Location */}
                  {merchant.location && (
                    <View style={styles.locationContainer}>
                      <LocationPinIcon size={16} color={colors.textSecondary} />
                      <Text
                        variant="bodyMedium"
                        color={colors.textSecondary}
                        style={styles.locationText}
                      >
                        {merchant.location.city}, {merchant.location.country}
                      </Text>
                    </View>
                  )}
                  
                  {/* Description */}
                  {merchant.description && (
                    <Text
                      variant="bodyMedium"
                      color={colors.text}
                      style={styles.description}
                    >
                      {merchant.description}
                    </Text>
                  )}
                  
                  {/* Action buttons */}
                  <View style={styles.actionButtonsContainer}>
                    {merchant.website && (
                      <Button
                        title="Visit Website"
                        variant="outlined"
                        size="medium"
                        onPress={handleOpenWebsite}
                        icon={<ExternalLinkIcon size={16} color={colors.primary} />}
                        iconPosition="right"
                        style={styles.actionButton}
                      />
                    )}
                    
                    <Button
                      title="Share Profile"
                      variant="outlined"
                      size="medium"
                      onPress={handleShare}
                      icon={<ShareIcon size={16} color={colors.primary} />}
                      iconPosition="right"
                      style={styles.actionButton}
                    />
                  </View>
                </MotiView>
                
                {/* Discounts Header */}
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 100 }}
                  style={styles.discountsHeaderContainer}
                >
                  <Text 
                    variant="titleMedium" 
                    color={colors.text}
                  >
                    Available Discounts
                  </Text>
                  
                  <Text 
                    variant="labelMedium" 
                    color={colors.textSecondary}
                  >
                    {discounts.length} {discounts.length === 1 ? 'offer' : 'offers'} available
                  </Text>
                </MotiView>
              </>
            ) : null
          )}
        />
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
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  coverImageContainer: {
    height: moderateScale(220),
    width: '100%',
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
    height: '50%',
  },
  merchantCard: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: -SPACING.xl, // Overlap the cover image
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  merchantLogoContainer: {
    position: 'relative',
  },
  merchantLogo: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: BORDER_RADIUS.lg,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  merchantHeaderActions: {
    flexDirection: 'row',
  },
  favoriteButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  merchantNameContainer: {
    marginTop: SPACING.md,
  },
  merchantName: {
    marginBottom: SPACING.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xxs,
  },
  ratingText: {
    marginLeft: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  locationText: {
    marginLeft: SPACING.xs,
  },
  description: {
    marginTop: SPACING.md,
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  discountsHeaderContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  discountContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  skeletonContainer: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: moderateScale(220) + SPACING.lg,
  },
  skeletonHeader: {
    height: moderateScale(120),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  skeletonDetail: {
    height: moderateScale(40),
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  skeletonDiscount: {
    height: moderateScale(160),
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default MerchantProfileScreen;