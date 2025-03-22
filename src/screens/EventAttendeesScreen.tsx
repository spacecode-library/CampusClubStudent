// src/screens/EventAttendeesScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackIcon, ProfileIcon } from '../components/NavigationIcons';
import * as Haptics from 'expo-haptics';
import ApiService, { RegisteredStudent } from '../services/ApiService';
import { StatusBar } from 'expo-status-bar';
import Skeleton from '../components/Skeleton';
import AsyncStorage from '@react-native-async-storage/async-storage';

type EventAttendeesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventAttendees'>;
type EventAttendeesScreenRouteProp = RouteProp<RootStackParamList, 'EventAttendees'>;

interface EventAttendeesScreenProps {
  navigation: EventAttendeesScreenNavigationProp;
  route: EventAttendeesScreenRouteProp;
}

const EventAttendeesScreen: React.FC<EventAttendeesScreenProps> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendees, setAttendees] = useState<RegisteredStudent[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Fetch attendees on mount
  useEffect(() => {
    fetchAttendees();
    fetchEventDetails();
    fetchCurrentUserId();
  }, [eventId]);
  
  // Fetch current user ID
  const fetchCurrentUserId = async () => {
    try {
      const userJson = await AsyncStorage.getItem('@campusclub:user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setCurrentUserId(userData.id);
      }
    } catch (error) {
      console.error('Error fetching current user ID:', error);
    }
  };
  
  // Fetch event details to get the title
  const fetchEventDetails = async () => {
    try {
      // Fetch events from all statuses to find the specific event
      const upcomingResponse = await ApiService.getEvents({
        status: 'upcoming',
        eventScope: 'university'
      });
      
      const liveResponse = await ApiService.getEvents({
        status: 'live',
        eventScope: 'university'
      });
      
      const completedResponse = await ApiService.getEvents({
        status: 'completed',
        eventScope: 'university'
      });
      
      // Combine all events and find the one with matching ID
      const allEvents = [
        ...(upcomingResponse.success && upcomingResponse.data ? upcomingResponse.data : []),
        ...(liveResponse.success && liveResponse.data ? liveResponse.data : []),
        ...(completedResponse.success && completedResponse.data ? completedResponse.data : [])
      ];
      
      const event = allEvents.find(e => e._id === eventId);
      
      if (event) {
        setEventTitle(event.title);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };
  
  // Fetch attendees from API
  const fetchAttendees = async () => {
    setLoading(true);
    
    try {
      const response = await ApiService.getRegisteredStudents(eventId);
      
      if (response.success && response.data) {
        setAttendees(response.data);
      } else {
        Alert.alert('Error', 'Failed to load attendees');
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendees();
  };
  
  // Render attendee item
  const renderAttendeeItem = ({ item }: { item: RegisteredStudent }) => {
    const isCurrentUser = item._id === currentUserId;
    
    return (
      <View style={[styles.attendeeCard, { backgroundColor: colors.card }]}>
        <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}20` }]}>
          <Text variant="titleMedium" color={colors.primary}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.attendeeInfo}>
          <View style={styles.nameRow}>
            <Text variant="bodyLarge" color={colors.text} style={styles.attendeeName}>
              {isCurrentUser ? 'You' : item.name}
            </Text>
            
            {isCurrentUser && (
              <View style={[styles.currentUserBadge, { backgroundColor: colors.primary }]}>
                <Text variant="labelSmall" color="white">You</Text>
              </View>
            )}
          </View>
          
          <Text variant="bodyMedium" color={colors.textSecondary}>
            {item.email}
          </Text>
        </View>
      </View>
    );
  };
  
  // Render loading skeleton
  const renderSkeletonItem = () => (
    <View style={[styles.attendeeCard, { backgroundColor: colors.card }]}>
      <Skeleton style={[styles.avatarCircle, { backgroundColor: `${colors.text}10` }]} />
      
      <View style={styles.attendeeInfo}>
        <Skeleton style={{ height: 18, width: '60%', marginBottom: SPACING.xs }} />
        <Skeleton style={{ height: 14, width: '80%' }} />
      </View>
    </View>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
        <ProfileIcon size={40} color={colors.primary} />
      </View>
      <Text variant="titleMedium" color={colors.text} style={styles.emptyTitle}>
        No Attendees Yet
      </Text>
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptyDescription}>
        No one has registered for this event yet. Check back later!
      </Text>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: colors.background, 
          paddingTop: insets.top,
          borderBottomColor: `${colors.text}10` 
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" color={colors.text} numberOfLines={1} style={styles.headerTitle}>
          {attendees.length} {attendees.length === 1 ? 'Attendee' : 'Attendees'}
        </Text>
        <View style={styles.backButton} /> {/* Empty view for centering */}
      </View>
      
      {/* Event Title */}
      <View style={[styles.eventTitleContainer, { borderBottomColor: `${colors.text}10` }]}>
        <Text variant="bodyLarge" color={colors.text} style={styles.eventTitle}>
          {eventTitle}
        </Text>
      </View>
      
      {/* Attendees List */}
      <FlatList
        data={loading ? Array(5).fill(null) : attendees}
        renderItem={loading ? renderSkeletonItem : renderAttendeeItem}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && attendees.length === 0 ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  eventTitleContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  eventTitle: {
    textAlign: 'center',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  attendeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  attendeeInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  attendeeName: {
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  currentUserBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  emptyIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginHorizontal: SPACING.xl,
  },
});

export default EventAttendeesScreen;