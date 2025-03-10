import React from 'react';
import { Dimensions, PixelRatio, Platform, StatusBar, ScaledSize } from 'react-native';

// Device screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions where designs are created (e.g., for iPhone 11)
const baseWidth = 375;
const baseHeight = 812;

// Scales based on screen width
export const horizontalScale = (size: number): number => (SCREEN_WIDTH / baseWidth) * size;

// Scales based on screen height
export const verticalScale = (size: number): number => (SCREEN_HEIGHT / baseHeight) * size;

// Scales based on the smaller of the two ratios for more balanced scaling
export const moderateScale = (size: number, factor = 0.5): number => {
  const scale = Math.min(SCREEN_WIDTH / baseWidth, SCREEN_HEIGHT / baseHeight);
  return size + (scale - 1) * size * factor;
};

// Converts design px to dp units
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Define return type for safe area insets
interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Get the safe area insets using StatusBar height for Android
export const getSafeAreaInsets = (): SafeAreaInsets => {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  
  return {
    top: Platform.OS === 'ios' ? 44 : statusBarHeight,
    right: 0,
    bottom: Platform.OS === 'ios' ? 34 : 0,
    left: 0
  };
};

// Responsive font sizes
export const FONT_SIZES = {
  xs: normalize(12),
  sm: normalize(14),
  md: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
  xxxxl: normalize(40),
};

// Responsive spacing
export const RESPONSIVE_SPACING = {
  xxxs: horizontalScale(2),
  xxs: horizontalScale(4),
  xs: horizontalScale(8),
  sm: horizontalScale(12),
  md: horizontalScale(16),
  lg: horizontalScale(24),
  xl: horizontalScale(32),
  xxl: horizontalScale(40),
  xxxl: horizontalScale(64),
};

// Detect device size categories
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

// Define OrientationType for better type safety
export type OrientationType = 'PORTRAIT' | 'LANDSCAPE';

// Define the proper type for the dimension change event
type DimensionChangeEvent = {
  window: ScaledSize;
  screen: ScaledSize;
};

// Hook to handle orientation changes
export const useOrientation = (): OrientationType => {
  const [orientation, setOrientation] = React.useState<OrientationType>(
    SCREEN_WIDTH > SCREEN_HEIGHT ? 'LANDSCAPE' : 'PORTRAIT'
  );

  React.useEffect(() => {
    const onChange = ({ window }: DimensionChangeEvent) => {
      setOrientation(window.width > window.height ? 'LANDSCAPE' : 'PORTRAIT');
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    return () => subscription.remove();
  }, []);

  return orientation;
};

// Define return type for responsive layout
interface ResponsiveLayout {
  containerPadding: number;
  columnGap: number;
  maxContentWidth: number;
}

// Layout system based on device size
export const getResponsiveLayout = (): ResponsiveLayout => {
  if (isTablet) {
    return {
      containerPadding: RESPONSIVE_SPACING.lg,
      columnGap: RESPONSIVE_SPACING.md,
      maxContentWidth: 700,
    };
  } else if (isLargeDevice) {
    return {
      containerPadding: RESPONSIVE_SPACING.md,
      columnGap: RESPONSIVE_SPACING.sm,
      maxContentWidth: 500,
    };
  } else {
    return {
      containerPadding: RESPONSIVE_SPACING.sm,
      columnGap: RESPONSIVE_SPACING.xs,
      maxContentWidth: 400,
    };
  }
};