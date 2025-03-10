import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  ImageBackground,
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
} from '../components/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { moderateScale, verticalScale, horizontalScale } from '../utils/responsiveUtils';

type SubscriptionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Subscription'>;

interface SubscriptionScreenProps {
  navigation: SubscriptionScreenNavigationProp;
}

// Subscription plan interface
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  savePercentage?: number;
}

// Mock subscription plans
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 4.99,
    duration: 'month',
    features: [
      'Access to all premium discounts (70%+)',
      'No ads',
      'Priority customer support',
      'Early access to new discounts'
    ]
  },
  {
    id: 'semester',
    name: 'Semester',
    price: 19.99,
    duration: '4 months',
    features: [
      'Access to all premium discounts (70%+)',
      'No ads',
      'Priority customer support',
      'Early access to new discounts',
      'Exclusive campus events'
    ],
    popular: true,
    savePercentage: 16
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 49.99,
    duration: 'year',
    features: [
      'Access to all premium discounts (70%+)',
      'No ads',
      'Priority customer support',
      'Early access to new discounts',
      'Exclusive campus events',
      'Friend referral bonuses',
      '24/7 premium support'
    ],
    savePercentage: 30
  }
];

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // State
  const [selectedPlan, setSelectedPlan] = useState<string>('semester');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlan(planId);
  };
  
  // Handle subscription purchase
  const handleSubscribe = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, implement payment processing here
      
      // Show success message
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      alert('Subscription successful! You now have access to all premium discounts.');
      
      // Navigate back to profile
      navigation.goBack();
      
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Go back to profile
  const handleBack = () => {
    navigation.goBack();
  };
  
  // Render subscription plan card
  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    
    return (
      <MotiView
        key={plan.id}
        style={[
          styles.planCard,
          { 
            backgroundColor: isSelected 
              ? theme === 'dark' 
                ? colors.backgroundSecondary 
                : '#FFFFFF'
              : theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)',
            borderColor: isSelected ? colors.primary : 'transparent',
          }
        ]}
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300 }}
      >
        <TouchableOpacity
          style={styles.planCardContent}
          onPress={() => handleSelectPlan(plan.id)}
          activeOpacity={0.8}
        >
          {/* Popular badge */}
          {plan.popular && (
            <View 
              style={[
                styles.popularBadge,
                { backgroundColor: colors.primary }
              ]}
            >
              <Text 
                variant="labelSmall" 
                color="#FFFFFF"
              >
                MOST POPULAR
              </Text>
            </View>
          )}
          
          {/* Plan header */}
          <View style={styles.planHeader}>
            <Text 
              variant="titleMedium" 
              color={colors.text}
              weight="600"
            >
              {plan.name}
            </Text>
            
            {/* Price and duration */}
            <View style={styles.priceContainer}>
              <Text 
                variant="headingLarge" 
                color={isSelected ? colors.primary : colors.text}
                style={styles.price}
              >
                ${plan.price}
              </Text>
              <Text 
                variant="bodyMedium" 
                color={colors.textSecondary}
                style={styles.duration}
              >
                /{plan.duration}
              </Text>
            </View>
            
            {/* Save percentage */}
            {plan.savePercentage && (
              <View 
                style={[
                  styles.saveBadge,
                  { backgroundColor: `${colors.success}20` }
                ]}
              >
                <Text 
                  variant="labelMedium" 
                  color={colors.success}
                >
                  Save {plan.savePercentage}%
                </Text>
              </View>
            )}
          </View>
          
          {/* Plan features */}
          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <CheckCircleIcon 
                  size={16} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                  style={styles.featureIcon}
                />
                <Text 
                  variant="bodyMedium" 
                  color={colors.text}
                  style={styles.featureText}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Selection indicator */}
          <View 
            style={[
              styles.selectionIndicator,
              { 
                borderColor: isSelected ? colors.primary : 'transparent',
                backgroundColor: isSelected ? 'white' : 'transparent',
              }
            ]}
          >
            {isSelected && (
              <View 
                style={[
                  styles.selectionDot,
                  { backgroundColor: colors.primary }
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            opacity: headerOpacity,
            paddingTop: insets.top,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <ArrowLeftIcon size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Animated.Text 
            style={[
              styles.headerTitle, 
              { 
                color: colors.text,
                opacity: headerOpacity
              }
            ]}
          >
            Campus Premium
          </Animated.Text>
          
          <View style={styles.headerRight} />
        </View>
      </Animated.View>
      
      {/* Hero Background */}
      <View style={styles.heroBackground}>
        <ImageBackground
          source={require('../assets/images/subscription-bg.jpg')} // Replace with your image
          style={styles.heroBgImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.1)',
              'rgba(0, 0, 0, 0.7)'
            ]}
            style={styles.heroGradient}
          />
        </ImageBackground>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero Section */}
        <MotiView
          style={styles.heroSection}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <StarIcon 
            size={40} 
            color={colors.primary} 
            style={styles.heroIcon}
          />
          
          <Text 
            variant="headingLarge" 
            color="#FFFFFF"
            style={styles.heroTitle}
          >
            Campus Premium
          </Text>
          
          <Text 
            variant="bodyLarge" 
            color="rgba(255, 255, 255, 0.9)"
            style={styles.heroSubtitle}
          >
            Unlock premium discounts and exclusive benefits!
          </Text>
        </MotiView>
        
        {/* Main Content */}
        <MotiView
          style={[
            styles.mainContent,
            { backgroundColor: colors.background }
          ]}
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          {/* Premium Benefits */}
          <View style={styles.benefitsSection}>
            <Text 
              variant="titleMedium" 
              color={colors.text}
              style={styles.sectionTitle}
            >
              Unlock Premium Benefits
            </Text>
            
            <View style={styles.benefitsList}>
              <View 
                style={[
                  styles.benefitItem,
                  { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                ]}
              >
                <LockIcon 
                  size={24} 
                  color={colors.primary} 
                  style={styles.benefitIcon}
                />
                <View style={styles.benefitContent}>
                  <Text 
                    variant="labelLarge" 
                    color={colors.text}
                  >
                    Premium Discounts
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                  >
                    Access exclusive discounts of 70% and above
                  </Text>
                </View>
              </View>
              
              <View 
                style={[
                  styles.benefitItem,
                  { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                ]}
              >
                <StarIcon 
                  size={24} 
                  color={colors.primary} 
                  style={styles.benefitIcon}
                />
                <View style={styles.benefitContent}>
                  <Text 
                    variant="labelLarge" 
                    color={colors.text}
                  >
                    Priority Access
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                  >
                    Get early access to limited-time offers
                  </Text>
                </View>
              </View>
              
              <View 
                style={[
                  styles.benefitItem,
                  { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
                ]}
              >
                <InfoIcon 
                  size={24} 
                  color={colors.primary} 
                  style={styles.benefitIcon}
                />
                <View style={styles.benefitContent}>
                  <Text 
                    variant="labelLarge" 
                    color={colors.text}
                  >
                    Premium Support
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                  >
                    Get priority customer support when you need help
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Choose Your Plan */}
          <View style={styles.plansSection}>
            <Text 
              variant="titleMedium" 
              color={colors.text}
              style={styles.sectionTitle}
            >
              Choose Your Plan
            </Text>
            
            <View style={styles.plansList}>
              {subscriptionPlans.map(plan => renderPlanCard(plan))}
            </View>
          </View>
          
          {/* Disclaimer */}
          <View style={styles.disclaimerSection}>
            <View 
              style={[
                styles.disclaimer,
                { 
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.02)' 
                }
              ]}
            >
              <AlertCircleIcon 
                size={20} 
                color={colors.textSecondary} 
                style={styles.disclaimerIcon}
              />
              <Text 
                variant="bodySmall" 
                color={colors.textSecondary}
                style={styles.disclaimerText}
              >
                Subscription renews automatically. Cancel anytime through your profile settings. By subscribing, you agree to our terms and conditions.
              </Text>
            </View>
          </View>
          
          {/* Subscribe Button */}
          <Button
            title={`Subscribe for $${subscriptionPlans.find(p => p.id === selectedPlan)?.price}/${subscriptionPlans.find(p => p.id === selectedPlan)?.duration}`}
            onPress={handleSubscribe}
            loading={loading}
            fullWidth
            style={styles.subscribeButton}
            icon={<CreditCardIcon size={20} color="#FFFFFF" />}
            iconPosition="left"
          />
          
          {/* Bottom space for safety */}
          <View style={styles.bottomSpacer} />
        </MotiView>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: SPACING.md,
  },
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
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  benefitsList: {
    
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  benefitIcon: {
    marginRight: SPACING.md,
  },
  benefitContent: {
    flex: 1,
  },
  plansSection: {
    marginBottom: SPACING.xl,
  },
  plansList: {
    
  },
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
  planCardContent: {
    padding: SPACING.md,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  planHeader: {
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
  },
  price: {
    
  },
  duration: {
    marginLeft: 4,
  },
  saveBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  featuresContainer: {
    marginBottom: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  featureIcon: {
    marginRight: SPACING.sm,
  },
  featureText: {
    flex: 1,
  },
  selectionIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  disclaimerSection: {
    marginBottom: SPACING.lg,
  },
  disclaimer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
  },
  subscribeButton: {
    marginBottom: SPACING.xl,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SubscriptionScreen;