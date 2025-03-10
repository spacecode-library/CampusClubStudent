import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/globalStyles';
import { FONTS, FONT_SIZE } from '../constants/typography';

interface LoadingIndicatorProps {
  type?: 'default' | 'overlay' | 'inline' | 'subtle';
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  animated?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'default',
  size = 'small',
  color,
  text,
  fullScreen = false,
  containerStyle,
  textStyle,
  animated = true,
}) => {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);
  
  // Start rotation animation
  React.useEffect(() => {
    if (animated) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1, // -1 for infinite repeat
        false // don't reverse
      );
    }
    
    return () => {
      cancelAnimation(rotation);
    };
  }, [animated, rotation]);
  
  // Animated style for custom spinner
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });
  
  // Get container style based on type
  const getContainerStyle = (): ViewStyle => {
    switch (type) {
      case 'overlay':
        return {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: `${colors.background}CC`, // 80% opacity
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        };
      case 'inline':
        return {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: 0,
        };
      case 'subtle':
        return {
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
        };
      default:
        return {
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.md,
        };
    }
  };
  
  // Get indicator color based on theme and props
  const getIndicatorColor = (): string => {
    if (color) return color;
    
    switch (type) {
      case 'subtle':
        return colors.textSecondary;
      default:
        return colors.primary;
    }
  };
  
  // Use system spinner or custom animated spinner
  const renderSpinner = () => {
    const indicatorColor = getIndicatorColor();
    const activityIndicatorSize = size === 'large' ? 'large' : 'small';
    
    return (
      <ActivityIndicator
        size={activityIndicatorSize}
        color={indicatorColor}
      />
    );
  };
  
  return (
    <View
      style={[
        styles.container,
        getContainerStyle(),
        fullScreen && styles.fullScreen,
        containerStyle,
      ]}
    >
      {renderSpinner()}
      
      {text && (
        <Text
          style={[
            styles.text,
            {
              color: colors.textSecondary,
              marginLeft: type === 'inline' ? SPACING.sm : 0,
              marginTop: type !== 'inline' ? SPACING.sm : 0,
            },
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});

export default LoadingIndicator;