import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import Text from './Text';
import { moderateScale } from '../utils/responsiveUtils';
import LottieView from 'lottie-react-native';

export const LoadingScreen = () => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  // Lottie animation ref
  const loadingAnimationRef = useRef<LottieView>(null);
  
  useEffect(() => {
    // Play loading animation
    if (loadingAnimationRef.current) {
      loadingAnimationRef.current.play();
    }
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1E1E3A"
        translucent
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logo}>
          <Text variant="displaySmall" color="#FFFFFF">
            CC
          </Text>
        </View>
        
        <Text
          variant="headingLarge"
          color="#FFFFFF"
          style={styles.appName}
        >
          CampusClub
        </Text>
        
        <View style={styles.lottieContainer}>
          <LottieView
            ref={loadingAnimationRef}
            source={require('../assets/animations/loading.json')}
            style={styles.loadingAnimation}
            autoPlay={false}
            loop={true}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: '#5C6BC0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  lottieContainer: {
    marginTop: 20,
  },
  loadingAnimation: {
    width: moderateScale(60),
    height: moderateScale(60),
  },
});

export default LoadingScreen;