import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  SharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { getSafeAreaInsets } from '../utils/responsiveUtils';
import { SPACING } from '../constants/globalStyles';
import { FONTS, FONT_SIZE, FONT_WEIGHT } from '../constants/typography';
import { ArrowRightIcon } from './icons';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  elevated?: boolean;
  transparent?: boolean;
  scrollY?: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  backIcon?: React.ReactNode;
  collapsible?: boolean;
}

const HEADER_HEIGHT = 56;
const COLLAPSE_THRESHOLD = 80;

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  elevated = true,
  transparent = false,
  scrollY,
  style,
  titleStyle,
  subtitle,
  subtitleStyle,
  backIcon,
  collapsible = false,
}) => {
  const { colors } = useTheme();
  const safeAreaInsets = getSafeAreaInsets();
  
  // Animation values
  const defaultScrollY = useSharedValue(0);
  const activeScrollY = scrollY || defaultScrollY;
  
  // Derive values for animations from scroll position
  const headerElevation = useDerivedValue(() => {
    return interpolate(
      activeScrollY.value,
      [0, 20],
      [0, elevated ? 1 : 0],
      Extrapolate.CLAMP
    );
  });
  
  const headerOpacity = useDerivedValue(() => {
    if (!collapsible) return 1;
    return interpolate(
      activeScrollY.value,
      [0, COLLAPSE_THRESHOLD],
      [transparent ? 0 : 1, 1],
      Extrapolate.CLAMP
    );
  });
  
  const titleOpacity = useDerivedValue(() => {
    if (!collapsible) return 1;
    return interpolate(
      activeScrollY.value,
      [0, COLLAPSE_THRESHOLD / 2, COLLAPSE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );
  });
  
  // Apply animations to header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = headerElevation.value * 0.15;
    
    return {
      backgroundColor: transparent 
        ? `rgba(${colors.background.replace(/[^\d,]/g, '')}, ${headerOpacity.value})`
        : colors.background,
      shadowOpacity: Platform.OS === 'ios' ? shadowOpacity : 0,
      elevation: Platform.OS === 'android' ? headerElevation.value * 4 : 0,
    };
  });
  
  // Apply animations to title
  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
    };
  });
  
  // Create back button
  const renderBackButton = () => {
    if (!showBackButton) return null;
    
    const BackIcon = backIcon || (
      <ArrowRightIcon
        size={22}
        color={colors.text}
        style={{ transform: [{ rotate: '180deg' }] }}
      />
    );
    
    return (
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        {BackIcon}
      </TouchableOpacity>
    );
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          shadowColor: colors.shadow,
        },
        headerAnimatedStyle,
        style,
      ]}
    >
      <StatusBar
        barStyle={colors.background === '#0A0A0C' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.contentContainer}>
        {renderBackButton()}
        
        <View style={[styles.titleContainer, { opacity: collapsible ? 0 : 1 }]}>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
                subtitleStyle,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
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
        </View>
        
        {collapsible && (
          <Animated.View
            style={[
              styles.animatedTitleContainer,
              titleAnimatedStyle,
            ]}
            pointerEvents="none"
          >
            <Text
              style={[
                styles.animatedTitle,
                { color: colors.text },
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Animated.View>
        )}
        
        {rightComponent && (
          <View style={styles.rightComponentContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT + (Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0),
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: FONT_WEIGHT.semiBold as any,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.regular,
    marginBottom: 2,
  },
  animatedTitleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  animatedTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.semiBold,
    fontWeight: FONT_WEIGHT.semiBold as any,
    textAlign: 'center',
  },
  rightComponentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});

export default Header;