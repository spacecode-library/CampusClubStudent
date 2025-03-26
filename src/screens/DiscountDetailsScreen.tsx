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
import ApiService from '../services/ApiService';

// Import icons
import {
  ArrowLeftIcon,
  ShareIcon,
  CalendarIcon,
  LocationPinIcon,
  TagIcon,
  AlertCircleIcon,
  XIcon,
  InfoIcon,
  CheckCircleIcon,
} from '../components/icons';

type DiscountDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DiscountDetails'>;
type DiscountDetailsScreenRouteProp = RouteProp<RootStackParamList, 'DiscountDetails'>;

interface DiscountDetailsScreenProps {
  navigation: DiscountDetailsScreenNavigationProp;
  route: DiscountDetailsScreenRouteProp;
}

// Alert types for in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

// Create a custom type that extends React.FC with a sharedElements property
interface SharedElementScreenComponent<P = {}> extends React.FC<P> {
  sharedElements?: (props: any) => string[];
}

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

const DiscountDetailsScreen: SharedElementScreenComponent<DiscountDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // State
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertData | null>(null);

  // Show in-screen alert
  const showAlert = (type: AlertType, message: string, title?: string, duration = 5000) => {
    setAlert({ type, message, title });

    // Animate alert in
    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        hideAlert();
      }, duration);
    }
  };

  // Hide in-screen alert
  const hideAlert = () => {
    Animated.timing(alertAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAlert(null);
    });
  };

  // Animation interpolations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.85, 1],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Fetch discount details
  useEffect(() => {
    const fetchDiscountData = async () => {
      try {
        setLoading(true);

        if (!route.params?.discountId) {
          throw new Error('Discount ID is required');
        }

        // Fetch from API using route.params.discountId
        const response = await ApiService.getDiscountById(route.params.discountId);

        if (response.success && response.data) {
          setDiscount(response.data);
        } else {
          throw new Error(
            Array.isArray(response.message) ? response.message[0] : response.message || 'Failed to fetch discount'
          );
        }
      } catch (error) {
        console.error('Error fetching discount details:', error);
        showAlert('error', 'Failed to load discount details. Please try again.', 'Error');
        setDiscount(null); // Ensure discount is null to trigger error state
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
      day: 'numeric',
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
      console.error('Error sharing:', error);
      showAlert('error', 'Failed to share the discount. Please try again.', 'Error');
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
    // Call the API to redeem the discount
    const response = await ApiService.redeemDiscount(discount._id);

    if (response.success && response.data) {
      // Check for redirect data
      if ('redirectTo' in response.data && response.data.redirectTo === 'subscription') {
        showAlert('info', 'A premium subscription is required to redeem this discount.', 'Subscription Required');
        setTimeout(() => {
          navigation.navigate('Subscription'); // Replace with your actual subscription screen route
        }, 1500);
        return;
      }
    
      const { redemptionCode } = response.data;
      if (redemptionCode) {
        setRedeemCode(redemptionCode);
        setIsRedeemed(true);
    
        showAlert('success', 'Discount redeemed successfully!', 'Success', 1500);
        setTimeout(() => {
          navigation.navigate('RedemptionSuccess', {
            redemptionId: `api-${Date.now()}`,
            discountTitle: discount.title,
            discountPercentage: discount.discountpercentage,
            merchantName: discount.merchantName,
            merchantLogo: discount.merchantLogo,
            redemptionCode: redemptionCode,
            isOnline: discount.discountType === 'ONLINE',
            storeLink: discount.storeLink,
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }, 1500);
      } else {
        throw new Error('Redemption code not provided in response');
      }
    } else {
      throw new Error(
        Array.isArray(response.message) ? response.message[0] : response.message || 'Failed to redeem discount'
      );
    } 
    
  } catch (error) {
    console.error('Error redeeming discount:', error);
    showAlert('error', 'An error occurred while redeeming this discount. Please try again later.', 'Redemption Failed');
  } finally {
    setRedeemLoading(false);
  }
};

  const isOnline = discount?.discountType === 'ONLINE';

  // Render alert icon based on type
  const renderAlertIcon = () => {
    if (!alert) return null;

    switch (alert.type) {
      case 'error':
        return <AlertCircleIcon size={24} color={colors.error} />;
      case 'success':
        return <CheckCircleIcon size={24} color={colors.success} />;
      case 'info':
        return <InfoIcon size={24} color={colors.info} />;
      default:
        return null;
    }
  };

  // Get alert background color based on type
  const getAlertBackgroundColor = () => {
    if (!alert) return colors.card;

    switch (alert.type) {
      case 'error':
        return theme === 'dark' ? '#3D1515' : '#FEE7E7';
      case 'success':
        return theme === 'dark' ? '#153D1A' : '#E7FEEA';
      case 'info':
        return theme === 'dark' ? '#15293D' : '#E7F2FE';
      default:
        return colors.card;
    }
  };

  // Get alert text color based on type
  const getAlertTextColor = () => {
    if (!alert) return colors.text;

    switch (alert.type) {
      case 'error':
        return theme === 'dark' ? '#FF9A9A' : '#D32F2F';
      case 'success':
        return theme === 'dark' ? '#9AFFAE' : '#2E7D32';
      case 'info':
        return theme === 'dark' ? '#9AC8FF' : '#1976D2';
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContent}>
          <View style={[styles.loadingPlaceholder, { backgroundColor: theme === 'dark' ? '#2A2A40' : '#EFEFEF' }]} />
        </View>
      </View>
    );
  }

  if (!discount) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContent}>
          <Text variant="headingMedium" color={colors.text} style={{ marginBottom: SPACING.md }}>
            Error
          </Text>
          <Text variant="bodyMedium" color={colors.textSecondary}>
            Failed to load discount details. Please try again later.
          </Text>
          <Button
            title="Go Back"
            onPress={handleBackPress}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* In-screen alert */}
      {alert && (
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: getAlertBackgroundColor(),
              transform: [
                {
                  translateY: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
                {
                  scale: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: alertAnimation,
              borderLeftWidth: 4,
              borderLeftColor: getAlertTextColor(),
            },
          ]}
        >
          <View style={styles.alertContent}>
            <View style={styles.alertIconContainer}>{renderAlertIcon()}</View>
            <View style={styles.alertTextContainer}>
              {alert.title && (
                <Text
                  variant="labelLarge"
                  style={[styles.alertTitle, { color: getAlertTextColor() }]}
                >
                  {alert.title}
                </Text>
              )}
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                {alert.message}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.alertCloseButton}
            onPress={hideAlert}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <XIcon size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Animated header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          { backgroundColor: colors.background, opacity: headerOpacity, height: insets.top + 60, paddingTop: insets.top },
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
              { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
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
                      : `${colors.error}15`,
                },
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
          },
        ]}
      >
        <Button
          title={isOnline ? 'Redeem Online' : 'Redeem In Store'}
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
  // Alert styles
  alertContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.md,
    right: SPACING.md,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: SPACING.sm,
    paddingTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    marginBottom: 2,
    fontWeight: '600',
  },
  alertCloseButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

DiscountDetailsScreen.sharedElements = ({ route, otherRoute, showing }: any) => {
  const { discountId } = route.params;
  return [`discount.${discountId}.card`];
};

export default DiscountDetailsScreen;