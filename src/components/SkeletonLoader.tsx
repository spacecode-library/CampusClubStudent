import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  style?: ViewStyle | ViewStyle[];
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({
  style,
  width = '100%',
  height = 20,
  borderRadius = 4,
  children,
}) => {
  // Animation values
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create shimmering effect
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [shimmerAnim]);

  // Interpolate shimmer animation
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200]
  });

  return (
    <View
      style={[
        { 
          width, 
          height, 
          borderRadius, 
          overflow: 'hidden' as const 
        },
        style
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { 
            backgroundColor: 'rgba(0, 0, 0, 0.05)', 
            borderRadius 
          },
        ]}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%' as const,
            height: '100%' as const,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            transform: [{ translateX: shimmerTranslate }]
          },
          styles.shimmer
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shimmer: {
    width: '30%' as const,
    height: '100%' as const,
  },
});

export default Skeleton;