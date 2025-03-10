import { TextStyle } from 'react-native';
import { Platform } from 'react-native';

// Font families based on platform
export const FONTS = {
  regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto-Medium',
  semiBold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto-Bold',
};

// Font sizes
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
  giant: 56
};

// Line heights
export const LINE_HEIGHT = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 30,
  xxl: 36,
  xxxl: 40,
  display: 52,
  giant: 64
};

// Font weights
export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Text styles preset combinations
export const TEXT_STYLES = {
  displayLarge: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.giant,
    lineHeight: LINE_HEIGHT.giant,
    fontWeight: FONT_WEIGHT.bold as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  } as TextStyle,
  
  displayMedium: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.display,
    lineHeight: LINE_HEIGHT.display,
    fontWeight: FONT_WEIGHT.bold as TextStyle['fontWeight'],
    letterSpacing: -0.25,
  } as TextStyle,
  
  displaySmall: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.xxxl,
    lineHeight: LINE_HEIGHT.xxxl,
    fontWeight: FONT_WEIGHT.bold as TextStyle['fontWeight'],
  } as TextStyle,
  
  headingLarge: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.xxl,
    lineHeight: LINE_HEIGHT.xxl,
    fontWeight: FONT_WEIGHT.bold as TextStyle['fontWeight'],
  } as TextStyle,
  
  headingMedium: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.xl,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  headingSmall: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.lg,
    lineHeight: LINE_HEIGHT.lg,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  titleLarge: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.xxl,
    lineHeight: LINE_HEIGHT.xxl,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  titleMedium: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.xl,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  titleSmall: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.lg,
    lineHeight: LINE_HEIGHT.lg,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.lg,
    lineHeight: LINE_HEIGHT.lg,
    fontWeight: FONT_WEIGHT.regular as TextStyle['fontWeight'],
  } as TextStyle,
  
  bodyMedium: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.md,
    lineHeight: LINE_HEIGHT.md,
    fontWeight: FONT_WEIGHT.regular as TextStyle['fontWeight'],
  } as TextStyle,
  
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: FONT_WEIGHT.regular as TextStyle['fontWeight'],
  } as TextStyle,
  
  labelLarge: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.md,
    lineHeight: LINE_HEIGHT.md,
    fontWeight: FONT_WEIGHT.medium as TextStyle['fontWeight'],
  } as TextStyle,
  
  labelMedium: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: FONT_WEIGHT.medium as TextStyle['fontWeight'],
  } as TextStyle,
  
  labelSmall: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.xs,
    lineHeight: LINE_HEIGHT.xs,
    fontWeight: FONT_WEIGHT.medium as TextStyle['fontWeight'],
  } as TextStyle,
  
  button: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.md,
    lineHeight: LINE_HEIGHT.md,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
  
  buttonSmall: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: FONT_WEIGHT.semiBold as TextStyle['fontWeight'],
  } as TextStyle,
};