import { StyleSheet } from 'react-native';
import { ColorTheme, getColors } from './colors';
import { FONT_SIZE, FONT_WEIGHT, FONTS } from './typography';

// Enhanced spacing with more granular options
export const SPACING = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 56,
  xxxxl: 80,
};

// Enhanced border radius values for more design flexibility
export const BORDER_RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999, // For perfectly round elements
  full: 9999,  // Add this line to match the error
};

// Enhanced shadows with more depth options
export const createShadows = (theme: ColorTheme = 'light') => {
  const colors = getColors(theme);
  return {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    minimal: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    xlarge: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    // Directional shadows
    topShadow: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    bottomShadow: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
  };
};

// Enhanced button styles with more variants
export const createButtonStyles = (theme: ColorTheme = 'light') => {
  const colors = getColors(theme);
  const shadows = createShadows(theme);
  
  return StyleSheet.create({
    // Primary variants
    primary: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    primaryLarge: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xl,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
    },
    primarySmall: {
      backgroundColor: colors.primary,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    
    // Secondary variants
    secondary: {
      backgroundColor: colors.secondary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    secondaryLarge: {
      backgroundColor: colors.secondary,
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xl,
      borderRadius: BORDER_RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
    },
    secondarySmall: {
      backgroundColor: colors.secondary,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      borderRadius: BORDER_RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    
    // Accent variant
    accent: {
      backgroundColor: colors.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    
    // Outlined variants
    outlined: {
      backgroundColor: 'transparent',
      paddingVertical: SPACING.md - 2, // Subtract border width
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlinedSecondary: {
      backgroundColor: 'transparent',
      paddingVertical: SPACING.md - 2, // Subtract border width
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 2,
      borderColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Ghost variants
    ghost: {
      backgroundColor: 'transparent',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostWithBackground: {
      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Soft buttons with lighter background
    soft: {
      backgroundColor: theme === 'light' ? 
        `${colors.primary}20` : // 20 = 12% opacity
        `${colors.primary}30`,  // 30 = 19% opacity
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    softSecondary: {
      backgroundColor: theme === 'light' ? 
        `${colors.secondary}20` : 
        `${colors.secondary}30`,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Round icon buttons
    iconRound: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    iconRoundSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    iconRoundLarge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
    },
    
    // Button text styles
    buttonText: {
      color: colors.buttonText,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    buttonTextLarge: {
      color: colors.buttonText,
      fontSize: FONT_SIZE.lg,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    buttonTextSmall: {
      color: colors.buttonText,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    outlinedButtonText: {
      color: colors.primary,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    outlinedButtonTextSecondary: {
      color: colors.secondary,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    ghostButtonText: {
      color: colors.primary,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    softButtonText: {
      color: colors.primary,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    softButtonTextSecondary: {
      color: colors.secondary,
      fontSize: FONT_SIZE.md,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    
    // States
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.8,
    },
  });
};

// Enhanced card styles with more variants
export const createCardStyles = (theme: ColorTheme = 'light') => {
  const colors = getColors(theme);
  const shadows = createShadows(theme);
  
  return StyleSheet.create({
    // Standard card
    card: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.medium,
    },
    
    // Card variants
    cardFlat: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.none,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardMinimal: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      ...shadows.small,
    },
    cardElevated: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.large,
    },
    cardRounded: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.lg,
      ...shadows.medium,
    },
    cardHighlighted: {
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.medium,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    
    // Card with color accent
    cardPrimary: {
      backgroundColor: theme === 'light' ? `${colors.primary}15` : `${colors.primary}30`,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.small,
    },
    cardSecondary: {
      backgroundColor: theme === 'light' ? `${colors.secondary}15` : `${colors.secondary}30`,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      ...shadows.small,
    },
    
    // Card inner elements
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    cardTitle: {
      color: colors.text,
      fontSize: FONT_SIZE.lg,
      fontFamily: FONTS.semiBold,
      fontWeight: FONT_WEIGHT.semiBold as any,
    },
    cardSubtitle: {
      color: colors.textSecondary,
      fontSize: FONT_SIZE.sm,
      fontFamily: FONTS.medium,
      marginTop: SPACING.xxs,
    },
    cardContent: {
      marginBottom: SPACING.md,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: SPACING.md,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: SPACING.md,
    },
  });
};

// Enhanced layout styles with more comprehensive options
export const createLayoutStyles = (theme: ColorTheme = 'light') => {
  const colors = getColors(theme);
  
  return StyleSheet.create({
    // Base container variants
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerWithPattern: {
      flex: 1,
      backgroundColor: colors.background,
      // You can add a pattern here using a background image
    },
    containerWithGradient: {
      flex: 1,
      // Note: You'll need to add a LinearGradient component here
    },
    
    // Centered containers
    centeredContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    centeredContainerWithOffset: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
      paddingBottom: SPACING.xxxl, // Extra bottom padding
    },
    
    // Padded container variants
    paddedContainer: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.lg,
    },
    paddedContainerTight: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.md,
    },
    paddedContainerWide: {
      flex: 1,
      backgroundColor: colors.background,
      padding: SPACING.xl,
    },
    
    // Safe area containers
    safeAreaContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeAreaContainerWithHeader: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 0, // Header will provide its own padding
    },
    
    // Flexible layouts
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowSpaceBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowSpaceAround: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    rowEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    
    // Columns
    column: {
      flexDirection: 'column',
    },
    columnCenter: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    columnCenterJustified: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Spacing utilities
    marginBottom: {
      marginBottom: SPACING.md,
    },
    marginBottomSm: {
      marginBottom: SPACING.sm,
    },
    marginBottomLg: {
      marginBottom: SPACING.lg,
    },
    marginBottomXl: {
      marginBottom: SPACING.xl,
    },
    marginRight: {
      marginRight: SPACING.md,
    },
    marginRightSm: {
      marginRight: SPACING.sm,
    },
    marginRightLg: {
      marginRight: SPACING.lg,
    },
    marginTop: {
      marginTop: SPACING.md,
    },
    marginTopSm: {
      marginTop: SPACING.sm,
    },
    marginTopLg: {
      marginTop: SPACING.lg,
    },
    marginLeft: {
      marginLeft: SPACING.md,
    },
    padding: {
      padding: SPACING.md,
    },
    paddingSm: {
      padding: SPACING.sm,
    },
    paddingLg: {
      padding: SPACING.lg,
    },
    
    // Divider and separator styles
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: SPACING.md,
    },
    separatorLight: {
      height: 1,
      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
      marginVertical: SPACING.md,
    },
    verticalSeparator: {
      width: 1,
      height: '100%',
      backgroundColor: colors.border,
      marginHorizontal: SPACING.md,
    },
    
    // Section styles
    section: {
      marginBottom: SPACING.xl,
    },
    sectionTitle: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONTS.semiBold,
      color: colors.text,
      marginBottom: SPACING.sm,
    },
    sectionContent: {
      marginBottom: SPACING.md,
    },
    
    // Misc layout styles
    fullWidth: {
      width: '100%',
    },
    halfWidth: {
      width: '50%',
    },
    justifyCenter: {
      justifyContent: 'center',
    },
    alignCenter: {
      alignItems: 'center',
    },
    absoluteFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
};

// Animation constants with more options
export const ANIMATION = {
  DURATION: {
    FASTEST: 100,
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
    SLOWEST: 800,
  },
  EASING: {
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease-out',
    EASE_IN: 'ease-in',
    ELASTIC: 'elastic',
    BOUNCE: 'bounce',
  },
  CURVE: {
    LINEAR: [0, 0, 1, 1],
    EASE: [0.25, 0.1, 0.25, 1],
    EASE_IN: [0.42, 0, 1, 1],
    EASE_OUT: [0, 0, 0.58, 1],
    EASE_IN_OUT: [0.42, 0, 0.58, 1],
    ELASTIC: [0.68, -0.55, 0.265, 1.55],
  },
};

// Get all styles for a specific theme
export const getGlobalStyles = (theme: ColorTheme = 'light') => {
  return {
    buttons: createButtonStyles(theme),
    cards: createCardStyles(theme),
    layout: createLayoutStyles(theme),
    shadows: createShadows(theme),
  };
};

// Default is light theme
export default getGlobalStyles('light');