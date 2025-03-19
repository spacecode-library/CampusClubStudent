import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Image,
  ImageBackground,
  Share,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { horizontalScale, verticalScale, moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DiscountData } from '../components/DiscountCard';
import { SharedElement } from '../components/mocks/SharedElement';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native';
import ApiService from '../services/ApiService';

// Import icons
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  CalendarIcon, 
  LocationPinIcon, 
  TagIcon,
} from '../components/icons';

type DiscountDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DiscountDetails'>;
type DiscountDetailsScreenRouteProp = RouteProp<RootStackParamList, 'DiscountDetails'>;

interface DiscountDetailsScreenProps {
  navigation: DiscountDetailsScreenNavigationProp;
  route: DiscountDetailsScreenRouteProp;
}

// Create a custom type that extends React.FC with a sharedElements property
interface SharedElementScreenComponent<P = {}> extends React.FC<P> {
  sharedElements?: (props: any) => string[];
}

// Example mock discount for preview
const mockDiscount: DiscountData = {
  _id: '67b75673d8a1592a4e104bdc',
  merchantId: '67b5efc14650d7cf215cd22a',
  merchantCity: 'Kuala Lumpur',
  merchantCountry: 'Malaysia',
  title: 'Red Chief 50% Off',
  description: 'Get 50% off on all shoes at Red Chief stores. Valid for all students with valid student ID. Cannot be combined with other offers or promotions. Limited time offer, while supplies last.',
  discountType: 'OFFLINE',
  discountpercentage: 50,
  startprice: 2000,
  remainingUses: 100,
  endDate: '2025-06-20T16:21:07.979+00:00',
  isOpenAll: true,
  status: 'ACTIVE',
  merchantName: 'Red Chief',
  merchantLogo: 'https://logo.clearbit.com/redchief.com',
  backgroundImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1470&auto=format&fit=crop'
};

