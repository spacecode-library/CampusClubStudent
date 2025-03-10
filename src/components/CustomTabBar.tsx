// src/components/CustomTabBar.tsx
import React, { useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { moderateScale, normalize } from '../utils/responsiveUtils';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, ExploreIcon, EventIcon, ProfileIcon } from './NavigationIcons';

// Get the window width for the animation values
const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ 
  state, 
  descriptors, 
  navigation 
}) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation for the active indicator
  const tabWidth = width / state.routes.length;
  const translateX = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the indicator when active tab changes
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 10
    }).start();
  }, [state.index, tabWidth, translateX]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          paddingBottom: Math.max(insets.bottom, 8),
          borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          shadowColor: theme === 'dark' ? '#000' : 'rgba(0,0,0,0.3)',
        },
      ]}
    >
      {/* Animated Indicator Line */}
      <Animated.View 
        style={[
          styles.activeIndicator,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX }],
            width: tabWidth,
          }
        ]}
      >
        <View style={[styles.indicatorPill, { backgroundColor: colors.primary }]} />
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
            // Haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            // Navigate to the tab
            navigation.navigate(route.name);
          }
        };

        // Determine which icon to show
        let Icon;
        switch (route.name) {
          case 'Home':
            Icon = HomeIcon;
            break;
          case 'Explore':
            Icon = ExploreIcon;
            break;
          case 'Events':
            Icon = EventIcon;
            break;
          case 'Profile':
            Icon = ProfileIcon;
            break;
          default:
            Icon = HomeIcon;
        }

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
            <Icon
              size={moderateScale(24)}
              color={isFocused ? colors.primary : colors.textSecondary}
              filled={isFocused}
            />
            <Text
              variant="labelSmall"
              color={isFocused ? colors.primary : colors.textSecondary}
              style={styles.tabLabel}
            >
              {label.toString()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 70,
    paddingTop: 10,
    // Add elevation for Android
    elevation: 8,
    // Shadow for iOS
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: normalize(10),
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    alignItems: 'center',
  },
  indicatorPill: {
    width: moderateScale(30),
    height: 4,
    borderRadius: 2,
    top: -1,
  },
});

export default CustomTabBar;