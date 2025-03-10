import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { FONTS, FONT_SIZE, FONT_WEIGHT } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type?: NotificationType;
  title?: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  onPress?: () => void;
  onClose?: () => void;
  actionText?: string;
  onActionPress?: () => void;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
  actionTextStyle?: StyleProp<TextStyle>;
  visible: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  message,
  icon,
  duration = 3000,
  onPress,
  onClose,
  actionText,
  onActionPress,
  position = 'top',
  style,
  titleStyle,
  messageStyle,
  actionTextStyle,
  visible,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(position === 'top' ? -100 : 100);
  const opacity = useSharedValue(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get background color based on type
  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success':
        return `${colors.success}10`;
      case 'error':
        return `${colors.error}10`;
      case 'warning':
        return `${colors.warning}10`;
      case 'info':
      default:
        return `${colors.primary}10`;
    }
  };
  
  // Get border color based on type
  const getBorderColor = (): string => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
      default:
        return colors.primary;
    }
  };
  
  // Handle the showing and hiding of the notification
  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Show notification
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.bezier(0.2, 1.12, 0.4, 0.96), // Bounce effect
      });
      opacity.value = withTiming(1, { duration: 300 });
      
      // Auto-hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hide();
        }, duration);
      }
    } else {
      // Hide notification
      hide();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);
  
  // Function to hide the notification
  const hide = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(
      position === 'top' ? -100 : 100,
      { duration: 300 },
      (finished) => {
        if (finished && onClose) {
          runOnJS(onClose)();
        }
      }
    );
  };
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top'
          ? { top: insets.top + SPACING.md }
          : { bottom: insets.bottom + SPACING.md },
        animatedStyle,
        style,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          if (onPress) {
            onPress();
          }
          hide();
        }}
        style={[
          styles.notification,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
          position === 'top' ? styles.shadowTop : styles.shadowBottom,
        ]}
      >
        {/* Icon */}
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          {title && (
            <Text
              style={[
                styles.title,
                { color: colors.text },
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          
          {/* Message */}
          <Text
            style={[
              styles.message,
              { color: colors.textSecondary },
              messageStyle,
            ]}
            numberOfLines={3}
          >
            {message}
          </Text>
        </View>
        
        {/* Action Button */}
        {actionText && onActionPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              onActionPress();
              hide();
            }}
          >
            <Text
              style={[
                styles.actionText,
                { color: getBorderColor() },
                actionTextStyle,
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    zIndex: 9999,
  },
  notification: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    padding: SPACING.md,
    paddingRight: SPACING.sm,
  },
  shadowTop: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  shadowBottom: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconContainer: {
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semiBold as any,
    marginBottom: 2,
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.sm,
  },
  actionButton: {
    marginLeft: SPACING.sm,
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
  },
  actionText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium as any,
  },
});

export default Notification;