// To be used for terms and conditions sections
const termsAndConditions = [
  'Offer valid until the expiration date shown',
  'Must present valid student ID at time of purchase',
  'Cannot be combined with other promotions or discounts',
  'No cash back or credit for unused portion',
  'Merchant reserves the right to modify or cancel promotion',
  'Subject to availability and while supplies last',
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DiscountDetailsScreen: SharedElementScreenComponent<DiscountDetailsScreenProps> = ({ navigation, route }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const successAnimationRef = useRef<LottieView>(null);
  
  // State
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  
  // Animation interpolations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.85, 1],
    extrapolate: 'clamp'
  });
  
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp'
  });
  
  const heroScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp'
  });
  
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // Fetch discount details
  useEffect(() => {
    const fetchDiscountData = async () => {
      try {
        setLoading(true);
        
        if (!route.params?.discountId) {
          throw new Error('Discount ID is required');
        }

        // Try to fetch from API using route.params.discountId
        const response = await ApiService.getDiscountById(route.params.discountId);
        
        if (response.success && response.data) {
          setDiscount(response.data);
        } else {
          // If API call fails, use mock data with simulated delay for demo
          await new Promise(resolve => setTimeout(resolve, 500));
          setDiscount(mockDiscount);
        }
      } catch (error) {
        console.error('Error fetching discount details:', error);
        // Fallback to mock data
        setDiscount(mockDiscount);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscountData();
  }, [route.params?.discountId]);
  
  // Format end date
  const formatEndDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Calculate days remaining until expiration
  const getDaysRemaining = (dateString: string | Date) => {
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Handle back button press
  const handleBackPress = () => {
    navigation.dispatch(CommonActions.goBack());
  };

  // Handle share button press
  const handleSharePress = async () => {
    if (!discount) return;
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      await Share.share({
        title: `${discount.title} - ${discount.discountpercentage}% off`,
        message: `Check out this discount on CampusClub: ${discount.title} - ${discount.discountpercentage}% off at ${discount.merchantName}!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Handle merchant profile
  const handleViewMerchant = () => {
    if (!discount) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    navigation.navigate('MerchantProfile', { merchantId: discount.merchantId });
  };

  // Handle redeem button press
  const handleRedeemPress = async () => {
    if (!discount) return;
    
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setRedeemLoading(true);
    
    try {
      // Try to call the API in a real app
      const response = await ApiService.redeemDiscount(discount._id);
      
      // If API call fails, simulate for demo purposes
      if (!response.success) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a random code for demo
        const code = 'CC' + Math.floor(1000000 + Math.random() * 9000000).toString();
        setRedeemCode(code);
        setIsRedeemed(true);
        
        if (successAnimationRef.current) {
          successAnimationRef.current.play();
        }
        
        navigation.navigate('RedemptionSuccess', {
          redemptionId: `demo-${Date.now()}`,
          discountTitle: discount.title,
          discountPercentage: discount.discountpercentage,
          merchantName: discount.merchantName,
          merchantLogo: discount.merchantLogo,
          redemptionCode: code,
          isOnline: discount.discountType === 'ONLINE',
          storeLink: discount.storeLink,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else if (response.data && response.data.redeemCode) {
        setRedeemCode(response.data.redeemCode);
        setIsRedeemed(true);
        
        navigation.navigate('RedemptionSuccess', {
          redemptionId: `api-${Date.now()}`,
          discountTitle: discount.title,
          discountPercentage: discount.discountpercentage,
          merchantName: discount.merchantName,
          merchantLogo: discount.merchantLogo,
          redemptionCode: response.data.redeemCode,
          isOnline: discount.discountType === 'ONLINE',
          storeLink: discount.storeLink,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    } catch (error) {
      console.error('Error redeeming discount:', error);
      Alert.alert('Redemption Failed', 'An error occurred while redeeming this discount. Please try again later.');
    } finally {
      setRedeemLoading(false);
    }
  };
  
  const isOnline = discount?.discountType === 'ONLINE';
  
  if (loading || !discount) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContent}>
          <View style={[styles.loadingPlaceholder, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated header */}
      <Animated.View 
        style={[
          styles.animatedHeader,
          { backgroundColor: colors.background, opacity: headerOpacity, height: insets.top + 60, paddingTop: insets.top }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.Text
            style={[styles.headerTitle, { color: colors.text, opacity: headerTitleOpacity }]}
            numberOfLines={1}
          >
            {discount.title}
          </Animated.Text>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
            <ShareIcon size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Scrollable content */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* Hero Image Section */}
        <SharedElement id={`discount.${discount._id}.card`}>
          <Animated.View style={[styles.heroContainer, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}>
            <ImageBackground source={{ uri: discount.backgroundImage }} style={[styles.heroImage, { height: SCREEN_HEIGHT * 0.45 }]}>
              <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} style={styles.heroGradient}>
                <View style={[styles.heroOverlay, { paddingTop: insets.top + 10 }]}>
                  <View style={styles.heroActions}>
                    <TouchableOpacity style={[styles.heroButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={handleBackPress}>
                      <ArrowLeftIcon size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.heroButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]} onPress={handleSharePress}>
                      <ShareIcon size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.discountBadgeContainer}>
                    <MotiView
                      style={[styles.discountBadge, { backgroundColor: colors.primary }]}
                      from={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'timing', duration: 700, delay: 300 }}
                    >
                      <Text variant="headingLarge" color="#FFFFFF" weight="bold">
                        {discount.discountpercentage}%
                      </Text>
                      <Text variant="labelMedium" color="#FFFFFF">
                        OFF
                      </Text>
                    </MotiView>
                  </View>
                  
                  {discount.merchantLogo && (
                    <TouchableOpacity onPress={handleViewMerchant} activeOpacity={0.9}>
                      <Image 
                        source={{ uri: discount.merchantLogo }} 
                        style={[styles.merchantLogo, { borderColor: 'rgba(255,255,255,0.2)' }]} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </ImageBackground>
          </Animated.View>
        </SharedElement>
        
        {/* Content Section */}
        <MotiView
          style={[styles.contentContainer, { backgroundColor: colors.background }]}
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 200 }}
        >
          <View style={styles.titleSection}>
            <Text variant="headingMedium" color={colors.text} style={styles.title}>
              {discount.title}
            </Text>
            <TouchableOpacity style={styles.merchantButton} onPress={handleViewMerchant}>
              <Text variant="bodyMedium" color={colors.textSecondary} style={styles.merchantName}>
                {discount.merchantName}
              </Text>
            </TouchableOpacity>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <LocationPinIcon size={16} color={colors.textSecondary} />
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.metaText}>
                  {isOnline ? 'Online' : `${discount.merchantCity}, ${discount.merchantCountry}`}
                </Text>
              </View>
              <View style={[styles.discountType, { backgroundColor: isOnline ? `${colors.info}15` : `${colors.success}15` }]}>
                <Text variant="labelSmall" color={isOnline ? colors.info : colors.success}>
                  {isOnline ? 'Online' : 'In-Store'}
                </Text>
              </View>
            </View>
          </View>
          
          <MotiView
            style={[
              styles.expirationCard,
              { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
            ]}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 700, delay: 400 }}
          >
            <View style={styles.expirationHeader}>
              <Text variant="labelLarge" color={colors.text}>
                Expires In
              </Text>
              <View style={[
                styles.expirationBadge,
                {
                  backgroundColor: getDaysRemaining(discount.endDate) > 30 
                    ? `${colors.success}15` 
                    : getDaysRemaining(discount.endDate) > 7 
                      ? `${colors.warning}15` 
                      : `${colors.error}15`
                }
              ]}>
                <Text variant="labelSmall" color={
                  getDaysRemaining(discount.endDate) > 30 
                    ? colors.success 
                    : getDaysRemaining(discount.endDate) > 7 
                      ? colors.warning 
                      : colors.error
                }>
                  {getDaysRemaining(discount.endDate)} days
                </Text>
              </View>
            </View>
            
            <View style={styles.expirationDetails}>
              <CalendarIcon size={16} color={colors.textSecondary} />
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.expirationDate}>
                {formatEndDate(discount.endDate)}
              </Text>
            </View>
          </MotiView>
          
          <MotiView
            style={styles.descriptionSection}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 500 }}
          >
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Details
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.description}>
              {discount.description}
            </Text>
          </MotiView>
          
          <MotiView
            style={styles.redeemSection}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 600 }}
          >
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              How to Redeem
            </Text>
            <View style={styles.redeemSteps}>
              {isOnline ? (
                <>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">1</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Click the "Redeem Now" button below
                    </Text>
                  </View>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">2</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Copy your discount code that appears
                    </Text>
                  </View>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">3</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      You'll be directed to the merchant's website
                    </Text>
                  </View>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">4</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Enter the code at checkout to apply your discount
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">1</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Click "Redeem Now" to generate your unique discount code
                    </Text>
                  </View>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">2</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Show this screen with your code to the cashier
                    </Text>
                  </View>
                  <View style={styles.redeemStep}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                      <Text variant="labelMedium" color="#FFFFFF">3</Text>
                    </View>
                    <Text variant="bodyMedium" color={colors.text} style={styles.stepText}>
                      Present your student ID for verification
                    </Text>
                  </View>
                </>
              )}
            </View>
          </MotiView>
          
          <MotiView
            style={styles.termsSection}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 700 }}
          >
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Terms & Conditions
            </Text>
            <View style={styles.termsContainer}>
              {termsAndConditions.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <View style={[styles.termBullet, { backgroundColor: colors.primary }]} />
                  <Text variant="bodySmall" color={colors.textSecondary} style={styles.termText}>
                    {term}
                  </Text>
                </View>
              ))}
            </View>
          </MotiView>
          
          <View style={{ height: 120 }} />
        </MotiView>
      </Animated.ScrollView>
      
      <View 
        style={[
          styles.ctaContainer,
          {
            backgroundColor: colors.background,
            paddingBottom: Math.max(insets.bottom, SPACING.md),
            borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }
        ]}
      >
        <Button
          title={isOnline ? "Redeem Online" : "Redeem In Store"}
          onPress={handleRedeemPress}
          loading={redeemLoading}
          fullWidth
          style={styles.redeemButton}
          icon={<TagIcon size={18} color="white" />}
          iconPosition="left"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  loadingContent: {
    width: '100%',
    height: '75%',
  },
  loadingPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
  },
  heroImage: {
    width: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroOverlay: {
    flex: 1,
    padding: SPACING.lg,
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadgeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantLogo: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    marginTop: SPACING.md,
  },
  contentContainer: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -30,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: 4,
  },
  merchantButton: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  merchantName: {},
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 6,
  },
  discountType: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  expirationCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  expirationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  expirationBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  expirationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expirationDate: {
    marginLeft: 6,
  },
  descriptionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
  },
  description: {
    lineHeight: 22,
  },
  redeemSection: {
    marginBottom: SPACING.lg,
  },
  redeemSteps: {
    marginTop: SPACING.xs,
  },
  redeemStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
  },
  termsSection: {
    marginBottom: SPACING.lg,
  },
  termsContainer: {},
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  termBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: SPACING.sm,
  },
  termText: {
    flex: 1,
    lineHeight: 20,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    zIndex: 998,
  },
  redeemButton: {
    height: moderateScale(54),
  },
});

DiscountDetailsScreen.sharedElements = ({ route, otherRoute, showing }: any) => {
  const { discountId } = route.params;
  return [`discount.${discountId}.card`];
};

export default DiscountDetailsScreen;
