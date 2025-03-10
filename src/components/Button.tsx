import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  Animated,
  StyleProp,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, FONT_WEIGHT, FONTS } from '../constants/typography';
import { BORDER_RADIUS, SPACING } from '../constants/globalStyles';

type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { colors, theme } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // Handle press in animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };
  
  // Handle press out animation
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };
  
  // Button background colors based on variant and theme
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outlined':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };
  
  // Button text colors
  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.buttonText;
      case 'outlined':
      case 'ghost':
        return colors.primary;
      default:
        return colors.buttonText;
    }
  };
  
  // Button border styles
  const getBorderStyle = () => {
    if (variant === 'outlined') {
      return {
        borderWidth: 2,
        borderColor: colors.primary,
      };
    }
    return {};
  };
  
  // Padding based on button size
  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.md,
        };
      case 'large':
        return {
          paddingVertical: SPACING.lg,
          paddingHorizontal: SPACING.xl,
        };
      case 'medium':
      default:
        return {
          paddingVertical: SPACING.md,
          paddingHorizontal: SPACING.lg,
        };
    }
  };
  
  // Font size based on button size
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZE.sm;
      case 'large':
        return FONT_SIZE.lg;
      case 'medium':
      default:
        return FONT_SIZE.md;
    }
  };
  
  // Combine styles
  const buttonStyles: StyleProp<ViewStyle> = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      ...getPadding(),
      ...getBorderStyle(),
      width: fullWidth ? '100%' : undefined,
    } as ViewStyle,
    disabled && {
      opacity: 0.6,
      backgroundColor: theme === 'dark' ? colors.backgroundSecondary : '#E2E8F0',
    },
    style,
  ];
  
  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: getFontSize(),
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    disabled && {
      color: theme === 'dark' ? colors.textTertiary : '#94A3B8',
    },
    textStyle,
  ];
  
  // Render loading spinner
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={getTextColor()} size={size === 'small' ? 'small' : 'small'} />;
    }
    
    if (icon) {
      return (
        <View style={[styles.contentContainer, iconPosition === 'right' && styles.reverseContent]}>
          {iconPosition === 'left' && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && <View style={styles.iconContainer}>{icon}</View>}
        </View>
      );
    }
    
    return <Text style={textStyles}>{title}</Text>;
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[buttonStyles, { transform: [{ scale: scaleAnim }] }]}>
        {renderContent()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reverseContent: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    marginHorizontal: SPACING.xs,
  },
});

export default Button;