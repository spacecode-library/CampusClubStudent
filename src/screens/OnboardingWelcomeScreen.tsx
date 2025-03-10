import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  useWindowDimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import FloatingActionButton from '../components/FloatingActionButton';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { 
  EducationIcon, 
  ArrowRightIcon,
  IDCardIcon,
} from '../components/icons';
import { 
  horizontalScale, 
  verticalScale, 
  moderateScale,
  isSmallDevice,
  isTablet,
  useOrientation,
} from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type OnboardingWelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingWelcome'>;

interface OnboardingWelcomeScreenProps {
  navigation: OnboardingWelcomeScreenNavigationProp;
}

const OnboardingWelcomeScreen: React.FC<OnboardingWelcomeScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const orientation = useOrientation();
  const insets = useSafeAreaInsets();
  const isLandscape = orientation === 'LANDSCAPE';
  
  // UI state
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeInTitle = useRef(new Animated.Value(0)).current;
  const translateYTitle = useRef(new Animated.Value(50)).current;
  const fadeInContent = useRef(new Animated.Value(0)).current;
  const translateYContent = useRef(new Animated.Value(100)).current;
  const backgroundScale = useRef(new Animated.Value(1.1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  
  // Animated interpolations
  const backgroundOpacity = fadeInTitle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  
  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Background zoom out slightly
      Animated.timing(backgroundScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      
      // Title fade in and slide up
      Animated.parallel([
        Animated.timing(fadeInTitle, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateYTitle, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      
      // Content fade in and slide up
      Animated.parallel([
        Animated.timing(fadeInContent, {
          toValue: 1,
          duration: 800,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYContent, {
          toValue: 0,
          duration: 800,
          delay: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      
      // Button fade in and slide up
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 600,
          delay: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);
  
  const goToVerification = () => {
    setLoading(true);
    
    // Add a slight delay for button animation
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OnboardingVerification');
    }, 300);
  };
  
  // Data for the steps
  const steps = [
    {
      id: 'student_info',
      title: 'Student Information',
      description: 'Provide your academic details and university email',
      icon: <EducationIcon size={moderateScale(24)} color={colors.primary} />
    },
    {
      id: 'id_verification',
      title: 'Student ID Verification',
      description: 'Upload a photo of your student ID to complete verification',
      icon: <IDCardIcon size={moderateScale(24)} color={colors.primary} />
    }
  ];
  
  // Calculate dynamic sizes
  const logoSize = moderateScale(isTablet ? 64 : 48);
  const stepNumberSize = moderateScale(isTablet ? 32 : 28);
  
  // Determine layout based on orientation and device size
  const isLandscapeTablet = isLandscape && isTablet;
  
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Background with gradient overlay */}
      <Animated.View 
        style={[
          styles.backgroundContainer,
          {
            opacity: backgroundOpacity,
            transform: [{ scale: backgroundScale }]
          }
        ]}
      >
      </Animated.View>
      
      {/* Main content */}
      <View 
        style={[
          styles.contentContainer,
          {
            paddingTop: insets.top + SPACING.md,
            paddingBottom: insets.bottom + SPACING.md,
            paddingHorizontal: horizontalScale(SPACING.lg)
          }
        ]}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeInTitle,
              transform: [{ translateY: translateYTitle }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View 
              style={[
                styles.logo,
                {
                  backgroundColor: colors.primary,
                  width: logoSize,
                  height: logoSize,
                  borderRadius: logoSize / 2,
                }
              ]}
            >
              <Text variant="headingMedium" color={colors.buttonText}>
                CC
              </Text>
            </View>
            <Text 
              variant={isTablet ? "displayMedium" : "displaySmall"} 
              color="#FFFFFF" 
              style={styles.appName}
            >
              CampusClub
            </Text>
          </View>
        </Animated.View>
        
        {/* Welcome Content */}
        <Animated.View 
          style={[
            styles.welcomeContainer,
            {
              opacity: fadeInContent,
              transform: [{ translateY: translateYContent }],
            }
          ]}
        >
          <Text 
            variant={isTablet ? "displaySmall" : "headingLarge"} 
            color="#FFFFFF" 
            style={[
              styles.welcomeTitle,
              isLandscapeTablet && { textAlign: 'left' }
            ]}
          >
            Welcome to CampusClub!
          </Text>
          
          <Text 
            variant={isTablet ? "bodyLarge" : "bodyMedium"} 
            color="rgba(255, 255, 255, 0.9)" 
            style={[
              styles.welcomeText,
              isLandscapeTablet && { textAlign: 'left' }
            ]}
          >
            Exclusive student discounts at your fingertips.
          </Text>
          
          {/* Verification Steps Section */}
          <View style={styles.stepsContainer}>
            <Text 
              variant={isTablet ? "titleLarge" : "titleMedium"} 
              color="#FFFFFF" 
              style={[
                styles.stepsTitle,
                isLandscapeTablet && { textAlign: 'left' }
              ]}
            >
              Quick 2-Step Verification
            </Text>
            
            <View style={[
              styles.stepsContent,
              isLandscapeTablet && { 
                flexDirection: 'row', 
                justifyContent: 'space-between' 
              }
            ]}>
              {steps.map((step, index) => (
                <View 
                  key={step.id} 
                  style={[
                    styles.stepCard,
                    isLandscapeTablet && { 
                      width: '48%',
                      marginRight: index < steps.length - 1 ? SPACING.md : 0
                    }
                  ]}
                >
                  <View style={styles.stepHeader}>
                    <View 
                      style={[
                        styles.stepNumberContainer, 
                        { 
                          backgroundColor: index === 0 ? colors.primary : colors.accent,
                          width: stepNumberSize,
                          height: stepNumberSize,
                          borderRadius: stepNumberSize / 2
                        }
                      ]}
                    >
                      <Text variant="labelMedium" color={colors.buttonText}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.stepIconContainer}>
                      {step.icon}
                    </View>
                  </View>
                  
                  <View style={styles.stepContent}>
                    <Text variant="labelLarge" color="#FFFFFF" style={styles.stepTitle}>
                      {step.title}
                    </Text>
                    <Text variant="bodySmall" color="rgba(255, 255, 255, 0.9)">
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
        
        {/* Get Started Button */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ translateY: buttonTranslateY }]
            }
          ]}
        >
          <FloatingActionButton
            title="Get Started"
            onPress={goToVerification}
            disabled={loading}
            loading={loading}
            icon={<ArrowRightIcon size={moderateScale(20)} color={colors.buttonText} />}
            iconPosition="right"
            colors={colors}
            variant="primary"
            style={styles.button}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E3A', // Fallback color
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  appName: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: verticalScale(8),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: verticalScale(40),
    maxWidth: 500,
    alignSelf: 'center',
  },
  stepsContainer: {
    width: '100%',
  },
  stepsTitle: {
    textAlign: 'center',
    marginBottom: verticalScale(20),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stepsContent: {
    width: '100%',
  },
  stepCard: {
    marginBottom: verticalScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  stepNumberContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  stepIconContainer: {
    justifyContent: 'center',
  },
  stepContent: {
    paddingLeft: horizontalScale(40), // Align with the step number
  },
  stepTitle: {
    marginBottom: verticalScale(4),
  },
  buttonContainer: {
    width: '100%',
    paddingTop: verticalScale(16),
  },
  button: {
    height: verticalScale(56),
  },
});

export default OnboardingWelcomeScreen;