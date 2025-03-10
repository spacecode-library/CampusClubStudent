import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../../constants/globalStyles';
import { FONTS, FONT_SIZE, FONT_WEIGHT } from '../../constants/typography';
import { CheckIcon } from '../icons';

export type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'custom';

interface StatusBadgeProps {
  text: string;
  variant?: StatusVariant;
  icon?: React.ReactNode;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  customColor?: string;
  outline?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  text,
  variant = 'info',
  icon,
  showIcon = true,
  size = 'medium',
  style,
  textStyle,
  customColor,
  outline = false,
}) => {
  const { colors } = useTheme();
  
  // Get background color based on variant
  const getBackgroundColor = (): string => {
    if (outline) return 'transparent';
    
    if (customColor) return customColor;
    
    switch (variant) {
      case 'success':
        return `${colors.success}15`;
      case 'error':
        return `${colors.error}15`;
      case 'warning':
        return `${colors.warning}15`;
      case 'pending':
        return `${colors.textTertiary}20`;
      case 'custom':
        return customColor || `${colors.primary}15`;
      case 'info':
      default:
        return `${colors.primary}15`;
    }
  };
  
  // Get text color based on variant
  const getTextColor = (): string => {
    if (customColor) return customColor;
    
    switch (variant) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'pending':
        return colors.textSecondary;
      case 'custom':
        return customColor || colors.primary;
      case 'info':
      default:
        return colors.primary;
    }
  };
  
  // Get border color for outline variant
  const getBorderColor = (): string => {
    if (!outline) return 'transparent';
    return getTextColor();
  };
  
  // Get default icon based on variant
  const getDefaultIcon = () => {
    const color = getTextColor();
    const iconSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
    
    switch (variant) {
      case 'success':
        return <CheckIcon size={iconSize} color={color} />;
      // Add more default icons for other variants as needed
      default:
        return null;
    }
  };
  
  // Get padding based on size
  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: SPACING.xxs,
          paddingHorizontal: SPACING.xs,
        };
      case 'large':
        return {
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.md,
        };
      case 'medium':
      default:
        return {
          paddingVertical: SPACING.xxs,
          paddingHorizontal: SPACING.sm,
        };
    }
  };
  
  // Get font size based on size
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZE.xs;
      case 'large':
        return FONT_SIZE.sm;
      case 'medium':
      default:
        return FONT_SIZE.xs;
    }
  };
  
  // Get border radius based on size
  const getBorderRadius = () => {
    switch (size) {
      case 'small':
        return BORDER_RADIUS.sm;
      case 'large':
        return BORDER_RADIUS.lg;
      case 'medium':
      default:
        return BORDER_RADIUS.md;
    }
  };
  
  const displayIcon = icon || getDefaultIcon();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: outline ? 1 : 0,
          borderRadius: getBorderRadius(),
        },
        getPadding(),
        style,
      ]}
    >
      {showIcon && displayIcon && (
        <View style={styles.iconContainer}>{displayIcon}</View>
      )}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            marginLeft: showIcon && displayIcon ? SPACING.xxs : 0,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: SPACING.xxs,
  },
  text: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHT.medium as any,
    textAlign: 'center',
  },
});

export default StatusBadge;