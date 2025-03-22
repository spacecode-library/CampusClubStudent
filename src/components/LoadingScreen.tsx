import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from 'react-native';
import Text from './Text';
import { moderateScale } from '../utils/responsiveUtils';
import LottieView from 'lottie-react-native';

// Import the LogoSvg component we created
import LogoSvg from '../components/Logosvg';

const { width, height } = Dimensions.get('window');

// Define colors
const colors = {
  buttonText: '#FFFFFF',
  primary: '#1E1E3A',
  accent: '#7B8FFF', // Matching the blue from the CLUB logo
  primaryLight: '#2C2C5C',
  background: '#1E1E3A',
};

// Loading messages to display
const loadingMessages = [
  "Discovering campus deals...",
  "Finding events near you...",
  "Loading student discounts...",
  "Preparing your campus experience...",
  "Getting everything ready...",
];

export const LoadingScreen = () => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // For rotating messages
  const [messageIndex, setMessageIndex] = useState(0);
  const messageAnim = useRef(new Animated.Value(1)).current;
  
  // Fix TypeScript error by properly typing the ref
  const loadingAnimationRef = useRef<LottieView>(null);

  // Perform initial entrance animation
  useEffect(() => {
    // Play loading animation if available
    if (loadingAnimationRef.current) {
      loadingAnimationRef.current.play();
    }

    // Main entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation for the logo
    startPulseAnimation();
    
    // Start progress animation
    startProgressAnimation();
    
    // Start message cycling
    const messageInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnim, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  // Pulse animation for the logo
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Progress bar animation
  const startProgressAnimation = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 15000, // 15 seconds for full progress
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const renderContent = () => (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent
      />
      
      {/* Background ellipse design elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.ellipse, { backgroundColor: colors.primaryLight, top: height * 0.1, left: -width * 0.2 }]} />
        <View style={[styles.ellipse, { backgroundColor: colors.accent + '20', top: height * 0.6, right: -width * 0.3 }]} />
      </View>
      
      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo with pulse animation */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.logoContainer}>
            <LogoSvg 
              width={moderateScale(200)} 
              height={moderateScale(80)} 
              fill="#FFFFFF"
            />
          </View>
        </Animated.View>
        
        <Text
          variant="headingLarge"
          color="#FFFFFF"
          style={styles.appName}
        >
          CampusClub
        </Text>
        
        {/* Loading message */}
        <Animated.View style={{ opacity: messageAnim, marginTop: 20 }}>
          <Text
            variant="bodyLarge"
            color={colors.accent}
            style={styles.loadingMessage}
          >
            {loadingMessages[messageIndex]}
          </Text>
        </Animated.View>
        
        {/* Loading animation */}
        <View style={styles.loadingContainer}>
          {/* Use fallback animation if loading.json is not found */}
          {(() => {
            try {
              // This will throw an error if the file doesn't exist
              require('../assets/animations/loading.json');
              return (
                <LottieView
                  ref={loadingAnimationRef}
                  source={require('../assets/animations/loading.json')}
                  style={styles.loadingAnimation}
                  autoPlay={true}
                  loop={true}
                />
              );
            } catch (e) {
              return <ActivityIndicator size="large" color={colors.accent} />;
            }
          })()}
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                transform: [
                  { 
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-width * 0.8, 0]
                    }) 
                  }
                ]
              }
            ]} 
          />
        </View>
      </Animated.View>
    </>
  );

  // Use SafeAreaView for better compatibility without SafeAreaProvider
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ellipse: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: moderateScale(32),
    fontWeight: '700',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingMessage: {
    textAlign: 'center',
    marginHorizontal: 40,
    fontWeight: '500',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingAnimation: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginTop: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});

export default LoadingScreen;