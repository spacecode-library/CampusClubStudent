import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
  Clipboard,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale, horizontalScale, verticalScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { 
  CheckCircleIcon, 
  ClipboardIcon, 
  ShareIcon, 
  ExternalLinkIcon,
  CalendarIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from '../components/icons';
import Card from '../components/Card';
import { LinearGradient } from 'expo-linear-gradient';

type RedemptionSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RedemptionSuccess'>;
type RedemptionSuccessScreenRouteProp = RouteProp<RootStackParamList, 'RedemptionSuccess'>;

interface RedemptionSuccessScreenProps {
  navigation: RedemptionSuccessScreenNavigationProp;
  route: RedemptionSuccessScreenRouteProp;
}

interface RedemptionSuccessParams {
  redemptionId: string;
  discountTitle: string;
  discountPercentage: number;
  merchantName?: string;
  merchantLogo?: string;
  redemptionCode: string;
  isOnline: boolean;
  storeLink?: string;
  expirationDate?: string;
}

const RedemptionSuccessScreen: React.FC<RedemptionSuccessScreenProps> = ({ navigation, route }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const lottieRef = useRef<LottieView>(null);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Get parameters from route
  const {
    redemptionId,
    discountTitle,
    discountPercentage,
    merchantName,
    merchantLogo,
    redemptionCode,
    isOnline,
    storeLink,
    expirationDate
  } = route.params as RedemptionSuccessParams;
  
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Run entrance animations
  useEffect(() => {
    // Start Lottie animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }
    
    // Provide haptic feedback on success
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Run animations
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate time remaining until expiration
  useEffect(() => {
    if (!expirationDate) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const expiry = new Date(expirationDate);
      const difference = expiry.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
        return;
      }
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft('Less than an hour remaining');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expirationDate]);
  
  // Copy code to clipboard
  const handleCopyCode = () => {
    Clipboard.setString(redemptionCode);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Alert.alert('Copied', 'Redemption code copied to clipboard');
  };
  
  // Share redemption
  const handleShare = async () => {
    try {
      const message = `Check out my discount from ${merchantName || 'CampusClub'}!\n\nDiscount: ${discountTitle}\nSave ${discountPercentage}% with code: ${redemptionCode}`;
      
      await Share.share({
        message,
      });
      
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  // Navigate to details
  const handleViewDetails = () => {
    navigation.replace('ActiveRedemptions', { redemptionId });
  };
  
  // Open merchant store
  const handleOpenStore = () => {
    if (storeLink) {
      Linking.openURL(storeLink);
    }
  };
  
  // Go to home
  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[
          theme === 'dark' ? '#1E1E3A' : '#5C6BC0',
          theme === 'dark' ? '#121212' : colors.background
        ]}
        style={styles.gradientBackground}
      />
      
      <View style={[styles.content, { paddingTop: insets.top }]}>
        {/* Success animation */}
        <View style={styles.animationContainer}>
          <LottieView
            ref={lottieRef}
            source={require('../assets/animations/success-confetti.json')}
            style={styles.lottieAnimation}
            loop={false}
          />
        </View>
        
        {/* Success Message */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text 
            variant="headingLarge" 
            color="#FFFFFF" 
            style={styles.successTitle}
          >
            Redemption Successful!
          </Text>
          <Text 
            variant="bodyLarge" 
            color="rgba(255, 255, 255, 0.9)" 
            style={styles.successMessage}
          >
            Your discount has been successfully redeemed. Use the code below at {isOnline ? 'checkout' : 'the store'}.
          </Text>
        </Animated.View>
        
        {/* Redemption Card */}
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
          style={styles.cardWrapper}
        >
          <Card
            style={[
              styles.card,
              { backgroundColor: colors.card }
            ]}
            variant="elevated"
            borderRadius={BORDER_RADIUS.xl}
          >
            {/* Merchant info */}
            <View style={styles.merchantInfo}>
              {merchantName && (
                <Text 
                  variant="bodyMedium" 
                  color={colors.textSecondary}
                  style={styles.merchantName}
                >
                  {merchantName}
                </Text>
              )}
              <Text 
                variant="titleLarge" 
                color={colors.text}
                style={styles.discountTitle}
              >
                {discountTitle}
              </Text>
              <Text 
                variant="displaySmall" 
                color={colors.primary}
                style={styles.discountPercentage}
              >
                {discountPercentage}% OFF
              </Text>
            </View>
            
            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            
            {/* Code section */}
            <View style={styles.codeSection}>
              <View style={styles.codeContainer}>
                <Text 
                  variant="labelMedium" 
                  color={colors.textSecondary}
                >
                  YOUR REDEMPTION CODE
                </Text>
                
                <Text 
                  variant="headingLarge" 
                  color={colors.text}
                  style={styles.code}
                >
                  {redemptionCode}
                </Text>
                
                {/* QR Code for in-store redemptions */}
                {!isOnline && (
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={redemptionCode}
                      size={moderateScale(120)}
                      backgroundColor="transparent"
                      color={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    />
                  </View>
                )}
                
                {/* Expiration info */}
                {expirationDate && (
                  <View style={styles.expirationContainer}>
                    <CalendarIcon 
                      size={16} 
                      color={timeLeft === 'Expired' ? colors.error : colors.textSecondary} 
                    />
                    <Text 
                      variant="bodySmall" 
                      color={timeLeft === 'Expired' ? colors.error : colors.textSecondary}
                      style={styles.expirationText}
                    >
                      {timeLeft}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Action buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: `${colors.primary}15` }
                  ]}
                  onPress={handleCopyCode}
                >
                  <ClipboardIcon size={20} color={colors.primary} />
                  <Text 
                    variant="labelMedium" 
                    color={colors.primary}
                    style={styles.actionButtonText}
                  >
                    Copy
                  </Text>
                </TouchableOpacity>
                
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
                
                {isOnline && storeLink && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.primary }
                    ]}
                    onPress={handleOpenStore}
                  >
                    <ExternalLinkIcon size={20} color={colors.buttonText} />
                    <Text 
                      variant="labelMedium" 
                      color={colors.buttonText}
                      style={styles.actionButtonText}
                    >
                      Visit Store
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Card>
        </MotiView>
        
        {/* View Details Button */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 800 }}
          style={styles.viewDetailsContainer}
        >
          <Button
            title="View Details"
            onPress={handleViewDetails}
            variant="outlined"
            icon={<ArrowRightIcon size={18} color={colors.primary} />}
            iconPosition="right"
            style={styles.viewDetailsButton}
          />
        </MotiView>
        
        {/* Home Button */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 1000 }}
          style={styles.homeButtonContainer}
        >
          <TouchableOpacity
            onPress={handleBackToHome}
          >
            <Text 
              variant="labelMedium" 
              color={colors.primary}
            >
              Back to Home
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  animationContainer: {
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  lottieAnimation: {
    width: moderateScale(200),
    height: moderateScale(200),
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  successTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: horizontalScale(340),
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  merchantInfo: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  merchantName: {
    marginBottom: SPACING.xs,
  },
  discountTitle: {
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  discountPercentage: {
    marginVertical: SPACING.sm,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  codeSection: {
    padding: SPACING.lg,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  code: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  qrContainer: {
    marginVertical: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.md,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  expirationText: {
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.xs,
    minWidth: horizontalScale(90),
  },
  actionButtonText: {
    marginLeft: 6,
  },
  viewDetailsContainer: {
    alignItems: 'center',
    marginTop: verticalScale(30),
  },
  viewDetailsButton: {
    minWidth: horizontalScale(180),
  },
  homeButtonContainer: {
    alignItems: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
  },
});

export default RedemptionSuccessScreen;