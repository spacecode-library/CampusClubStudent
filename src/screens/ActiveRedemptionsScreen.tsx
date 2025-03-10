import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Share,
  Clipboard,
  Alert,
  Image,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale, horizontalScale, verticalScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ShareIcon, 
  ClipboardIcon,
  CalendarIcon,
  ClockIcon,
  RefreshIcon,
  ExternalLinkIcon,
  AlertCircleIcon
} from '../components/icons';
import ApiService from '../services/ApiService';

type ActiveRedemptionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveRedemptions'>;
type ActiveRedemptionsScreenRouteProp = RouteProp<RootStackParamList, 'ActiveRedemptions'>;

interface ActiveRedemptionsScreenProps {
  navigation: ActiveRedemptionsScreenNavigationProp;
  route: ActiveRedemptionsScreenRouteProp;
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
    merchantLogo?: string;
    discountpercentage: number;
    storeLink?: string;
    backgroundImage?: string;
  };
  redemptionCode: string;
  redemptionDate: string;
  isRedeemed: boolean;
  createdAt: string;
  updatedAt: string;
}

const ActiveRedemptionsScreen: React.FC<ActiveRedemptionsScreenProps> = ({ navigation, route }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { redemptionId } = route.params || {};
  
  // Animation ref
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // State
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // Load redemption data
  useEffect(() => {
    fetchRedemptionDetails();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [redemptionId]);
  
  // Update time left every second
  useEffect(() => {
    if (!redemption) return;
    
    const timer = setInterval(() => {
      updateTimeLeft();
    }, 1000);
    
    updateTimeLeft();
    
    return () => clearInterval(timer);
  }, [redemption]);
  
  // Calculate time left until expiration
  const updateTimeLeft = () => {
    if (!redemption) return;
    
    const now = new Date();
    const redemptionDate = new Date(redemption.redemptionDate);
    
    // Add 30 days to redemption date as expiration (adjust based on your business logic)
    const expirationDate = new Date(redemptionDate);
    expirationDate.setDate(expirationDate.getDate() + 30);
    
    const difference = expirationDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      setTimeLeft('Expired');
      return;
    }
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    if (days > 0) {
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    } else {
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }
  };
  
  // Fetch redemption details from API
  const fetchRedemptionDetails = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, call API to get redemption details
      const response = await ApiService.getRedemptionById(redemptionId);
      
      if (response.success && response.data) {
        setRedemption(response.data);
      } else {
        Alert.alert('Error', 'Failed to load redemption details');
      }
    } catch (error) {
      console.error('Error fetching redemption details:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRedemptionDetails();
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Handle copy code
  const handleCopyCode = () => {
    if (!redemption) return;
    
    Clipboard.setString(redemption.redemptionCode);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert('Copied', 'Redemption code copied to clipboard');
  };
  
  // Handle share
  const handleShare = async () => {
    if (!redemption) return;
    
    try {
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      await Share.share({
        message: `Check out my discount from ${redemption.discountId.merchantName || 'CampusClub'}!\n\nDiscount: ${redemption.discountId.title}\nRedemption Code: ${redemption.redemptionCode}`,
      });
    } catch (error) {
      console.error('Error sharing redemption:', error);
    }
  };
  
  // Handle go to merchant
  const handleGoToMerchant = () => {
    if (!redemption || !redemption.discountId.storeLink) return;
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Linking.openURL(redemption.discountId.storeLink);
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
  
  // Check if redemption is online type
  const isOnlineRedemption = () => {
    return redemption?.discountId.discountType === 'ONLINE';
  };
  
  // Render loading state
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text 
          variant="bodyLarge" 
          color={colors.textSecondary}
          style={{ marginTop: SPACING.lg }}
        >
          Loading redemption details...
        </Text>
      </View>
    );
  }
  
  // If no redemption found, show error state
  if (!redemption) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <View style={[styles.errorIconContainer, { backgroundColor: `${colors.error}15` }]}>
          <AlertCircleIcon size={40} color={colors.error} />
        </View>
        <Text 
          variant="titleMedium" 
          color={colors.text}
          style={styles.errorTitle}
        >
          Redemption Not Found
        </Text>
        <Text 
          variant="bodyMedium" 
          color={colors.textSecondary}
          style={styles.errorMessage}
        >
          The redemption you're looking for doesn't exist or has expired.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={{ marginTop: SPACING.xl }}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: insets.top + SPACING.sm,
            paddingHorizontal: SPACING.lg
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.refreshButton}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: `${colors.primary}15` }
            ]}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <RefreshIcon 
              size={20} 
              color={colors.primary} 
              style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + SPACING.lg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Redemption Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Merchant Header */}
          <LinearGradient
            colors={[
              theme === 'dark' ? 'rgba(60, 60, 80, 1)' : 'rgba(100, 120, 200, 1)',
              theme === 'dark' ? 'rgba(30, 30, 50, 1)' : 'rgba(70, 90, 170, 1)'
            ]}
            style={styles.merchantHeader}
          >
            {/* Merchant Info */}
            <View style={styles.merchantInfo}>
              {redemption.discountId.merchantLogo ? (
                <Image
                  source={{ uri: redemption.discountId.merchantLogo }}
                  style={styles.merchantLogo}
                />
              ) : (
                <View 
                  style={[
                    styles.merchantLogoPlaceholder,
                    { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                  ]}
                >
                  <Text variant="titleLarge" color="#FFFFFF">
                    {redemption.discountId.merchantName?.charAt(0) || 'M'}
                  </Text>
                </View>
              )}
              
              <View style={styles.merchantTextContainer}>
                <Text variant="labelLarge" color="#FFFFFF">
                  {redemption.discountId.merchantName || 'Merchant'}
                </Text>
                
                <View style={styles.discountBadge}>
                  <Text variant="labelLarge" color="#FFFFFF" weight="600">
                    {redemption.discountId.discountpercentage}% OFF
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          
          {/* Redemption Details */}
          <View 
            style={[
              styles.redemptionDetails,
              { backgroundColor: colors.card }
            ]}
          >
            {/* Title */}
            <Text 
              variant="titleMedium" 
              color={colors.text}
              style={styles.title}
            >
              {redemption.discountId.title}
            </Text>
            
            {/* Description */}
            <Text 
              variant="bodyMedium" 
              color={colors.textSecondary}
              style={styles.description}
            >
              {redemption.discountId.description}
            </Text>
            
            {/* QR Code */}
            <View 
              style={[
                styles.qrContainer,
                { backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary }
              ]}
            >
              <View style={styles.qrInnerContainer}>
                <QRCode
                  value={redemption.redemptionCode}
                  size={moderateScale(180)}
                  backgroundColor='transparent'
                  color={theme === 'dark' ? '#FFFFFF' : '#000000'}
                />
                
                <Text 
                  variant="labelMedium" 
                  color={colors.textSecondary}
                  style={styles.qrHelpText}
                >
                  {isOnlineRedemption() ? 'Enter code at checkout' : 'Show to cashier'}
                </Text>
              </View>
            </View>
            
            {/* Redemption Code */}
            <View 
              style={[
                styles.codeContainer,
                { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
              ]}
            >
              <View style={styles.codeTextContainer}>
                <Text 
                  variant="labelSmall" 
                  color={colors.textSecondary}
                  style={styles.codeLabel}
                >
                  REDEMPTION CODE
                </Text>
                <Text 
                  variant="titleMedium" 
                  color={colors.text}
                  style={styles.codeText}
                >
                  {redemption.redemptionCode}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.copyButton,
                  { backgroundColor: `${colors.primary}15` }
                ]}
                onPress={handleCopyCode}
              >
                <ClipboardIcon size={18} color={colors.primary} />
                <Text 
                  variant="labelSmall" 
                  color={colors.primary}
                  style={styles.copyText}
                >
                  Copy
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Expiration info */}
            <View style={styles.dateInfoContainer}>
              <View style={styles.dateInfo}>
                <CalendarIcon size={16} color={colors.textSecondary} />
                <Text 
                  variant="bodySmall" 
                  color={colors.textSecondary}
                  style={styles.dateText}
                >
                  Redeemed on {formatDate(redemption.redemptionDate)}
                </Text>
              </View>
              
              <View style={styles.dateInfo}>
                <ClockIcon size={16} color={colors.textSecondary} />
                <Text 
                  variant="bodySmall" 
                  color={colors.textSecondary}
                  style={styles.dateText}
                >
                  Expires in {timeLeft}
                </Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: `${colors.primary}15` }
                ]}
                onPress={handleShare}
              >
                <ShareIcon size={20} color={colors.primary} />
                <Text 
                  variant="labelMedium" 
                  color={colors.primary}
                  style={styles.actionButtonText}
                >
                  Share
                </Text>
              </TouchableOpacity>
              
              {isOnlineRedemption() && redemption.discountId.storeLink && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary }
                  ]}
                  onPress={handleGoToMerchant}
                >
                  <ExternalLinkIcon size={20} color={colors.buttonText} />
                  <Text 
                    variant="labelMedium" 
                    color={colors.buttonText}
                    style={styles.actionButtonText}
                  >
                    Go to Store
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Usage Instructions */}
            <View 
              style={[
                styles.instructionsContainer,
                { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
              ]}
            >
              <Text 
                variant="labelMedium" 
                color={colors.text}
                style={styles.instructionsTitle}
              >
                {isOnlineRedemption() ? 'How to use online' : 'How to use in store'}
              </Text>
              
              {isOnlineRedemption() ? (
                <View style={styles.instructionsList}>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    1. Copy the redemption code above
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    2. Tap 'Go to Store' to visit the merchant's website
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    3. At checkout, enter the code in the coupon/promo code field
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    4. Complete your purchase with the discount applied
                  </Text>
                </View>
              ) : (
                <View style={styles.instructionsList}>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    1. Show this screen to the cashier at the store
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    2. They will scan the QR code or enter the redemption code
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    3. Show your student ID for verification
                  </Text>
                  <Text 
                    variant="bodySmall" 
                    color={colors.textSecondary}
                    style={styles.instructionText}
                  >
                    4. Your discount will be applied to your purchase
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: moderateScale(50),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  cardContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  merchantHeader: {
    padding: SPACING.md,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantLogo: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'white',
    marginRight: SPACING.md,
  },
  merchantLogoPlaceholder: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  merchantTextContainer: {
    flex: 1,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  redemptionDetails: {
    padding: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  description: {
    marginBottom: SPACING.lg,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  qrInnerContainer: {
    alignItems: 'center',
  },
  qrHelpText: {
    marginTop: SPACING.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  codeTextContainer: {
    flex: 1,
  },
  codeLabel: {
    marginBottom: 2,
  },
  codeText: {
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  copyText: {
    marginLeft: 4,
  },
  dateInfoContainer: {
    marginBottom: SPACING.lg,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dateText: {
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  actionButtonText: {
    marginLeft: 8,
  },
  instructionsContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  instructionsTitle: {
    marginBottom: SPACING.sm,
  },
  instructionsList: {
    
  },
  instructionText: {
    marginBottom: SPACING.xs,
  },
});

export default ActiveRedemptionsScreen;