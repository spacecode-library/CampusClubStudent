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
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import Input from '../components/Input';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { 
  EmailIcon, 
  LockIcon, 
  UserIcon, 
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
import AsyncStorage from '@react-native-async-storage/async-storage';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

interface SignUpScreenProps {
  navigation: SignUpScreenNavigationProp;
}

// Alert types for our custom in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  
  // Scroll state
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Alert state
  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(1));
  const [otpFadeAnim] = useState(new Animated.Value(0));
  const formTranslateY = useRef(new Animated.Value(50)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Form validation
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
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
    // Animate form
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Animate between form and OTP screens
  const animateToOtp = () => {
    Animated.parallel([
      // Fade out form
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      
      // Fade in OTP form
      Animated.timing(otpFadeAnim, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOtpSent(true);
    });
  };
  
  // Validate the form
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: '',
    };
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\\S+@\\S+\\.\\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    } else if (!email.includes('.edu')) {
      newErrors.email = 'Please use your university email (.edu)';
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password should be at least 8 characters';
      isValid = false;
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    setErrors(newErrors);
    
    return isValid;
  };
  
  // Validate OTP
  const validateOtp = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors, otp: '' };
    
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
      isValid = false;
    } else if (otp.length !== 4) {
      newErrors.otp = 'OTP should be 4 digits';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle signup
  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Cache the email temporarily for use after OTP verification
      await AsyncStorage.setItem('@temp_registration_email', email);
      
      const response = await ApiService.register(name, email, password);
      
      if (response.success && response.data) {
        setRequestId(response.data.id);
        
        // Show success message
        showAlert('success', 'Account created successfully! Please verify your email.', 'Success');
        
        // Animate transition to OTP screen
        animateToOtp();
        
        // Scroll back to top when switching to OTP screen
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      } else {
        // Show error message
        const errorMessage = Array.isArray(response.message) ? response.message[0] : response.message;
        showAlert('error', errorMessage, 'Registration Failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      showAlert('error', 'An unexpected error occurred. Please try again later.', 'Registration Failed');
    } finally {
      setLoading(false);
    }
  };
  
  
  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;
    
    setLoading(true);
    
    try {
      const response = await ApiService.verifyStudentOtp(requestId, otp);
      
      if (response.success && response.data) {
        // Store user information INCLUDING THE EMAIL
        const userInfo = {
          id: response.data.identityId,
          email: email // Store the email here
        };
        await AsyncStorage.setItem('@campusclub:user', JSON.stringify(userInfo));
        
        // Show success message briefly before navigation
        showAlert('success', 'Your email has been verified successfully!', 'Success', 1500);
        
        // Navigate to onboarding welcome screen after a short delay
        setTimeout(() => {
          navigation.navigate('OnboardingWelcome');
        }, 1500);
      } else {
        // Show error message
        const errorMessage = Array.isArray(response.message) ? response.message[0] : response.message;
        showAlert('error', errorMessage, 'Verification Failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showAlert('error', 'An unexpected error occurred. Please try again later.', 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    
    try {
      const response = await ApiService.resendStudentOtp(requestId);
      
      if (response.success) {
        showAlert('success', 'A new verification code has been sent to your email.', 'Code Resent');
      } else {
        // Show error message
        const errorMessage = Array.isArray(response.message) ? response.message[0] : response.message;
        showAlert('error', errorMessage, 'Resend Failed');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showAlert('error', 'An unexpected error occurred. Please try again later.', 'Resend Failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to login screen
  const goToLogin = () => {
    navigation.navigate('Login');
  };
  
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
        backgroundColor="transparent"
        translucent
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
                {alert.message.startsWith('\n') ? alert.message : `• ${alert.message}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.alertCloseButton} 
            onPress={hideAlert}
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
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with theme toggle */}
          <View style={styles.header}>
            <Text variant="headingLarge">CampusClub</Text>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <ThemeToggleIcon size={24} />
            </TouchableOpacity>
          </View>
          
          {/* Main content */}
          <View style={styles.content}>
            {/* Sign Up Form */}
            <Animated.View 
              style={[
                styles.formContainer,
                { opacity: fadeAnim },
                { display: otpSent ? 'none' : 'flex' }
              ]}
            >
              <Text variant="displaySmall" style={styles.title}>Create Account</Text>
              <Text variant="bodyLarge" color={colors.textSecondary} style={styles.subtitle}>
                Join the student community and unlock exclusive discounts!
              </Text>
              
              <View style={styles.form}>
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  leftIcon={<UserIcon size={20} color={colors.primary} />}
                  error={errors.name}
                  autoCapitalize="words"
                  disabled={loading}
                />
                
                <Input
                  label="University Email"
                  placeholder="youremail@university.edu"
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
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  leftIcon={<LockIcon size={20} color={colors.primary} />}
                  rightIcon={showPassword ? <EyeOffIcon size={20} color={colors.primary} /> : <EyeIcon size={20} color={colors.primary} />}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                  secure={!showPassword}
                  disabled={loading}
                />
                
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  leftIcon={<LockIcon size={20} color={colors.primary} />}
                  rightIcon={showConfirmPassword ? <EyeOffIcon size={20} color={colors.primary} /> : <EyeIcon size={20} color={colors.primary} />}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  error={errors.confirmPassword}
                  secure={!showConfirmPassword}
                  disabled={loading}
                />
                
                <Button
                  title="Sign Up"
                  onPress={handleSignUp}
                  disabled={loading}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                />
                
                <View style={styles.loginContainer}>
                  <Text variant="bodyMedium" color={colors.textSecondary}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity onPress={goToLogin} disabled={loading}>
                    <Text variant="labelMedium" color={colors.primary} style={styles.loginText}>
                      Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
            
            {/* OTP Verification */}
            <Animated.View 
              style={[
                styles.formContainer,
                { opacity: otpFadeAnim },
                { display: otpSent ? 'flex' : 'none' }
              ]}
            >
              <Text variant="displaySmall" style={styles.title}>Verify Email</Text>
              <Text variant="bodyLarge" color={colors.textSecondary} style={styles.subtitle}>
                We've sent a 4-digit code to {email}. Please enter it below to verify your account.
              </Text>
              
              <View style={styles.form}>
                <Input
                  label="Verification Code"
                  placeholder="Enter 4-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  error={errors.otp}
                  keyboardType="number-pad"
                  maxLength={4}
                  disabled={loading}
                />
                
                <Button
                  title="Verify"
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  loading={loading}
                  fullWidth
                  style={styles.button}
                />
                
                <TouchableOpacity 
                  onPress={handleResendOtp} 
                  disabled={loading} 
                  style={styles.resendContainer}
                >
                  <Text variant="labelMedium" color={colors.primary}>
                    Didn't receive code? Resend
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.loginContainer}>
                  <Text variant="bodyMedium" color={colors.textSecondary}>
                    Changed your mind?
                  </Text>
                  <TouchableOpacity onPress={goToLogin} disabled={loading}>
                    <Text variant="labelMedium" color={colors.primary} style={styles.loginText}>
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  themeToggle: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    marginLeft: SPACING.xs,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
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

export default SignUpScreen;