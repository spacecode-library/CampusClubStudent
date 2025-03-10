import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../constants/globalStyles';

// Create animated TouchableOpacity
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activeElevation?: boolean;
  animate?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'flat' | 'elevated' | 'outlined' | 'premium';
  borderRadius?: number;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  activeElevation = true,
  animate = true,
  disabled = false,
  variant = 'default',
  borderRadius,
  ...props
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  
  // Get styles based on variant
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: colors.card,
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...getElevation(8),
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        };
      case 'premium':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.premium,
          ...getElevation(4),
        };
      default:
        return {
          backgroundColor: colors.card,
          ...getElevation(4),
        };
    }
  };
  
  // Get elevation based on platform
  const getElevation = (elevation: number): ViewStyle => {
    return Platform.OS === 'ios'
      ? {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: elevation / 2 },
          shadowOpacity: 0.2,
          shadowRadius: elevation,
        }
      : {
          elevation,
        };
  };
  
  // Press animation handlers
  const handlePressIn = () => {
    if (animate && onPress) {
      scale.value = withSpring(0.98, {
        damping: 20,
        stiffness: 300,
      });
    }
  };
  
  const handlePressOut = () => {
    if (animate && onPress) {
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    }
  };
  
  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const cardBorderRadius = borderRadius !== undefined 
    ? borderRadius 
    : BORDER_RADIUS.lg;
  
  // If card is pressable, wrap in AnimatedTouchable
  if (onPress) {
    return (
      <AnimatedTouchable
        activeOpacity={0.95}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.card,
          getVariantStyles(),
          { borderRadius: cardBorderRadius },
          animatedStyle,
          style,
        ]}
        {...props}
      >
        {children}
      </AnimatedTouchable>
    );
  }
  
  // Otherwise, use a regular View
  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        { borderRadius: cardBorderRadius },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
});

export default Card;