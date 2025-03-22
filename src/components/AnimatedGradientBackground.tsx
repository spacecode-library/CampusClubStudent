// src/components/AnimatedGradientBackground.tsx
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedGradientBackgroundProps {
  style?: ViewStyle;
}

const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({ style }) => {
  const { colors, theme } = useTheme();
  
  // Animation values
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  
  // Set up animations on mount
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1, // infinite repeats
      false // no reverse
    );
    
    translateX.value = withRepeat(
      withTiming(100, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite repeats
      true // reverse
    );
  }, []);
  
  // Create animated styles
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value * 360}deg` },
        { translateX: translateX.value },
      ],
    };
  });
  
  // Choose gradient colors based on theme with proper typing
  const darkGradientColors = [
    `${colors.primary}10`, 
    `${colors.secondary}10`, 
    `${colors.primary}05`
  ] as const;
  
  const lightGradientColors = [
    `${colors.primary}05`, 
    `${colors.secondary}08`, 
    `${colors.primary}03`
  ] as const;
  
  const gradientColors = theme === 'dark' ? darkGradientColors : lightGradientColors;
  
  return (
    <Animated.View style={[styles.container, animatedStyles, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '200%',
    height: '200%',
    position: 'absolute',
  },
  gradient: {
    width: '100%',
    height: '100%',
  }
});

export default AnimatedGradientBackground;