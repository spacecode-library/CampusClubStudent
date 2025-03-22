// src/components/Button.tsx
import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  StyleProp,
  TextStyle
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  leftIcon,
  rightIcon
}) => {
  const { colors } = useTheme();
  
  // Get button styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? `${colors.primary}80` : colors.primary,
          borderColor: 'transparent',
          textColor: colors.primary // Changed to onPrimary for better contrast
        };
      case 'secondary':
        return {
          backgroundColor: `${colors.primary}20`,
          borderColor: 'transparent',
          textColor: colors.primary
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          textColor: colors.primary
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: colors.primary
        };
      default:
        return {
          backgroundColor: disabled ? `${colors.primary}80` : colors.primary,
          borderColor: 'transparent',
          textColor: colors.primary
        };
    }
  };
  
  // Get button sizing
  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return {
          height: moderateScale(36),
          paddingHorizontal: SPACING.md,
          textVariant: 'labelMedium' as const
        };
      case 'medium':
        return {
          height: moderateScale(48),
          paddingHorizontal: SPACING.lg,
          textVariant: 'labelLarge' as const
        };
      case 'large':
        return {
          height: moderateScale(56),
          paddingHorizontal: SPACING.xl,
          textVariant: 'labelLarge' as const
        };
      default:
        return {
          height: moderateScale(48),
          paddingHorizontal: SPACING.lg,
          textVariant: 'labelLarge' as const
        };
    }
  };
  
  const buttonStyles = getButtonStyles();
  const buttonSize = getButtonSize();
  
  // Create text style with proper TypeScript typing
  const textStyle: StyleProp<TextStyle> = [
    styles.buttonText
  ];
  
  // Only add margin if icons exist
  if (leftIcon) {
    textStyle.push({ marginLeft: SPACING.sm });
  }
  
  if (rightIcon) {
    textStyle.push({ marginRight: SPACING.sm });
  }
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: buttonStyles.backgroundColor,
          borderColor: buttonStyles.borderColor,
          height: buttonSize.height,
          paddingHorizontal: buttonSize.paddingHorizontal
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={buttonStyles.textColor} />
      ) : (
        <>
          {leftIcon}
          <Text
            variant={buttonSize.textVariant}
            color={buttonStyles.textColor}
            style={textStyle}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  buttonText: {
    textAlign: 'center',
  }
});

export default Button;