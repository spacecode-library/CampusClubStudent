import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import Text from '../components/Text';
import Input from '../components/Input';
import Button from '../components/Button';
import { SPACING } from '../constants/globalStyles';
import { 
  EmailIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon, 
  ThemeToggleIcon, 
  AlertCircleIcon, 
  XIcon, 
  CheckCircleIcon,
  InfoIcon
} from '../components/icons';
import ApiService from '../services/ApiService';
import { 
  horizontalScale, 
  verticalScale, 
  moderateScale,
  isSmallDevice,
  isTablet
} from '../utils/responsiveUtils';

// Import our custom LogoSvg component
import LogoSvg from '../components/Logosvg';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Alert types for our custom in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const [logoScale] = useState(new Animated.Value(0.8));
  const [logoOpacity] = useState(new Animated.Value(0));
  const [formTranslateY] = useState(new Animated.Value(50));
  const [formOpacity] = useState(new Animated.Value(0));
  
  // Form validation
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  // Show in-screen alert
  const showAlert = (type: AlertType, message: string, title?: string, duration = 5000) => {
    setAlert({ type, message, title });
    
    // Animate alert in
    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8
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
      useNativeDriver: true
    }).start(() => {
      setAlert(null);
    });
  };
  
  // Run entrance animations
  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // First animate the logo
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // Then animate the form
      Animated.parallel([
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { email: '', password: '' };
  
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { 
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
  
    if (!password.trim()) {  // Added trim() to avoid spaces being valid
      newErrors.password = 'Password is required';
      isValid = false;
    }
  
    setErrors(newErrors);  // ✅ Set errors properly
  
    return isValid;
  };
  
  
  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await ApiService.login(email, password);
      
      if (response.success && response.data) {
        // Check if student onboarding is complete
        const studentStatus = await ApiService.getStudentStatus();
        
        if (studentStatus.success && studentStatus.data) {
          if (!studentStatus.data.isVerified) {
            // Student is not verified, go to onboarding stack
            showAlert('info', 'Your account needs to be verified.', 'Verification Required', 1500);
            setTimeout(() => {
              navigation.navigate('OnboardingWelcome');
            }, 1500);
          } else if (studentStatus.data.status === 'PENDING') {
            // Student is waiting for approval
            showAlert('info', 'Your account is waiting for admin approval.', 'Account Pending Approval');
          } else if (studentStatus.data.status === 'VERIFIED') {
            // Student is verified, go to main tabs
            showAlert('success', 'Login successful!', 'Welcome Back', 1500);
            setTimeout(() => {
              navigation.navigate('MainTabs');
            }, 1500);
          } else if (studentStatus.data.status === 'REJECTED') {
            // Student was rejected
            showAlert('error', 'Your verification was rejected. Please contact support for more information.', 'Verification Rejected');
          }
        } else {
          // No student record, go to onboarding
          showAlert('info', 'Please complete the onboarding process.', 'Account Setup', 1500);
          setTimeout(() => {
            navigation.navigate('OnboardingVerification');
          }, 1500);
        }
      } else {
        // Show error message
        const errorMessage = Array.isArray(response.message) ? response.message[0] : response.message;
        showAlert('error', errorMessage, 'Login Failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', 'An unexpected error occurred. Please try again later.', 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to sign up screen
  const goToSignUp = () => {
    navigation.navigate('SignUp');
  };
  
  // Calculate responsive dimensions
  const logoSize = isTablet ? moderateScale(120) : moderateScale(isSmallDevice ? 80 : 100);
  const logoMarginTop = verticalScale(isSmallDevice ? 20 : 40);
  const logoMarginBottom = verticalScale(isSmallDevice ? 20 : 40);
  
  // Render alert icon based on type
  const renderAlertIcon = () => {
    if (!alert) return null;
    
    switch(alert.type) {
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
    
    switch(alert.type) {
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
    
    switch(alert.type) {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* In-screen alert */}
      {alert && (
        <Animated.View 
          style={[
            styles.alertContainer,
            { 
              backgroundColor: getAlertBackgroundColor(),
              transform: [
                { translateY: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0]
                  })
                },
                { scale: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }
              ],
              opacity: alertAnimation,
              borderLeftWidth: 4,
              borderLeftColor: getAlertTextColor(),
            }
          ]}
        >
          <View style={styles.alertContent}>
            <View style={styles.alertIconContainer}>
              {renderAlertIcon()}
            </View>
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
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Theme Toggle Button */}
          <TouchableOpacity 
            style={styles.themeToggle} 
            onPress={toggleTheme}
          >
            <ThemeToggleIcon size={24} color={colors.text} />
          </TouchableOpacity>
          
          {/* Logo and Welcome */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
                marginTop: logoMarginTop,
                marginBottom: logoMarginBottom,
              }
            ]}
          >
            <View 
              style={[
                styles.logoCircle, 
                { 
                  backgroundColor: colors.primary,
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize / 2,
                }
              ]}
            >
             {/* Use our custom LogoSvg component */}
             <LogoSvg
                width={logoSize * 0.98}
                height={logoSize * 0.98}
                fill={colors.buttonText}
              />
            </View>
            <Text 
              variant={isTablet ? "displayMedium" : isSmallDevice ? "headingLarge" : "displaySmall"} 
              style={styles.appName}
            >
              CampusClub
            </Text>
            <Text 
              variant={isSmallDevice ? "bodyMedium" : "bodyLarge"} 
              color={colors.textSecondary} 
              style={styles.tagline}
            >
              Student discounts, simplified.
            </Text>
          </Animated.View>
          
          {/* Login Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslateY }],
              }
            ]}
          >
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              leftIcon={<EmailIcon size={20} color={colors.primary} />}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              leftIcon={<LockIcon size={20} color={colors.primary} />}
              rightIcon={showPassword ? <EyeOffIcon size={20} color={colors.primary} /> : <EyeIcon size={20} color={colors.primary} />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={errors.password}
              secure={!showPassword}
              disabled={loading}
            />
            
            <Button
              title="Log In"
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              fullWidth
              style={styles.button}
            />
            
            <View style={styles.signupContainer}>
              <Text variant="bodyMedium" color={colors.textSecondary}>
                New to CampusClub?
              </Text>
              <TouchableOpacity onPress={goToSignUp} disabled={loading}>
                <Text variant="labelMedium" color={colors.primary} style={styles.signupText}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: verticalScale(20),
  },
  themeToggle: {
    position: 'absolute',
    top: verticalScale(16),
    right: horizontalScale(16),
    padding: SPACING.xs,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    marginBottom: SPACING.xs,
  },
  tagline: {
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  button: {
    marginTop: SPACING.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signupText: {
    marginLeft: SPACING.xs,
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

export default LoginScreen;