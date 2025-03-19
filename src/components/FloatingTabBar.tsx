import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * A premium floating tab bar component that uses icon state changes instead of indicators
 */
const FloatingTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Get floating container style based on theme
  const getContainerStyle = (): ViewStyle => {
    return {
      backgroundColor: theme === 'dark' 
        ? 'rgba(25, 26, 37, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      shadowColor: theme === 'dark' ? '#000' : 'rgba(0, 0, 0, 0.2)',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: theme === 'dark' ? 0.25 : 0.15,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' 
        ? 'rgba(60, 60, 87, 0.4)' 
        : 'rgba(230, 230, 240, 0.6)',
    };
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom: Math.max(insets.bottom, 8) }
      ]}
    >
      <View
        style={[
          styles.floatingContainer,
          getContainerStyle()
        ]}
      >
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
              // Apply haptic feedback
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }

              // Smooth transition animation
              LayoutAnimation.configureNext({
                duration: 200,
                update: {
                  type: LayoutAnimation.Types.easeInEaseOut,
                },
              });
              
              // Navigate to the tab
              navigation.navigate(route.name);
            }
          };

          // Get icon component from options
          const Icon = options.tabBarIcon ? options.tabBarIcon : () => null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || `${route.name} tab`}
              // Fixed: Use a safe way to access testID that works with TypeScript
              testID={`${route.name}-tab`}
              onPress={onPress}
              style={[
                styles.tabButton,
                isFocused && styles.activeTabButton
              ]}
              activeOpacity={0.6}
            >
              {/* Tab Content */}
              <View style={styles.tabContent}>
                {/* Icon - the icon component handles its own state changes */}
                <Icon
                  size={moderateScale(24)}
                  color={isFocused ? colors.primary : colors.textSecondary}
                  focused={isFocused}
                />

                {/* Label */}
                <Text
                  variant="labelSmall"
                  color={isFocused ? colors.primary : colors.textTertiary}
                  style={[
                    styles.tabLabel,
                    isFocused && styles.activeTabLabel
                  ]}
                >
                  {label.toString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  floatingContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    height: 60,
    width: '100%',
    maxWidth: 420,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    // Using transform scale causes layout issues in some cases
    // So we're only applying styles that won't affect layout
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: normalize(10),
    marginTop: 4,
  },
  activeTabLabel: {
    fontWeight: '600',
  }
});

export default FloatingTabBar;