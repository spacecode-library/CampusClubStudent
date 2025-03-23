// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { 
  ThemeToggleIcon, 
  UserIcon, 
  EducationIcon, 
  IDCardIcon,
  EditIcon,
  LogoutIcon,
  PremiumIcon,
  RedemptionIcon,
  CalendarIcon,
  InfoIcon,
  SupportIcon,
  NotificationIcon,
  LocationIcon
} from '../components/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

// Define interface for student information
interface StudentInfo {
  name?: string;
  email?: string;
  profileImage?: string;
  StudentID?: string;
  university?: string;
  StudentCity?: string;
  StudentCountry?: string;
  redemptionCount?: string;
  eventsAttended?: string;
  savedDeals?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors, theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableLocationServices, setEnableLocationServices] = useState(true);
  const [activeTab, setActiveTab] = useState(1); // Default to Account tab
  
  useEffect(() => {
    fetchStudentInfo();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      setLoading(true);
      const studentStatus = await ApiService.getStudentStatus();
      if (studentStatus.success && studentStatus.data) {
        setStudentInfo(studentStatus.data);
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await ApiService.logout();
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error) {
              console.error('Error logging out:', error);
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Toggle handlers
  const handleNotificationsChange = (value: boolean) => {
    setEnableNotifications(value);
  };
  
  const handleLocationChange = (value: boolean) => {
    setEnableLocationServices(value);
  };
  
  // Navigation handlers
  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Edit Profile feature will be available in the next update!');
  };
  
  const handleViewRedemptions = () => {
    navigation.navigate('RedemptionHistory');
  };
  
  const handleSubscription = () => {
    navigation.navigate('Subscription');
  };
  
  const handleAbout = () => {
    Alert.alert('About CampusClub', 'CampusClub v1.0.0\n\nCampusClub helps students discover exclusive discounts and events on and around campus.');
  };
  
  const handleHelp = () => {
    Alert.alert('Help & Support', 'Need assistance? Contact us at support@campusclub.app');
  };

  // Tab content
  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text 
          variant="titleMedium" 
          color={colors.text} 
          style={{ marginBottom: SPACING.md, fontWeight: '600' }}
        >
          Student Information
        </Text>
        
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <IDCardIcon size={20} color={colors.primary} />
          </View>
          <View>
            <Text variant="labelSmall" color={colors.textSecondary}>
              STUDENT ID
            </Text>
            <Text variant="bodyMedium" color={colors.text}>
              {studentInfo?.StudentID || ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <EducationIcon size={20} color={colors.primary} />
          </View>
          <View>
            <Text variant="labelSmall" color={colors.textSecondary}>
              UNIVERSITY
            </Text>
            <Text variant="bodyMedium" color={colors.text}>
              {studentInfo?.university }
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <LocationIcon size={20} color={colors.primary} />
          </View>
          <View>
            <Text variant="labelSmall" color={colors.textSecondary}>
              LOCATION
            </Text>
            <Text variant="bodyMedium" color={colors.text}>
              {studentInfo?.StudentCity 
                ? `${studentInfo.StudentCity}, ${studentInfo.StudentCountry || ''}` 
                : ''}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <Text variant="headingMedium" color={colors.primary}>
              {studentInfo?.redemptionCount || '12'}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Redemptions
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statColumn}>
            <Text variant="headingMedium" color={colors.primary}>
              {studentInfo?.eventsAttended || '7'}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Events
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statColumn}>
            <Text variant="headingMedium" color={colors.primary}>
              {studentInfo?.savedDeals || '23'}
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Saved
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
  
  const renderAccountTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity 
        style={styles.premiumCardContainer}
        onPress={handleSubscription}
        activeOpacity={0.9}
      >
        <View style={[styles.premiumCard, { backgroundColor: '#FF8800' }]}>
          <View style={styles.premiumContent}>
            <View style={styles.premiumIconContainer}>
              <PremiumIcon size={24} color="#FFFFFF" />
            </View>
            <View style={styles.premiumTextContainer}>
              <Text variant="titleMedium" color="#FFFFFF" style={{ fontWeight: '700' }}>
                CampusClub Premium
              </Text>
              <Text variant="bodySmall" color="#FFFFFF" style={{ opacity: 0.9 }}>
                Unlock exclusive discounts and features
              </Text>
            </View>
            <View style={styles.upgradeButtonContainer}>
              <View style={styles.upgradeButton}>
                <Text variant="labelSmall" color="#FF8800" style={{ fontWeight: '600' }}>
                  UPGRADE
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleViewRedemptions}>
          <View style={styles.menuRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <RedemptionIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>My Redemptions</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>View your discount history</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} 
          onPress={() => navigation.navigate('Events')}
        >
          <View style={styles.menuRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <CalendarIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>Upcoming Events</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>See events you've registered for</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} 
          onPress={handleEditProfile}
        >
          <View style={styles.menuRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <EditIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>Edit Profile</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>Update your information</Text>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, marginTop: SPACING.md }]}>
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <View style={styles.menuRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <InfoIcon size={20} color={colors.primary} />
            </View>
            <Text variant="bodyMedium" color={colors.text}>About CampusClub</Text>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]} 
          onPress={handleHelp}
        >
          <View style={styles.menuRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <SupportIcon size={20} color={colors.primary} />
            </View>
            <Text variant="bodyMedium" color={colors.text}>Help & Support</Text>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={{ color: colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text 
          variant="titleSmall" 
          color={colors.text} 
          style={{ marginBottom: SPACING.sm, fontWeight: '600' }}
        >
          Appearance
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <ThemeToggleIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>Dark Mode</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                {theme === 'dark' ? 'Currently enabled' : 'Currently disabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: colors.primary + '70' }}
            thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, marginTop: SPACING.md }]}>
        <Text 
          variant="titleSmall" 
          color={colors.text} 
          style={{ marginBottom: SPACING.sm, fontWeight: '600' }}
        >
          Notifications
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <NotificationIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>Push Notifications</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Receive alerts about new discounts
              </Text>
            </View>
          </View>
          <Switch
            value={enableNotifications}
            onValueChange={handleNotificationsChange}
            trackColor={{ false: '#767577', true: colors.primary + '70' }}
            thumbColor={enableNotifications ? colors.primary : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
      
      <View style={[styles.card, { backgroundColor: colors.card, marginTop: SPACING.md }]}>
        <Text 
          variant="titleSmall" 
          color={colors.text} 
          style={{ marginBottom: SPACING.sm, fontWeight: '600' }}
        >
          Privacy
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <LocationIcon size={20} color={colors.primary} />
            </View>
            <View>
              <Text variant="bodyMedium" color={colors.text}>Location Services</Text>
              <Text variant="bodySmall" color={colors.textSecondary}>
                Find discounts near you
              </Text>
            </View>
          </View>
          <Switch
            value={enableLocationServices}
            onValueChange={handleLocationChange}
            trackColor={{ false: '#767577', true: colors.primary + '70' }}
            thumbColor={enableLocationServices ? colors.primary : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: theme === 'dark' ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.1)' }
        ]}
        onPress={handleLogout}
      >
        <View style={styles.logoutIconContainer}>
          <LogoutIcon size={20} color="#FF3B30" />
        </View>
        <Text variant="bodyLarge" color="#FF3B30" style={{ fontWeight: '600' }}>
          Log Out
        </Text>
      </TouchableOpacity>
      
      <Text 
        variant="labelSmall" 
        color={colors.textSecondary} 
        style={{ textAlign: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xxl }}
      >
        CampusClub v1.0.0
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ 
          paddingBottom: Math.max(20, insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View style={styles.profileContainer}>
          {/* Avatar */}
          <View style={[styles.avatarContainer, { borderColor: colors.primary + '30' }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Text 
                variant="headingLarge" 
                color={colors.primary}
                style={{ fontSize: moderateScale(32) }}
              >
                {studentInfo?.name ? studentInfo.name.charAt(0) : 'S'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditProfile}
            >
              <EditIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text 
              variant="headingMedium" 
              color={colors.text}
              style={{ fontWeight: '600' }}
            >
              {studentInfo?.name }
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary}>
              {studentInfo?.email || 'SWE2009962@xmu.edu.my'}
            </Text>
            
            <View style={styles.premiumBadge}>
              <View style={styles.premiumBadgeBackground}>
                <Text 
                  variant="labelSmall" 
                  color="#FFFFFF" 
                  style={{ fontWeight: '600' }}
                >
                  PREMIUM
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Tabs Navigation */}
        <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
          {['Info', 'Account', 'Settings'].map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                activeTab === index && [styles.activeTab, { borderBottomColor: colors.primary }]
              ]}
              onPress={() => setActiveTab(index)}
            >
              <Text 
                variant="bodyMedium" 
                color={activeTab === index ? colors.primary : colors.textSecondary}
                style={{ fontWeight: activeTab === index ? '600' : '400' }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Tab Content */}
        {activeTab === 0 && renderInfoTab()}
        {activeTab === 1 && renderAccountTab()}
        {activeTab === 2 && renderSettingsTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    borderWidth: 3,
    position: 'relative',
    overflow: 'visible',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  premiumBadge: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  },
  premiumBadgeBackground: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: '#FF8800',
    overflow: 'hidden',
  },
  
  // Tab Navigation
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  
  // Tab Content
  tabContent: {
    padding: SPACING.lg,
  },
  
  // Cards
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  // Stats Card
  statsCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  divider: {
    width: 1,
    height: '60%',
    opacity: 0.3,
  },
  
  // Premium Card
  premiumCardContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FFA500',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  premiumCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  upgradeButtonContainer: {
    marginLeft: SPACING.sm,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
  },
  logoutIconContainer: {
    marginRight: SPACING.sm,
  },
});

export default ProfileScreen;