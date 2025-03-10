import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
  AppState,
  AppStateStatus,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { 
  horizontalScale, 
  verticalScale, 
  moderateScale,
  isTablet,
} from '../utils/responsiveUtils';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/ApiService';
import LottieView from 'lottie-react-native';
import { 
  CheckIcon, 
  ClockIcon, 
  AlertCircleIcon, 
  RefreshIcon,
} from '../components/icons';

type VerificationStatusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VerificationStatus'>;

interface VerificationStatusScreenProps {
  navigation: VerificationStatusScreenNavigationProp;
}

// Status types
type VerificationStatus = 'loading' | 'pending' | 'verified' | 'rejected' | 'error';

const VerificationStatusScreen: React.FC<VerificationStatusScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Lottie animation refs
  const pendingAnimationRef = useRef<LottieView>(null);
  const successAnimationRef = useRef<LottieView>(null);
  
  // AppState to detect when app comes to foreground
  const appState = useRef(AppState.currentState);
  
  // Start pulse animation
  useEffect(() => {
    // Pulsating animation for icons
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000, 
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
    
    return () => {
      pulseAnimation.stop();
    };
  }, []);
  
  // Run entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Check verification status on mount and when app comes to foreground
  useEffect(() => {
    checkVerificationStatus();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Auto refresh every 30 seconds if in pending state
    const refreshInterval = setInterval(() => {
      if (status === 'pending') {
        checkVerificationStatus(false);
      }
    }, 30000);
    
    return () => {
      subscription.remove();
      clearInterval(refreshInterval);
    };
  }, [status]);
  
  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      checkVerificationStatus();
    }
    appState.current = nextAppState;
  };
  
  // Fetch verification status from API
  const checkVerificationStatus = async (showLoading = true) => {
    if (showLoading) {
      setRefreshing(true);
    }
    
    try {
      const response = await ApiService.getStudentStatus();
      setLastChecked(new Date());
      
      if (response.success && response.data) {
        setStudentInfo(response.data);
        
        if (response.data.isVerified) {
          if (response.data.status === 'VERIFIED') {
            setStatus('verified');
            
            // Play success animation
            if (successAnimationRef.current) {
              successAnimationRef.current.play();
            }
            
            // Automatically navigate to main app after 2 seconds
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }, 2000);
          } else if (response.data.status === 'REJECTED') {
            setStatus('rejected');
          } else {
            setStatus('pending');
            
            // Play pending animation
            if (pendingAnimationRef.current && showLoading) {
              pendingAnimationRef.current.play();
            }
          }
        } else {
          setStatus('pending');
          
          // Play pending animation
          if (pendingAnimationRef.current && showLoading) {
            pendingAnimationRef.current.play();
          }
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    checkVerificationStatus();
  };
  
  // Navigate to login screen
  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  
  // Render content based on status
  const renderStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text 
              variant="bodyLarge" 
              color="#FFFFFF" 
              style={styles.loadingText}
            >
              Checking verification status...
            </Text>
          </View>
        );
        
      case 'pending':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.lottieContainer}>
              <LottieView
                ref={pendingAnimationRef}
                source={require('../assets/animations/verification-pending.json')}
                style={styles.pendingAnimation}
                autoPlay={false}
                loop={true}
              />
            </View>
            
            <Text 
              variant={isTablet ? "headingLarge" : "headingMedium"} 
              color="#FFFFFF" 
              style={styles.statusTitle}
            >
              Verification In Progress
            </Text>
            
            <Text 
              variant="bodyLarge" 
              color="rgba(255, 255, 255, 0.8)" 
              style={styles.statusText}
            >
              Your student ID is being reviewed by our team. This usually takes less than 24 hours.
            </Text>
            
            <View style={styles.lastCheckedContainer}>
              <Text 
                variant="labelSmall" 
                color="rgba(255, 255, 255, 0.6)"
              >
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
              
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={handleRefresh}
                disabled={refreshing}
              >
                <Animated.View 
                  style={[
                    styles.refreshIconContainer,
                    { 
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: [{ rotate: refreshing ? '360deg' : '0deg' }]
                    }
                  ]}
                >
                  <RefreshIcon size={20} color={colors.primary} />
                </Animated.View>
                <Text 
                  variant="labelMedium" 
                  color={colors.primary}
                >
                  {refreshing ? 'Checking...' : 'Check Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 'verified':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.lottieContainer}>
              <LottieView
                ref={successAnimationRef}
                source={require('../assets/animations/verification-success.json')}
                style={styles.successAnimation}
                autoPlay={false}
                loop={false}
              />
            </View>
            
            <Text 
              variant={isTablet ? "headingLarge" : "headingMedium"} 
              color="#FFFFFF" 
              style={styles.statusTitle}
            >
              Verification Successful!
            </Text>
            
            <Text 
              variant="bodyLarge" 
              color="rgba(255, 255, 255, 0.8)" 
              style={styles.statusText}
            >
              Your student status has been verified. Redirecting to the app...
            </Text>
          </View>
        );
        
      case 'rejected':
        return (
          <View style={styles.statusContainer}>
            <Animated.View 
              style={[
                styles.rejectedIconContainer, 
                { 
                  backgroundColor: 'rgba(255, 100, 100, 0.2)',
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <AlertCircleIcon size={60} color={colors.error} />
            </Animated.View>
            
            <Text 
              variant={isTablet ? "headingLarge" : "headingMedium"} 
              color="#FFFFFF" 
              style={styles.statusTitle}
            >
              Verification Rejected
            </Text>
            
            <Text 
              variant="bodyLarge" 
              color="rgba(255, 255, 255, 0.8)" 
              style={styles.statusText}
            >
              Unfortunately, we couldn't verify your student status. Please ensure your student ID is clear and try again.
            </Text>
            
            <Button
              title="Try Again"
              onPress={() => navigation.replace('OnboardingDocument')}
              fullWidth
              style={styles.actionButton}
            />
          </View>
        );
        
      case 'error':
        return (
          <View style={styles.statusContainer}>
            <Animated.View 
              style={[
                styles.errorIconContainer, 
                { 
                  backgroundColor: 'rgba(255, 100, 100, 0.2)',
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <AlertCircleIcon size={60} color={colors.error} />
            </Animated.View>
            
            <Text 
              variant={isTablet ? "headingLarge" : "headingMedium"} 
              color="#FFFFFF" 
              style={styles.statusTitle}
            >
              Something Went Wrong
            </Text>
            
            <Text 
              variant="bodyLarge" 
              color="rgba(255, 255, 255, 0.8)" 
              style={styles.statusText}
            >
              We encountered an error while checking your verification status. Please try again.
            </Text>
            
            <Button
              title="Try Again"
              onPress={handleRefresh}
              fullWidth
              style={styles.actionButton}
            />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      
      <Animated.View 
        style={[
          styles.content,
          { 
            paddingTop: insets.top + SPACING.md,
            paddingBottom: insets.bottom + SPACING.md,
            paddingHorizontal: horizontalScale(SPACING.lg),
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant={isTablet ? "displaySmall" : "headingLarge"} color="#FFFFFF">
            CampusClub
          </Text>
        </View>
        
        {/* Status Content */}
        <View style={styles.main}>
          {renderStatusContent()}
        </View>
        
        {/* Footer with logout button - Only show for pending/rejected/error states */}
        {(status === 'pending' || status === 'rejected' || status === 'error') && (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={goToLogin}
          >
            <Text variant="labelMedium" color="rgba(255, 255, 255, 0.7)">
              Back to Login
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E3A', // Fallback color
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: verticalScale(20),
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
  },
  lottieContainer: {
    marginBottom: verticalScale(20),
  },
  pendingAnimation: {
    width: moderateScale(180),
    height: moderateScale(180),
  },
  successAnimation: {
    width: moderateScale(200),
    height: moderateScale(200),
  },
  pendingIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  rejectedIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  errorIconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  statusTitle: {
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginBottom: verticalScale(30),
  },
  lastCheckedContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  refreshIconContainer: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(8),
  },
  actionButton: {
    marginTop: verticalScale(16),
  },
  logoutButton: {
    alignSelf: 'center',
    padding: SPACING.md,
  },
});

export default VerificationStatusScreen;