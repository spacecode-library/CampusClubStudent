import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
import { EmailIcon, UniversityIcon, UserIcon, ArrowRightIcon, ThemeToggleIcon } from '../components/icons';
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

type OnboardingVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingVerification'>;

interface OnboardingVerificationScreenProps {
  navigation: OnboardingVerificationScreenNavigationProp;
}

// Interface for dropdown items
interface DropdownItem {
  label: string;
  value: string;
}

const OnboardingVerificationScreen: React.FC<OnboardingVerificationScreenProps> = ({ navigation }) => {
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
      const formattedCountries = countryList.map(country => ({
        label: country.name,
        value: country.isoCode
      }));
      
      setCountries(formattedCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      Alert.alert('Error', 'Failed to load countries. Please try again.');
    }
  };

  // Load states based on selected country
  const loadStates = (countryCode: string) => {
    setLoadingStates(true);
    try {
      const stateList = State.getStatesOfCountry(countryCode);
      const formattedStates = stateList.map(state => ({
        label: state.name,
        value: state.isoCode
      }));
      
      setStates(formattedStates);
    } catch (error) {
      console.error('Error loading states:', error);
      Alert.alert('Error', 'Failed to load states. Please try again.');
    } finally {
      setLoadingStates(false);
    }
  };

  // Load cities based on selected country and state
  const loadCities = (countryCode: string, stateCode: string) => {
    setLoadingCities(true);
    try {
      const cityList = City.getCitiesOfState(countryCode, stateCode);
      const formattedCities = cityList.map(city => ({
        label: city.name,
        value: city.name // City doesn't have a unique code, so using name as value
      }));
      
      setCities(formattedCities);
    } catch (error) {
      console.error('Error loading cities:', error);
      Alert.alert('Error', 'Failed to load cities. Please try again.');
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (item: DropdownItem) => {
    const country = Country.getCountryByCode(item.value);
    setSelectedCountry(country || null); // Fix TypeScript error by ensuring null not undefined
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
      city: ''
    });
  };

  // Handle state selection
  const handleStateSelect = (item: DropdownItem) => {
    if (!selectedCountry) return;
    
    const state = State.getStateByCodeAndCountry(item.value, selectedCountry.isoCode);
    setSelectedState(state || null); // Fix TypeScript error by ensuring null not undefined
    setSelectedCity(null);
    setCities([]);
    loadCities(selectedCountry.isoCode, item.value);
    
    // Clear city validation error
    setErrors({
      ...errors,
      state: '',
      city: ''
    });
  };

  // Handle city selection
  const handleCitySelect = (item: DropdownItem) => {
    setSelectedCity({ name: item.label } as ICity);
    
    // Clear validation error
    setErrors({
      ...errors,
      city: ''
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
        email: email
      });
      
      if (response.success && response.data) {
        setRequestId(response.data.requestId);
        setOtpSent(true);
        animateToOtp();
      } else {
        Alert.alert('Verification Failed', Array.isArray(response.message) ? response.message[0] : response.message);
      }
    } catch (error) {
      console.error('Initiate verification error:', error);
      Alert.alert('Verification Failed', 'An unexpected error occurred');
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
        // Navigate to document upload screen
        navigation.navigate('OnboardingDocument');
      } else {
        Alert.alert('OTP Verification Failed', Array.isArray(response.message) ? response.message[0] : response.message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Verification Failed', 'An unexpected error occurred');
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
        Alert.alert('OTP Resent', 'A new OTP has been sent to your email');
      } else {
        Alert.alert('Resend Failed', Array.isArray(response.message) ? response.message[0] : response.message);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Resend Failed', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScreenContainer 
      scrollable={true} 
      statusBarStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
    >
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
          <TouchableOpacity 
            style={localStyles.themeToggle} 
            onPress={toggleTheme}
          >
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
              placeholder={loadingStates ? "Loading states..." : "Select your state"}
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
              placeholder={loadingCities ? "Loading cities..." : "Select your city"}
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
});

export default OnboardingVerificationScreen;