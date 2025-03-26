import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; 
import { useTheme } from '../context/ThemeContext'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  LockIcon,
  CreditCardIcon,
  StarIcon,
  AlertCircleIcon,
  InfoIcon,
  XIcon,
} from '../components/icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import ApiService from '../services/ApiService'; 

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

interface SubscriptionScreenProps {
  navigation: SubscriptionScreenNavigationProp;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

// Alert types for in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

// Single monthly subscription plan
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 100, // ₹100
    duration: 'month',
    features: [
      'Access to all premium discounts (70%+)',
      'Priority customer support',
      'Early access to new discounts',
    ],
  },
];

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const [loading, setLoading] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Alert state and animation
  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const USER_KEY = '@campusclub:user';

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

  // Handle subscription with Razorpay
  const handleSubscribe = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);

    try {
      // Create payment order
      const orderResponse = await ApiService.createPaymentOrder();
      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message?.toString() || 'Failed to create order');
      }
      const order = orderResponse.data.order;

      // Get user data for prefill
      const userJson = await AsyncStorage.getItem(USER_KEY);
      const user = userJson ? JSON.parse(userJson) : null;

      // Razorpay payment options
      const options = {
        description: 'CampusClub Monthly Subscription',
        currency: 'INR',
        key: 'rzp_test_KV9RHwNbUuHJOB', 
        amount: 10000, 
        name: 'CampusClub',
        order_id: order.id,
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
          ...(user?.contact && { contact: user.contact }), // Include contact only if available
        },
        theme: { color: '#F37254' },
      };

      // Open Razorpay checkout
      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment
      const verificationResponse = await ApiService.verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      if (verificationResponse.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        showAlert('success', 'Subscription successful! You now have access to all premium discounts.', 'Success', 1500);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      showAlert('error', error.message || 'Failed to process subscription. Please try again.', 'Payment Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Render the single plan card (no selection needed)
  const renderPlanCard = (plan: SubscriptionPlan) => (
    <MotiView
      key={plan.id}
      style={[
        styles.planCard,
        {
          backgroundColor: theme === 'dark' ? colors.backgroundSecondary : '#FFFFFF',
          borderColor: colors.primary,
        },
      ]}
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <View style={styles.planCardContent}>
        <View style={styles.planHeader}>
          <Text variant="titleMedium" color={colors.text} weight="600">
            {plan.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text variant="headingLarge" color={colors.primary} style={styles.price}>
              ₹{plan.price}
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.duration}>
              /{plan.duration}
            </Text>
          </View>
        </View>
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <CheckCircleIcon size={16} color={colors.primary} style={styles.featureIcon} />
              <Text variant="bodyMedium" color={colors.text} style={styles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </MotiView>
  );

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            opacity: headerOpacity,
            paddingTop: insets.top,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          <Animated.Text style={[styles.headerTitle, { color: colors.text, opacity: headerOpacity }]}>
            Campus Premium
          </Animated.Text>
          <View style={styles.headerRight} />
        </View>
      </Animated.View>
      <View style={styles.heroBackground}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.heroGradient}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 30 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <MotiView
          style={styles.heroSection}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <StarIcon size={40} color={colors.primary} style={styles.heroIcon} />
          <Text variant="headingLarge" color="#FFFFFF" style={styles.heroTitle}>
            Campus Premium
          </Text>
          <Text variant="bodyLarge" color="rgba(255, 255, 255, 0.9)" style={styles.heroSubtitle}>
            Unlock premium discounts and exclusive benefits!
          </Text>
        </MotiView>
        <MotiView
          style={[styles.mainContent, { backgroundColor: colors.background }]}
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          <View style={styles.benefitsSection}>
            <Text variant="titleMedium" color={colors.text} style={styles.sectionTitle}>
              Unlock Premium Benefits
            </Text>
            <View style={styles.benefitsList}>
              <View
                style={[
                  styles.benefitItem,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
              >
                <LockIcon size={24} color={colors.primary} style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text variant="labelLarge" color={colors.text}>
                    Premium Discounts
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Access exclusive discounts of 70% and above
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.benefitItem,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
              >
                <StarIcon size={24} color={colors.primary} style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text variant="labelLarge" color={colors.text}>
                    Priority Access
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Get early access to limited-time offers
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.benefitItem,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                ]}
              >
                <InfoIcon size={24} color={colors.primary} style={styles.benefitIcon} />
                <View style={styles.benefitContent}>
                  <Text variant="labelLarge" color={colors.text}>
                    Premium Support
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Get priority customer support when you need help
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.plansSection}>
            <Text variant="titleMedium" color={colors.text} style={styles.sectionTitle}>
              Your Plan
            </Text>
            <View style={styles.plansList}>{subscriptionPlans.map(renderPlanCard)}</View>
          </View>
          <View style={styles.disclaimerSection}>
            <View
              style={[
                styles.disclaimer,
                {
                  backgroundColor:
                    theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              ]}
            >
              <AlertCircleIcon size={20} color={colors.textSecondary} style={styles.disclaimerIcon} />
              <Text variant="bodySmall" color={colors.textSecondary} style={styles.disclaimerText}>
                Subscription is valid for one month. Renew manually through this screen. By subscribing,
                you agree to our terms and conditions.
              </Text>
            </View>
          </View>
          <Button
            title={`Subscribe for ₹${subscriptionPlans[0].price}/${subscriptionPlans[0].duration}`}
            onPress={handleSubscribe}
            loading={loading}
            fullWidth
            style={styles.subscribeButton}
            icon={<CreditCardIcon size={20} color="#FFFFFF" />}
            iconPosition="left"
          />
          <View style={styles.bottomSpacer} />
        </MotiView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 60,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 60,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  headerRight: { width: 40 },
  heroBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroSection: { paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  heroIcon: { marginBottom: SPACING.md },
  heroTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    textAlign: 'center',
    maxWidth: '90%',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  mainContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginTop: -20,
  },
  benefitsSection: { marginBottom: SPACING.xl },
  sectionTitle: { marginBottom: SPACING.md },
  benefitsList: {},
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  benefitIcon: { marginRight: SPACING.md },
  benefitContent: { flex: 1 },
  plansSection: { marginBottom: SPACING.xl },
  plansList: {},
  planCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  planCardContent: { padding: SPACING.md },
  planHeader: { marginBottom: SPACING.md },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginTop: SPACING.xs },
  price: {},
  duration: { marginLeft: 4 },
  featuresContainer: { marginBottom: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  featureIcon: { marginRight: SPACING.sm },
  featureText: { flex: 1 },
  disclaimerSection: { marginBottom: SPACING.lg },
  disclaimer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'flex-start',
  },
  disclaimerIcon: { marginRight: SPACING.sm, marginTop: 2 },
  disclaimerText: { flex: 1 },
  subscribeButton: { marginBottom: SPACING.xl },
  bottomSpacer: { height: 40 },
  // Alert styles (copied from LoginScreen.tsx)
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

export default SubscriptionScreen;