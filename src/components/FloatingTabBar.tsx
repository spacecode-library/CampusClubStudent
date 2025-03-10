import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager,
  ViewStyle
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { moderateScale, normalize } from '../utils/responsiveUtils';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Get the window width for the animation values
const { width } = Dimensions.get('window');

const FloatingTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation for the active indicator
  const tabWidth = width / state.routes.length;
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;
  const prevIndex = useRef(state.index);

  useEffect(() => {
    // Only animate if tab index has changed
    if (prevIndex.current !== state.index) {
      // Apply haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Animate indicator scale out and in
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate icon scale down and up
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Animate text opacity and scale
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset previous animations after timeout
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(textScale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);
    }
    
    // Animate the indicator
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 10
    }).start();
    
    prevIndex.current = state.index;
  }, [state.index, tabWidth, translateX, iconScale, textOpacity, textScale, scaleX]);

  // Get background style with shadow or elevation
  const getContainerStyle = (): ViewStyle => {
    return {
      backgroundColor: colors.card,
      shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
      borderTopWidth: 0, // Remove the standard border
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    };
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: 'transparent', 
          paddingBottom: Math.max(insets.bottom, 8)
        },
      ]}
    >
      <Animated.View
        style={[
          styles.floatingContainer,
          getContainerStyle()
        ]}
      >
        {/* Animated Indicator */}
        <Animated.View 
          style={[
            styles.activeIndicator,
            {
              backgroundColor: `${colors.primary}20`,
              transform: [
                { translateX },
                { scaleX }
              ],
              width: tabWidth,
            }
          ]}
        >
          <View 
            style={[
              styles.indicatorPill, 
              { backgroundColor: colors.primary }
            ]} 
          />
        </Animated.View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Custom layout animation
              LayoutAnimation.configureNext({
                duration: 300,
                update: {
                  type: LayoutAnimation.Types.easeInEaseOut,
                },
              });
              // Navigate to the tab
              navigation.navigate(route.name);
            }
          };

          // Determine which icon to show - Utilizing the iconProps pattern from React Navigation
          const Icon = options.tabBarIcon ? options.tabBarIcon : () => null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || `${route.name} tab`}
              testID={(options as any).tabBarTestID || `${route.name}-tab`}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {/* Animated icon container with scale effect */}
                <MotiView
                  style={styles.iconContainer}
                  animate={{ 
                    scale: isFocused ? 1 : 0.85,
                  }}
                  transition={{ 
                    type: 'timing',
                    duration: 300,
                  }}
                >
                  <Icon
                    size={moderateScale(24)}
                    color={isFocused ? colors.primary : colors.textSecondary}
                    focused={isFocused}
                  />
                </MotiView>
                
                {/* Conditionally render label text with fade animation */}
                {isFocused && (
                  <Animated.View
                    style={[
                      styles.labelContainer,
                      {
                        opacity: textOpacity,
                        transform: [{ scale: textScale }]
                      }
                    ]}
                  >
                    <Text
                      variant="labelSmall"
                      color={colors.primary}
                      style={styles.tabLabel}
                    >
                      {label.toString()}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  floatingContainer: {
    flexDirection: 'row',
    borderRadius: 30,
    height: 65,
    width: '100%',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: moderateScale(46),
    height: moderateScale(46),
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: -18,
  },
  tabLabel: {
    fontSize: normalize(10),
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorPill: {
    width: moderateScale(30),
    height: 4,
    borderRadius: 2,
    marginTop: -16,
  },
});

export default FloatingTabBar;