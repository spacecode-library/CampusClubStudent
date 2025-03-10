import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import Text from './Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { horizontalScale, verticalScale, moderateScale } from '../utils/responsiveUtils';

interface FloatingActionButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  colors: any; // Using any here for simplicity, but you can type this properly
  variant?: 'primary' | 'secondary' | 'accent';
  style?: any;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  title,
  onPress,
  icon,
  iconPosition = 'right',
  disabled = false,
  loading = false,
  colors,
  variant = 'primary',
  style,
}) => {
  // Animation for button press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Handle button press animation
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }).start();
  };
  
  // Determine button background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.secondary;
      case 'accent':
        return colors.accent;
      case 'primary':
      default:
        return colors.primary;
    }
  };
  
  const backgroundColor = getBackgroundColor();
  
  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.shadowContainer,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={disabled || loading ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={[
            styles.button,
            {
              backgroundColor,
              opacity: disabled ? 0.7 : 1,
            }
          ]}
          disabled={disabled || loading}
        >
          <View style={styles.content}>
            {icon && iconPosition === 'left' && !loading && (
              <View style={styles.iconLeft}>{icon}</View>
            )}
            
            {loading ? (
              <ActivityIndicator color={colors.buttonText} size="small" />
            ) : (
              <Text
                variant="labelLarge"
                color={colors.buttonText}
                style={styles.text}
              >
                {title}
              </Text>
            )}
            
            {icon && iconPosition === 'right' && !loading && (
              <View style={styles.iconRight}>{icon}</View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: horizontalScale(SPACING.lg),
    paddingBottom: verticalScale(SPACING.md),
    width: '100%',
  },
  shadowContainer: {
    borderRadius: BORDER_RADIUS.lg,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 8,
  },
  button: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: verticalScale(SPACING.md),
    paddingHorizontal: horizontalScale(SPACING.lg),
    minHeight: verticalScale(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: horizontalScale(SPACING.sm),
  },
  iconRight: {
    marginLeft: horizontalScale(SPACING.sm),
  },
});

export default FloatingActionButton;