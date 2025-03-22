// src/screens/EventsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
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
  PlusIcon
} from '../components/NavigationIcons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import EventStatusBadge from '../components/EventStatusBadge';
import ApiService, { Event } from '../services/ApiService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import Skeleton from '../components/Skeleton';

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;

interface EventsScreenProps {
  navigation: EventsScreenNavigationProp;
}

// Interface for EventCard props
interface EventCardProps {
  event: Event;
  featured?: boolean;
  onPress: (event: Event) => void;
  registeredCount?: number;
}

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [eventRegistrationCounts, setEventRegistrationCounts] = useState<Record<string, number>>({});

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      // Fetch upcoming events
      const upcomingResponse = await ApiService.getEvents({
        status: 'upcoming',
        eventScope: 'university'
      });
      
      // Fetch live events
      const liveResponse = await ApiService.getEvents({
        status: 'live',
        eventScope: 'university'
      });
      
      // Fetch completed events
      const completedResponse = await ApiService.getEvents({
        status: 'completed',
        eventScope: 'university'
      });
      
      if (upcomingResponse.success && upcomingResponse.data) {
        setUpcomingEvents(upcomingResponse.data);
        
        // Fetch registration counts for upcoming events
        await Promise.all(upcomingResponse.data.map(async (event) => {
          try {
            const regResponse = await ApiService.getRegisteredStudents(event._id);
            // Use optional chaining and nullish coalescing to safely access data
            const count = regResponse?.data?.length ?? 0;
            
            if (count > 0) {
              setEventRegistrationCounts(prev => ({
                ...prev,
                [event._id]: count
              }));
            }
          } catch (error) {
            console.error(`Error fetching registrations for event ${event._id}:`, error);
          }
        }));
      }
      
      if (liveResponse.success && liveResponse.data) {
        setLiveEvents(liveResponse.data);
        
        // Fetch registration counts for live events
        await Promise.all(liveResponse.data.map(async (event) => {
          try {
            const regResponse = await ApiService.getRegisteredStudents(event._id);
            // Use optional chaining and nullish coalescing to safely access data
            const count = regResponse?.data?.length ?? 0;
            
            if (count > 0) {
              setEventRegistrationCounts(prev => ({
                ...prev,
                [event._id]: count
              }));
            }
          } catch (error) {
            console.error(`Error fetching registrations for event ${event._id}:`, error);
          }
        }));
      }
      
      if (completedResponse.success && completedResponse.data) {
        setCompletedEvents(completedResponse.data);
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

  // Handle create event press
  const handleCreateEvent = () => {
    // Apply haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    navigation.navigate('CreateEvent');
  };

  // Handle see all press
  const handleSeeAllPress = (status: 'upcoming' | 'live' | 'completed') => {
    navigation.navigate('EventsList', { status });
  };

  // Format date for display
  const formatEventDate = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const dateStr = format(start, 'MMM d, yyyy');
      const startTimeStr = format(start, 'h:mm a');
      const endTimeStr = format(end, 'h:mm a');
      
      return `${dateStr} • ${startTimeStr} - ${endTimeStr}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return startTime;
    }
  };

  // Event Card Component
  const EventCard: React.FC<EventCardProps> = ({ event, featured = false, onPress, registeredCount = 0 }) => (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'timing', 
        duration: 500, 
        delay: featured ? 200 : 300
      }}
    >
      <TouchableOpacity
        style={[
          styles.eventCard,
          featured ? styles.featuredEventCard : styles.regularEventCard,
          { 
            backgroundColor: colors.card,
            shadowColor: theme === 'dark' ? '#000' : '#888', 
            elevation: featured ? 5 : 3
          }
        ]}
        activeOpacity={0.9}
        onPress={() => onPress(event)}
      >
        <Image 
          source={{ uri: event.backgroundImage }} 
          style={[
            styles.eventImage,
            featured ? styles.featuredEventImage : styles.regularEventImage
          ]}
        />
        
        {/* Status badge for featured events */}
        {featured && (
          <View style={styles.eventStatusContainer}>
            <EventStatusBadge status={event.status} />
          </View>
        )}
        
        <View style={styles.eventContent}>
          <Text 
            variant={featured ? "titleMedium" : "titleSmall"} 
            color={colors.text} 
            numberOfLines={2}
            style={styles.eventTitle}
          >
            {event.title}
          </Text>
          
          <View style={styles.eventMeta}>
            <CalendarIcon size={14} color={colors.textSecondary} />
            <Text 
              variant="bodySmall" 
              color={colors.textSecondary}
              style={styles.eventMetaText}
              numberOfLines={1}
            >
              {formatEventDate(event.startTime, event.endTime)}
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
              {event.venue}
            </Text>
          </View>
          
          <View style={styles.attendingContainer}>
            <PeopleIcon size={12} color={colors.primary} />
            <Text 
              variant="labelSmall" 
              color={colors.primary}
              style={{marginLeft: 4}}
            >
              {registeredCount} attending
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
  
  // Loading skeleton for event cards
  const EventCardSkeleton: React.FC<{featured?: boolean}> = ({ featured = false }) => (
    <View 
      style={[
        styles.eventCard,
        featured ? styles.featuredEventCard : styles.regularEventCard,
        { backgroundColor: colors.card }
      ]}
    >
      <Skeleton 
        style={[
          featured ? styles.featuredEventImage : styles.regularEventImage,
          { backgroundColor: `${colors.text}10` }
        ]} 
      />
      <View style={styles.eventContent}>
        <Skeleton 
          style={{
            height: moderateScale(18),
            width: '80%',
            marginBottom: SPACING.xs,
            backgroundColor: `${colors.text}10`
          }} 
        />
        <Skeleton 
          style={{
            height: moderateScale(12),
            width: '70%',
            marginBottom: SPACING.xs,
            backgroundColor: `${colors.text}10`
          }} 
        />
        <Skeleton 
          style={{
            height: moderateScale(12),
            width: '60%',
            marginBottom: SPACING.xs,
            backgroundColor: `${colors.text}10`
          }} 
        />
        <Skeleton 
          style={{
            height: moderateScale(12),
            width: '40%',
            marginTop: SPACING.xs,
            backgroundColor: `${colors.text}10`
          }} 
        />
      </View>
    </View>
  );

  // Render empty content container
  const renderEmptyContent = () => (
    <View style={styles.emptyContentContainer}>
      <Image 
        source={require('../assets/images/empty-events.png')} 
        style={styles.emptyStateImage} 
        resizeMode="contain"
      />
      <Text variant="titleMedium" color={colors.text} style={styles.emptyStateTitle}>
        No Events Found
      </Text>
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptyStateDescription}>
        Be the first to create an event for your campus community!
      </Text>
      <TouchableOpacity 
        style={[styles.createEventButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateEvent}
      >
        <Text variant="labelLarge" color={colors.onPrimary}>
          Create Event
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text variant="headingMedium" color={colors.text}>
          Campus Events
        </Text>
        <Text variant="bodyMedium" color={colors.textSecondary}>
          Find exciting events around campus
        </Text>
      </View>
      
      {loading ? (
        // Loading state
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Live Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text variant="titleSmall" color={colors.text}>Live Now</Text>
                <View style={[styles.liveIndicator, { backgroundColor: colors.error }]} />
              </View>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {Array(2).fill(0).map((_, index) => (
                <View key={`live-skeleton-${index}`} style={styles.featuredCardWrapper}>
                  <EventCardSkeleton featured={true} />
                </View>
              ))}
            </ScrollView>
          </View>
          
          {/* Section: Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" color={colors.text}>Upcoming Events</Text>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {Array(3).fill(0).map((_, index) => (
                <View key={`upcoming-skeleton-${index}`} style={styles.featuredCardWrapper}>
                  <EventCardSkeleton featured={true} />
                </View>
              ))}
            </ScrollView>
          </View>
          
          {/* Section: Recent Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" color={colors.text}>Recent Events</Text>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            {Array(3).fill(0).map((_, index) => (
              <EventCardSkeleton key={`recent-skeleton-${index}`} />
            ))}
          </View>
        </ScrollView>
      ) : upcomingEvents.length === 0 && liveEvents.length === 0 && completedEvents.length === 0 ? (
        // Empty state
        renderEmptyContent()
      ) : (
        // Populated state
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Section: Live Events */}
          {liveEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Text variant="titleSmall" color={colors.text}>Live Now</Text>
                  <View style={[styles.liveIndicator, { backgroundColor: colors.error }]} />
                </View>
                <TouchableOpacity onPress={() => handleSeeAllPress('live')}>
                  <Text variant="labelMedium" color={colors.primary}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredContainer}
                decelerationRate="fast"
              >
                {liveEvents.map(event => (
                  <View key={event._id} style={styles.featuredCardWrapper}>
                    <EventCard 
                      event={event} 
                      featured={true} 
                      onPress={handleEventPress}
                      registeredCount={eventRegistrationCounts[event._id] || 0}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Section: Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleSmall" color={colors.text}>Upcoming Events</Text>
                <TouchableOpacity onPress={() => handleSeeAllPress('upcoming')}>
                  <Text variant="labelMedium" color={colors.primary}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredContainer}
                decelerationRate="fast"
              >
                {upcomingEvents.map(event => (
                  <View key={event._id} style={styles.featuredCardWrapper}>
                    <EventCard 
                      event={event} 
                      featured={true} 
                      onPress={handleEventPress}
                      registeredCount={eventRegistrationCounts[event._id] || 0}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Section: Recent Completed Events */}
          {completedEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleSmall" color={colors.text}>Recent Events</Text>
                <TouchableOpacity onPress={() => handleSeeAllPress('completed')}>
                  <Text variant="labelMedium" color={colors.primary}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <View>
                {completedEvents.slice(0, 3).map(event => (
                  <EventCard 
                    key={event._id} 
                    event={event} 
                    featured={false} 
                    onPress={handleEventPress} 
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 80, // Space for bottom navigation
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: SPACING.xs,
  },
  featuredContainer: {
    paddingBottom: SPACING.xs,
  },
  featuredCardWrapper: {
    marginRight: SPACING.md,
  },
  eventCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuredEventCard: {
    width: moderateScale(260),
    height: moderateScale(230),
  },
  regularEventCard: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    height: moderateScale(110),
  },
  eventImage: {
    backgroundColor: '#E1E1E1',
  },
  featuredEventImage: {
    width: '100%',
    height: moderateScale(140),
  },
  regularEventImage: {
    width: moderateScale(100),
    height: '100%',
  },
  eventStatusContainer: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
  },
  eventContent: {
    padding: SPACING.md,
    flex: 1,
  },
  eventTitle: {
    marginBottom: SPACING.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  eventMetaText: {
    marginLeft: 4,
    flex: 1,
  },
  attendingContainer: {
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCreateButton: {
    position: 'absolute',
    bottom: 80, // Adjust based on tab bar height
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 999,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateImage: {
    width: moderateScale(150),
    height: moderateScale(150),
    marginBottom: SPACING.lg,
    opacity: 0.8,
  },
  emptyStateTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  createEventButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
});

export default EventsScreen;