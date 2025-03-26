import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import Text from '../components/Text';
import Input from '../components/Input';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import {
  EmailIcon,
  UniversityIcon,
  UserIcon,
  ArrowRightIcon,
  ThemeToggleIcon,
  AlertCircleIcon, // Added for alerts
  CheckCircleIcon, // Added for alerts
  InfoIcon, // Added for alerts
  XIcon, // Added for alert close button
} from '../components/icons';
import ApiService from '../services/ApiService';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import {
  horizontalScale,
  verticalScale,
  moderateScale,
  isSmallDevice,
  isTablet,
  useOrientation,
} from '../utils/responsiveUtils';

type OnboardingVerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OnboardingVerification'
>;

interface OnboardingVerificationScreenProps {
  navigation: OnboardingVerificationScreenNavigationProp;
}

// Interface for dropdown items
interface DropdownItem {
  label: string;
  value: string;
}

// Alert types for in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

const OnboardingVerificationScreen: React.FC<OnboardingVerificationScreenProps> = ({
  navigation,
}) => {
  const { colors, styles, theme, toggleTheme } = useTheme();
  const orientation = useOrientation();

  // Form state
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [startYear, setStartYear] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [studentID, setStudentID] = useState('');

  // Location state with ID and name separation
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [selectedState, setSelectedState] = useState<IState | null>(null);
  const [selectedCity, setSelectedCity] = useState<ICity | null>(null);

  // Dropdown data
  const [countries, setCountries] = useState<DropdownItem[]>([]);
  const [states, setStates] = useState<DropdownItem[]>([]);
  const [cities, setCities] = useState<DropdownItem[]>([]);

  // Loading states for dropdowns
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: OTP

  // Alert state and animation
  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const otpOpacity = useRef(new Animated.Value(0)).current;
  const otpTranslateY = useRef(new Animated.Value(30)).current;

  // Form validation
  const [errors, setErrors] = useState({
    email: '',
    university: '',
    major: '',
    startYear: '',
    gradYear: '',
    studentID: '',
    country: '',
    state: '',
    city: '',
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

  // Run entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load countries on component mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load countries
  const loadCountries = () => {
    try {
      const countryList = Country.getAllCountries();
      const formattedCountries = countryList.map((country) => ({
        label: country.name,
        value: country.isoCode,
      }));

      setCountries(formattedCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      showAlert('error', 'Failed to load countries. Please try again.', 'Error');
    }
  };

  // Load states based on selected country
  const loadStates = (countryCode: string) => {
    setLoadingStates(true);
    try {
      const stateList = State.getStatesOfCountry(countryCode);
      const formattedStates = stateList.map((state) => ({
        label: state.name,
        value: state.isoCode,
      }));

      setStates(formattedStates);
    } catch (error) {
      console.error('Error loading states:', error);
      showAlert('error', 'Failed to load states. Please try again.', 'Error');
    } finally {
      setLoadingStates(false);
    }
  };

  // Load cities based on selected country and state
  const loadCities = (countryCode: string, stateCode: string) => {
    setLoadingCities(true);
    try {
      const cityList = City.getCitiesOfState(countryCode, stateCode);
      const formattedCities = cityList.map((city) => ({
        label: city.name,
        value: city.name, // City doesn't have a unique code, so using name as value
      }));

      setCities(formattedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
      showAlert('error', 'Failed to load cities. Please try again.', 'Error');
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (item: DropdownItem) => {
    const country = Country.getCountryByCode(item.value);
    setSelectedCountry(country || null);
    setSelectedState(null);
    setSelectedCity(null);
    setStates([]);
    setCities([]);
    loadStates(item.value);

    // Clear any validation errors
    setErrors({
      ...errors,
      country: '',
      state: '',
      city: '',
    });
  };

  // Handle state selection
  const handleStateSelect = (item: DropdownItem) => {
    if (!selectedCountry) return;

    const state = State.getStateByCodeAndCountry(item.value, selectedCountry.isoCode);
    setSelectedState(state || null);
    setSelectedCity(null);
    setCities([]);
    loadCities(selectedCountry.isoCode, item.value);

    // Clear city validation error
    setErrors({
      ...errors,
      state: '',
      city: '',
    });
  };

  // Handle city selection
  const handleCitySelect = (item: DropdownItem) => {
    setSelectedCity({ name: item.label } as ICity);

    // Clear validation error
    setErrors({
      ...errors,
      city: '',
    });
  };

  // Animate between form and OTP screens
  const animateToOtp = () => {
    Animated.parallel([
      // Fade out form
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: -30,
        duration: 300,
        useNativeDriver: true,
      }),

      // Fade in OTP form
      Animated.timing(otpOpacity, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(otpTranslateY, {
        toValue: 0,
        duration: 300,
        delay: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(2);
    });
  };

  // Validate the form
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      email: '',
      university: '',
      major: '',
      startYear: '',
      gradYear: '',
      studentID: '',
      country: '',
      state: '',
      city: '',
      otp: '',
    };

    const currentYear = new Date().getFullYear();

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    } else if (!email.includes('.edu')) {
      newErrors.email = 'Please use a .edu email address';
      isValid = false;
    }

    // University validation
    if (!university.trim()) {
      newErrors.university = 'University is required';
      isValid = false;
    }

    // Major validation
    if (!major.trim()) {
      newErrors.major = 'Major is required';
      isValid = false;
    }

    // Start year validation
    if (!startYear.trim()) {
      newErrors.startYear = 'Start year is required';
      isValid = false;
    } else if (!/^\d{4}$/.test(startYear)) {
      newErrors.startYear = 'Enter a valid year';
      isValid = false;
    } else if (parseInt(startYear) > currentYear) {
      newErrors.startYear = 'Start year cannot be in the future';
      isValid = false;
    } else if (parseInt(startYear) < currentYear - 10) {
      newErrors.startYear = 'Start year seems too far in the past';
      isValid = false;
    }

    // Graduation year validation
    if (!gradYear.trim()) {
      newErrors.gradYear = 'Graduation year is required';
      isValid = false;
    } else if (!/^\d{4}$/.test(gradYear)) {
      newErrors.gradYear = 'Enter a valid year';
      isValid = false;
    } else if (parseInt(gradYear) < currentYear) {
      newErrors.gradYear = 'Graduation year cannot be in the past';
      isValid = false;
    } else if (parseInt(gradYear) > currentYear + 10) {
      newErrors.gradYear = 'Graduation year seems too far in the future';
      isValid = false;
    }

    // Student ID validation
    if (!studentID.trim()) {
      newErrors.studentID = 'Student ID is required';
      isValid = false;
    }

    // Location validation
    if (!selectedCountry) {
      newErrors.country = 'Country is required';
      isValid = false;
    }

    if (!selectedState) {
      newErrors.state = 'State/Province is required';
      isValid = false;
    }

    if (!selectedCity) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      // Show an in-screen alert summarizing the validation errors
      const errorMessages = Object.values(newErrors)
        .filter((error) => error)
        .join('. ');
      showAlert('error', errorMessages, 'Form Incomplete');
    }

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

    if (!isValid) {
      showAlert('error', newErrors.otp, 'Invalid OTP');
    }

    return isValid;
  };

  // Handle continue
  const handleContinue = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await ApiService.initiateVerification(email, {
        university,
        major,
        StartYear: parseInt(startYear),
        GraduationYear: parseInt(gradYear),
        StudentID: studentID,
        StudentCountry: selectedCountry?.name || '',
        StudentState: selectedState?.name || '',
        StudentCity: selectedCity?.name || '',
        email: email,
      });

      if (response.data) {
        setRequestId(response.data.requestId);
        setOtpSent(true);
        animateToOtp();
      } else {
        console.error('Initiate verification error:', response.success, response.message);
        showAlert(
          'error',
          Array.isArray(response.message) ? response.message[0] : response.message,
          'Verification Failed'
        );
      }
    } catch (error) {
      console.error('Initiate verification error:', error);
      showAlert('error', 'An unexpected error occurred', 'Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;

    setLoading(true);

    try {
      const response = await ApiService.verifyStudentOtp(requestId, otp);

      if (response.success) {
        // Show success alert before navigating
        showAlert('success', 'Email verified successfully!', 'OTP Verified', 1500);
        setTimeout(() => {
          // Navigate to document upload screen
          navigation.navigate('OnboardingDocument');
        }, 1500);
      } else {
        showAlert(
          'error',
          Array.isArray(response.message) ? response.message[0] : response.message,
          'OTP Verification Failed'
        );
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showAlert('error', 'An unexpected error occurred', 'Verification Failed');
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
        showAlert('success', 'A new OTP has been sent to your email', 'OTP Resent', 1500);
      } else {
        showAlert(
          'error',
          Array.isArray(response.message) ? response.message[0] : response.message,
          'Resend Failed'
        );
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showAlert('error', 'An unexpected error occurred', 'Resend Failed');
    } finally {
      setLoading(false);
    }
  };

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
    <ScreenContainer scrollable={true} statusBarStyle={theme === 'dark' ? 'light-content' : 'dark-content'}>
      {/* In-screen alert */}
      {alert && (
        <Animated.View
          style={[
            localStyles.alertContainer,
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
          <View style={localStyles.alertContent}>
            <View style={localStyles.alertIconContainer}>{renderAlertIcon()}</View>
            <View style={localStyles.alertTextContainer}>
              {alert.title && (
                <Text
                  variant="labelLarge"
                  style={[localStyles.alertTitle, { color: getAlertTextColor() }]}
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
            style={localStyles.alertCloseButton}
            onPress={hideAlert}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <XIcon size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.layout.paddedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        {/* Header with theme toggle */}
        <View style={localStyles.header}>
          <Text variant="headingLarge">CampusClub</Text>
          <TouchableOpacity style={localStyles.themeToggle} onPress={toggleTheme}>
            <ThemeToggleIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={localStyles.progressContainer}>
          <View style={localStyles.progressBar}>
            <View
              style={[
                localStyles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: currentStep === 1 ? '50%' : '100%',
                },
              ]}
            />
          </View>
          <Text variant="labelSmall" color={colors.textSecondary}>
            Step {currentStep} of 2
          </Text>
        </View>

        {/* Form Content */}
        <Animated.View
          style={[
            localStyles.contentContainer,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
              display: currentStep === 1 ? 'flex' : 'none',
            },
          ]}
        >
          <Text variant="headingLarge" style={localStyles.title}>
            Verify Your Student Status
          </Text>
          <Text variant="bodyLarge" color={colors.textSecondary} style={localStyles.subtitle}>
            Please provide your academic details to verify your student status.
          </Text>

          {/* Form fields */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={localStyles.formContainer}
          >
            <Input
              label="University Email"
              placeholder="your.email@university.edu"
              value={email}
              onChangeText={setEmail}
              leftIcon={<EmailIcon size={20} color={colors.primary} />}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={loading}
            />

            <Input
              label="University/College"
              placeholder="Enter your university name"
              value={university}
              onChangeText={setUniversity}
              leftIcon={<UniversityIcon size={20} color={colors.primary} />}
              error={errors.university}
              autoCapitalize="words"
              disabled={loading}
            />

            <Input
              label="Major/Field of Study"
              placeholder="Enter your major"
              value={major}
              onChangeText={setMajor}
              leftIcon={<UserIcon size={20} color={colors.primary} />}
              error={errors.major}
              autoCapitalize="words"
              disabled={loading}
            />

            <View style={localStyles.row}>
              <View style={localStyles.halfInput}>
                <Input
                  label="Start Year"
                  placeholder="YYYY"
                  value={startYear}
                  onChangeText={setStartYear}
                  error={errors.startYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  disabled={loading}
                />
              </View>

              <View style={localStyles.halfInput}>
                <Input
                  label="Graduation Year"
                  placeholder="YYYY"
                  value={gradYear}
                  onChangeText={setGradYear}
                  error={errors.gradYear}
                  keyboardType="number-pad"
                  maxLength={4}
                  disabled={loading}
                />
              </View>
            </View>

            <Input
              label="Student ID Number"
              placeholder="Enter your student ID"
              value={studentID}
              onChangeText={setStudentID}
              error={errors.studentID}
              disabled={loading}
            />

            {/* Country Dropdown */}
            <Dropdown
              label="Country"
              placeholder="Select your country"
              items={countries}
              value={selectedCountry?.isoCode || ''}
              onSelect={handleCountrySelect}
              error={errors.country}
              disabled={loading}
              colors={colors}
              searchable={true}
            />

            {/* State Dropdown */}
            <Dropdown
              label="State/Province"
              placeholder={loadingStates ? 'Loading states...' : 'Select your state'}
              items={states}
              value={selectedState?.isoCode || ''}
              onSelect={handleStateSelect}
              error={errors.state}
              disabled={loading || !selectedCountry || loadingStates}
              loading={loadingStates}
              colors={colors}
              searchable={states.length > 10}
            />

            {/* City Dropdown */}
            <Dropdown
              label="City"
              placeholder={loadingCities ? 'Loading cities...' : 'Select your city'}
              items={cities}
              value={selectedCity?.name || ''}
              onSelect={handleCitySelect}
              error={errors.city}
              disabled={loading || !selectedState || loadingCities}
              loading={loadingCities}
              colors={colors}
              searchable={cities.length > 10}
            />

            <Button
              title="Continue"
              onPress={handleContinue}
              disabled={loading}
              loading={loading}
              fullWidth
              style={localStyles.button}
              icon={<ArrowRightIcon size={20} color={colors.buttonText} />}
              iconPosition="right"
            />
          </KeyboardAvoidingView>
        </Animated.View>

        {/* OTP Verification */}
        <Animated.View
          style={[
            localStyles.contentContainer,
            {
              opacity: otpOpacity,
              transform: [{ translateY: otpTranslateY }],
              display: currentStep === 2 ? 'flex' : 'none',
            },
          ]}
        >
          <Text variant="headingLarge" style={localStyles.title}>
            Verify Your Email
          </Text>
          <Text variant="bodyLarge" color={colors.textSecondary} style={localStyles.subtitle}>
            We've sent a 4-digit code to {email}. Please enter it below to verify your email.
          </Text>

          <View style={localStyles.formContainer}>
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
              style={localStyles.button}
            />

            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={loading}
              style={localStyles.resendContainer}
            >
              <Text variant="labelMedium" color={colors.primary}>
                Didn't receive code? Resend
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </ScreenContainer>
  );
};

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  themeToggle: {
    padding: SPACING.xs,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  subtitle: {
    marginBottom: SPACING.xl,
  },
  formContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  button: {
    marginTop: SPACING.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  // Alert styles (copied from previous screens)
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

export default OnboardingVerificationScreen;