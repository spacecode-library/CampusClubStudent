// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Animated,
  Switch,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { 
  ThemeToggleIcon, 
  UserIcon, 
  EducationIcon, 
  IDCardIcon,
} from '../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

// Icons for menu sections
import { 
  HomeIcon, 
  ExploreIcon, 
  EventIcon, 
  SaleTagIcon, 
  LocationPinIcon,
  ProfileIcon,
} from '../components/NavigationIcons';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableLocationServices, setEnableLocationServices] = useState(true);
  
  // Animation values
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [moderateScale(180), moderateScale(80)],
    extrapolate: 'clamp'
  });
  
  const avatarSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [moderateScale(80), moderateScale(40)],
    extrapolate: 'clamp'
  });
  
  const avatarPosition = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 40],
    extrapolate: 'clamp'
  });

  useEffect(() => {
    fetchStudentInfo();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const studentStatus = await ApiService.getStudentStatus();
      if (studentStatus.success && studentStatus.data) {
        setStudentInfo(studentStatus.data);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await ApiService.logout();
      // Reset navigation and go to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle switch toggles
  const handleNotificationsChange = (value: boolean) => {
    setEnableNotifications(value);
  };
  
  const handleLocationChange = (value: boolean) => {
    setEnableLocationServices(value);
  };
  
  // Handle menu items
  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Edit Profile feature will be available in the next update!');
  };
  
  const handlePreferences = () => {
    Alert.alert('Coming Soon', 'Preferences feature will be available in the next update!');
  };
  
  const handleAbout = () => {
    Alert.alert('About CampusClub', 'CampusClub v1.0.0\n\nCampusClub helps students discover exclusive discounts and events on and around campus.');
  };
  
  const handleHelp = () => {
    Alert.alert('Help & Support', 'Need assistance? Contact us at support@campusclub.app');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            backgroundColor: colors.background,
            height: headerHeight,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            paddingTop: insets.top + SPACING.md,
          }
        ]}
      >
        <View style={styles.headerTitleContainer}>
          <Text variant="headingLarge" color={colors.text}>
            Profile
          </Text>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
          >
            <ThemeToggleIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[styles.profilePreview, { opacity: headerOpacity }]}>
          <Animated.View 
            style={[
              styles.profileImageContainer, 
              { 
                backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary,
                width: avatarSize,
                height: avatarSize,
                borderRadius: Animated.divide(avatarSize, new Animated.Value(2)),
                transform: [{ translateX: avatarPosition }]
              }
            ]}
          >
            <Text 
              variant="headingLarge" 
              color={colors.primary}
              style={{ fontSize: moderateScale(32) }}
            >
              {studentInfo?.name ? studentInfo.name.charAt(0) : 'S'}
            </Text>
          </Animated.View>
          
          <Animated.View style={[styles.profileInfo, { opacity: headerOpacity }]}>
            <Text variant="titleMedium" color={colors.text} numberOfLines={1}>
              {studentInfo?.name || 'Student'}
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} numberOfLines={1}>
              {studentInfo?.email || 'student@example.com'}
            </Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: moderateScale(190) }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Student info card */}
        <View 
          style={[
            styles.infoCard, 
            { 
              backgroundColor: colors.card,
              shadowColor: theme === 'dark' ? '#000' : '#888',
            }
          ]}
        >
          <View style={styles.infoCardHeader}>
            <Text variant="titleSmall" color={colors.text}>
              Student Information
            </Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text variant="labelMedium" color={colors.primary}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <IDCardIcon size={20} color={colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text variant="labelSmall" color={colors.textSecondary}>
                STUDENT ID
              </Text>
              <Text variant="bodyMedium" color={colors.text}>
                {studentInfo?.StudentID || 'Not set'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <EducationIcon size={20} color={colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text variant="labelSmall" color={colors.textSecondary}>
                UNIVERSITY
              </Text>
              <Text variant="bodyMedium" color={colors.text}>
                {studentInfo?.university || 'Not set'}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <LocationPinIcon size={20} color={colors.primary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text variant="labelSmall" color={colors.textSecondary}>
                LOCATION
              </Text>
              <Text variant="bodyMedium" color={colors.text}>
                {studentInfo?.StudentCity ? `${studentInfo.StudentCity}, ${studentInfo.StudentCountry || ''}` : 'Not set'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Settings sections */}
        <View style={styles.settingsSection}>
          <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
            Settings
          </Text>
          
          <View 
            style={[
              styles.settingsCard, 
              { 
                backgroundColor: colors.card,
                shadowColor: theme === 'dark' ? '#000' : '#888',
              }
            ]}
          >
            {/* Notifications toggle */}
            <View style={[styles.settingsRow, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={styles.settingIcon}>🔔</Text>
                </View>
                <View>
                  <Text variant="bodyLarge" color={colors.text}>
                    Notifications
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Receive alerts about new discounts
                  </Text>
                </View>
              </View>
              <Switch
                value={enableNotifications}
                onValueChange={handleNotificationsChange}
                trackColor={{ false: '#767577', true: `${colors.primary}90` }}
                thumbColor={enableNotifications ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
            
            {/* Location services toggle */}
            <View style={styles.settingsRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.settingIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={styles.settingIcon}>📍</Text>
                </View>
                <View>
                  <Text variant="bodyLarge" color={colors.text}>
                    Location Services
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Find discounts near you
                  </Text>
                </View>
              </View>
              <Switch
                value={enableLocationServices}
                onValueChange={handleLocationChange}
                trackColor={{ false: '#767577', true: `${colors.primary}90` }}
                thumbColor={enableLocationServices ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>
        
        {/* Menu sections */}
        <View style={styles.menuSection}>
          <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
            App
          </Text>
          
          <View 
            style={[
              styles.menuCard, 
              { 
                backgroundColor: colors.card,
                shadowColor: theme === 'dark' ? '#000' : '#888',
              }
            ]}
          >
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={handleAbout}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={styles.menuIcon}>ℹ️</Text>
                </View>
                <Text variant="bodyLarge" color={colors.text}>
                  About CampusClub
                </Text>
              </View>
              <Text variant="labelLarge" color={colors.textTertiary}>
                &rsaquo;
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleHelp}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={styles.menuIcon}>❓</Text>
                </View>
                <Text variant="bodyLarge" color={colors.text}>
                  Help & Support
                </Text>
              </View>
              <Text variant="labelLarge" color={colors.textTertiary}>
                &rsaquo;
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Logout button */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          loading={loading}
          style={styles.logoutButton}
        />

        {/* App version */}
        <Text 
          variant="labelSmall" 
          color={colors.textTertiary}
          align="center"
          style={styles.versionText}
        >
          CampusClub v1.0.0
        </Text>
        
        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeToggle: {
    padding: SPACING.xs,
  },
  profilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  profileImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  infoCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    marginRight: SPACING.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  settingsCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingIcon: {
    fontSize: 18,
  },
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuIcon: {
    fontSize: 18,
  },
  logoutButton: {
    marginBottom: SPACING.lg,
  },
  versionText: {
    marginBottom: SPACING.xxl,
  },
  bottomSpacer: {
    height: 100, // Space for bottom navigation
  },
});

export default ProfileScreen;