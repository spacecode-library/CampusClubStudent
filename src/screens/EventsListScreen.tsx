// src/screens/EventsListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  CalendarIcon, 
  LocationPinIcon, 
  PeopleIcon, 
  BackIcon 
} from '../components/NavigationIcons';
import * as Haptics from 'expo-haptics';
import EventStatusBadge from '../components/EventStatusBadge';
import ApiService, { Event } from '../services/ApiService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import Skeleton from '../components/Skeleton';

type EventsListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventsList'>;
type EventsListScreenRouteProp = RouteProp<RootStackParamList, 'EventsList'>;

interface EventsListScreenProps {
  navigation: EventsListScreenNavigationProp;
  route: EventsListScreenRouteProp;
}

const EventsListScreen: React.FC<EventsListScreenProps> = ({ navigation, route }) => {
  const { status } = route.params;
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  
  // Status title mapping
  const statusTitles: Record<string, string> = {
    'UPCOMING': 'Upcoming Events',
    'LIVE': 'Live Events',
    'COMPLETED': 'Past Events'
  };
  
  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [status]);
  
  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      const response = await ApiService.getEvents({
        status: status,
        eventScope: 'UNIVERSITY'
      });
      
      if (response.success && response.data) {
        setEvents(response.data);
        
        // Fetch registration counts for each event
        const counts: Record<string, number> = {};
        
        await Promise.all(response.data.map(async (event) => {
          try {
            const regResponse = await ApiService.getRegisteredStudents(event._id);
            if (regResponse.success && regResponse.data) {
              counts[event._id] = regResponse.data.length;
            }
          } catch (error) {
            console.error(`Error fetching registrations for event ${event._id}:`, error);
          }
        }));
        
        setRegistrationCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
  };
  
  // Handle event press
  const handleEventPress = (event: Event) => {
    // Apply haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    navigation.navigate('EventDetails', { eventId: event._id });
  };
  
  // Format date for display
  const formatEventDate = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const dateStr = format(start, 'EEE, MMM d');
      const startTimeStr = format(start, 'h:mm a');
      const endTimeStr = format(end, 'h:mm a');
      
      return `${dateStr} • ${startTimeStr} - ${endTimeStr}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return startTime;
    }
  };
  
  // Render event item
  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: colors.card }]}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.backgroundImage }}
        style={styles.eventImage}
        resizeMode="cover"
      />
      
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text variant="titleSmall" color={colors.text} numberOfLines={1} style={styles.eventTitle}>
            {item.title}
          </Text>
          <EventStatusBadge status={item.status} />
        </View>
        
        <View style={styles.eventMeta}>
          <CalendarIcon size={14} color={colors.textSecondary} />
          <Text 
            variant="bodySmall" 
            color={colors.textSecondary}
            style={styles.eventMetaText}
            numberOfLines={1}
          >
            {formatEventDate(item.startTime, item.endTime)}
          </Text>
        </View>
        
        <View style={styles.eventMeta}>
          <LocationPinIcon size={14} color={colors.textSecondary} />
          <Text 
            variant="bodySmall" 
            color={colors.textSecondary}
            style={styles.eventMetaText}
            numberOfLines={1}
          >
            {item.venue}
          </Text>
        </View>
        
        <View style={styles.eventFooter}>
          <View style={styles.attendingContainer}>
            <PeopleIcon size={12} color={colors.primary} />
            <Text 
              variant="labelSmall" 
              color={colors.primary}
              style={styles.attendingText}
            >
              {registrationCounts[item._id] || 0} attending
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  // Render loading skeleton
  const renderSkeletonItem = () => (
    <View style={[styles.eventCard, { backgroundColor: colors.card }]}>
      <Skeleton style={styles.eventImage} />
      <View style={styles.eventContent}>
        <Skeleton style={{ height: 20, width: '80%', marginBottom: SPACING.xs }} />
        <Skeleton style={{ height: 16, width: '70%', marginBottom: SPACING.xs }} />
        <Skeleton style={{ height: 16, width: '60%', marginBottom: SPACING.xs }} />
        <Skeleton style={{ height: 16, width: '40%', marginTop: SPACING.xs }} />
      </View>
    </View>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/images/empty-events.png')} 
        style={styles.emptyImage} 
        resizeMode="contain"
      />
      <Text variant="titleMedium" color={colors.text} style={styles.emptyTitle}>
        No {status} events
      </Text>
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptyDescription}>
        {status === 'UPCOMING' 
          ? 'There are no upcoming events scheduled yet. Check back later or create your own event!'
          : status === 'LIVE'
          ? 'There are no live events happening right now. Check back later!'
          : 'There are no past events to display.'}
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
        <Text variant="titleMedium" color={colors.text}>
          {statusTitles[status] || 'Events'}
        </Text>
        <View style={styles.backButton} /> {/* Empty view for centering */}
      </View>
      
      {/* Events List */}
      <FlatList
        data={loading ? Array(5).fill(null) : events}
        renderItem={loading ? renderSkeletonItem : renderEventItem}
        keyExtractor={(item, index) => loading ? `skeleton-${index}` : item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmptyState : null}
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
  backButton: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventImage: {
    width: moderateScale(120),
    height: '100%',
  },
  eventContent: {
    flex: 1,
    padding: SPACING.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  eventTitle: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  eventMetaText: {
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  attendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendingText: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xxl,
  },
  emptyImage: {
    width: moderateScale(150),
    height: moderateScale(150),
    marginBottom: SPACING.lg,
    opacity: 0.8,
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

export default EventsListScreen;