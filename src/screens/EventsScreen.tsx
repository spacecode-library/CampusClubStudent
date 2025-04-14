import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Dimensions,
  Pressable,
  TextInput,
  Image,
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
  PlusIcon,
  VideoIcon,
  GlobeIcon,
  LocationPinIcon,
  SearchIcon,
  UniversityIcon,
  PublicIcon,
} from '../components/NavigationIcons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import ApiService, { Event } from '../services/ApiService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import Skeleton from '../components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import debounce from 'lodash/debounce';

// Placeholder icons for status badges (replace with actual icons in your project)
const ClockIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);
const PlayIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);
const CheckIcon = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);

const { width: screenWidth } = Dimensions.get('window');

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;

interface EventsScreenProps {
  navigation: EventsScreenNavigationProp;
}

interface EventCardProps {
  event: Event;
  featured?: boolean;
  onPress: (event: Event) => void;
}

interface EventData {
  upcoming: Event[];
  live: Event[];
  completed: Event[];
}

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publicEvents, setPublicEvents] = useState<EventData>({ upcoming: [], live: [], completed: [] });
  const [universityEvents, setUniversityEvents] = useState<EventData>({ upcoming: [], live: [], completed: [] });
  const [filteredPublicEvents, setFilteredPublicEvents] = useState<EventData>({ upcoming: [], live: [], completed: [] });
  const [filteredUniversityEvents, setFilteredUniversityEvents] = useState<EventData>({ upcoming: [], live: [], completed: [] });
  const [error, setError] = useState<string | null>(null);
  const [isFabPressed, setIsFabPressed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoEventsNotice, setShowNoEventsNotice] = useState(true);
  const eventCache = useMemo(() => new Map<string, EventData>(), []);

  const categorizeEvents = useCallback((events: Event[]): EventData => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const upcoming: Event[] = [];
    const live: Event[] = [];
    const completed: Event[] = [];

    events.forEach((event) => {
      const startTime = event.startTime;
      const endTime = event.endTime;

      if (now < startTime) {
        upcoming.push({ ...event, status: 'UPCOMING' });
      } else if (now >= startTime && now <= endTime) {
        live.push({ ...event, status: 'LIVE' });
      } else if (now > endTime) {
        completed.push({ ...event, status: 'COMPLETED' });
      }
    });

    return { upcoming, live, completed };
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch PUBLIC events
      const publicCacheKey = 'PUBLIC_EVENTS';
      let publicEventsData: Event[] = [];
      if (eventCache.has(publicCacheKey) && !refreshing) {
        const cachedPublicEvents = eventCache.get(publicCacheKey)!;
        setPublicEvents(cachedPublicEvents);
        setFilteredPublicEvents(cachedPublicEvents);
      } else {
        const publicResponse = await ApiService.getEvents('PUBLIC');
        if (publicResponse.success && publicResponse.data) {
          publicEventsData = publicResponse.data;
          const categorizedPublicEvents = categorizeEvents(publicEventsData);
          setPublicEvents(categorizedPublicEvents);
          setFilteredPublicEvents(categorizedPublicEvents);
          eventCache.set(publicCacheKey, categorizedPublicEvents);
        } else {
          setError(publicResponse.message?.toString() || 'Failed to fetch public events');
        }
      }

      // Fetch UNIVERSITY events
      const universityCacheKey = 'UNIVERSITY_EVENTS';
      let universityEventsData: Event[] = [];
      if (eventCache.has(universityCacheKey) && !refreshing) {
        const cachedUniversityEvents = eventCache.get(universityCacheKey)!;
        setUniversityEvents(cachedUniversityEvents);
        setFilteredUniversityEvents(cachedUniversityEvents);
      } else {
        const universityResponse = await ApiService.getEvents('UNIVERSITY');
        if (universityResponse.success && universityResponse.data) {
          universityEventsData = universityResponse.data;
          const categorizedUniversityEvents = categorizeEvents(universityEventsData);
          setUniversityEvents(categorizedUniversityEvents);
          setFilteredUniversityEvents(categorizedUniversityEvents);
          eventCache.set(universityCacheKey, categorizedUniversityEvents);
        } else {
          setError(universityResponse.message?.toString() || 'Failed to fetch university events');
        }
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message || 'An unexpected error occurred while fetching events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, eventCache, categorizeEvents]);

  useEffect(() => {
    // Periodically check event status every minute
    const interval = setInterval(() => {
      const updatedPublicEvents = categorizeEvents(publicEvents.upcoming.concat(publicEvents.live, publicEvents.completed));
      const updatedUniversityEvents = categorizeEvents(universityEvents.upcoming.concat(universityEvents.live, universityEvents.completed));
      setPublicEvents(updatedPublicEvents);
      setUniversityEvents(updatedUniversityEvents);

      // Re-apply search filter after updating categories
      const lowerQuery = searchQuery.toLowerCase();
      const filterEvents = (events: Event[]) =>
        events.filter((event) => {
          const dateStr = formatEventDate(event.startTime).toLowerCase();
          return event.title.toLowerCase().includes(lowerQuery) || dateStr.includes(lowerQuery);
        });

      setFilteredPublicEvents({
        upcoming: filterEvents(updatedPublicEvents.upcoming),
        live: filterEvents(updatedPublicEvents.live),
        completed: filterEvents(updatedPublicEvents.completed),
      });

      setFilteredUniversityEvents({
        upcoming: filterEvents(updatedUniversityEvents.upcoming),
        live: filterEvents(updatedUniversityEvents.live),
        completed: filterEvents(updatedUniversityEvents.completed),
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [publicEvents, universityEvents, searchQuery, categorizeEvents]);

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      // Reset the "No Upcoming Events" notice when screen comes into focus
      setShowNoEventsNotice(true);
    }, [fetchEvents])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery('');
    setShowNoEventsNotice(true);
    await fetchEvents();
  }, [fetchEvents]);

  const handleEventPress = useCallback((event: Event) => {
    console.log('Event clicked:', event._id, event.title);
    console.log('Navigating to EventDetails with eventId:', event._id, 'and eventScope:', event.eventScope);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('EventDetails', { eventId: event._id, eventScope: event.eventScope });
  }, [navigation]);

  const handleCreateEvent = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('CreateEvent');
  }, [navigation]);

  const handleSeeAllPress = useCallback((status: 'UPCOMING' | 'LIVE' | 'COMPLETED', scope: 'PUBLIC' | 'UNIVERSITY' = 'PUBLIC') => {
    navigation.navigate('EventsList', { status, scope });
  }, [navigation]);

  const formatEventDate = useCallback((startTime: number) => {
    try {
      const start = new Date(startTime * 1000);
      return format(start, 'EEE, MMM d • h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const lowerQuery = query.toLowerCase();
        const filterEvents = (events: Event[]) =>
          events.filter((event) => {
            const dateStr = formatEventDate(event.startTime).toLowerCase();
            return event.title.toLowerCase().includes(lowerQuery) || dateStr.includes(lowerQuery);
          });

        setFilteredPublicEvents({
          upcoming: filterEvents(publicEvents.upcoming),
          live: filterEvents(publicEvents.live),
          completed: filterEvents(publicEvents.completed),
        });

        setFilteredUniversityEvents({
          upcoming: filterEvents(universityEvents.upcoming),
          live: filterEvents(universityEvents.live),
          completed: filterEvents(universityEvents.completed),
        });
      }, 300),
    [publicEvents, universityEvents, formatEventDate]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  const truncateTitle = (title: string, maxWords: number = 3) => {
    const words = title.split(' ');
    if (words.length <= maxWords) return title;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Define these helper conditions
  const hasLiveOrUpcomingEvents = 
    filteredPublicEvents.live.length > 0 || 
    filteredPublicEvents.upcoming.length > 0 || 
    filteredUniversityEvents.upcoming.length > 0;
  const hasCompletedEvents = filteredPublicEvents.completed.length > 0;

  const EventCard = React.memo<EventCardProps>(({ event, featured = false, onPress }) => {
    const [pressed, setPressed] = useState(false);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'spring',
          duration: 600,
          delay: featured ? 100 : 150,
        }}
      >
        <MotiView
          animate={{ scale: pressed ? 0.95 : 1 }}
          transition={{
            type: 'spring',
            duration: 200,
          }}
        >
          <TouchableOpacity
            style={[
              styles.eventCard,
              featured ? styles.featuredEventCard : styles.regularEventCard,
              {
                backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                shadowColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
                elevation: featured ? 8 : 5,
              },
            ]}
            activeOpacity={1}
            onPress={() => onPress(event)}
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            accessibilityLabel={`Event: ${truncateTitle(event.title)}, ${formatEventDate(event.startTime)}, ${event.eventType}, ${event.eventScope}, ${event.status}`}
          >
            <LinearGradient
              colors={['#FF6F61', '#6B5B95']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardBorder}
            >
              <View style={styles.innerCard}>
                <View style={styles.eventImageContainer}>
                  <Image
                    source={{ uri: event.backgroundImage || 'https://via.placeholder.com/300x150?text=Event+Image' }}
                    style={[styles.eventImage, featured ? styles.featuredEventImage : styles.regularEventImage]}
                    resizeMode="cover"
                    onError={(e) => console.log(`Failed to load image for event: ${event._id}`, e.nativeEvent.error)}
                  />
                  <LinearGradient
                    colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.5)']}
                    style={styles.imageGradient}
                  />
                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            event.eventType === 'ONLINE'
                              ? 'rgba(0, 122, 255, 0.8)'
                              : event.eventType === 'IN_PERSON'
                              ? 'rgba(255, 45, 85, 0.8)'
                              : 'rgba(52, 199, 89, 0.8)',
                        },
                      ]}
                    >
                      {event.eventType === 'IN_PERSON' && <LocationPinIcon size={12} color="white" />}
                      {event.eventType === 'ONLINE' && <VideoIcon size={12} color="white" />}
                      {event.eventType === 'HYBRID' && <GlobeIcon size={12} color="white" />}
                      <Text variant="labelMedium" color="white" style={styles.badgeText}>
                        {event.eventType === 'ONLINE' ? 'Online' : event.eventType === 'IN_PERSON' ? 'In-Person' : 'Hybrid'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            event.eventScope === 'UNIVERSITY'
                              ? 'rgba(255, 204, 0, 0.8)'
                              : 'rgba(88, 86, 214, 0.8)',
                        },
                      ]}
                    >
                      {event.eventScope === 'UNIVERSITY' && <UniversityIcon size={12} color="white" />}
                      {event.eventScope === 'PUBLIC' && <PublicIcon size={12} color="white" />}
                      <Text variant="labelMedium" color="white" style={styles.badgeText}>
                        {event.eventScope.charAt(0) + event.eventScope.slice(1).toLowerCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            event.status === 'LIVE'
                              ? 'rgba(255, 59, 48, 0.8)'
                              : event.status === 'UPCOMING'
                              ? 'rgba(52, 199, 89, 0.8)'
                              : 'rgba(142, 142, 147, 0.8)',
                        },
                      ]}
                    >
                      {event.status === 'UPCOMING' && <ClockIcon size={12} color="white" />}
                      {event.status === 'LIVE' && <PlayIcon size={12} color="white" />}
                      {event.status === 'COMPLETED' && <CheckIcon size={12} color="white" />}
                      <Text variant="labelMedium" color="white" style={styles.badgeText}>
                        {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.eventContent, featured && styles.featuredEventContent]}>
                    <Text
                      variant={featured ? 'titleLarge' : 'titleMedium'}
                      color="white"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.eventTitle}
                    >
                      {truncateTitle(event.title)}
                    </Text>
                    <View style={styles.eventMeta}>
                      <CalendarIcon size={16} color="white" />
                      <Text
                        variant="bodyMedium"
                        color="white"
                        style={styles.eventMetaText}
                        numberOfLines={1}
                      >
                        {formatEventDate(event.startTime)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>
      </MotiView>
    );
  });

  const EventCardSkeleton: React.FC<{ featured?: boolean }> = ({ featured = false }) => (
    <View
      style={[
        styles.eventCard,
        featured ? styles.featuredEventCard : styles.regularEventCard,
        { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' },
      ]}
    >
      <LinearGradient
        colors={['#FF6F61', '#6B5B95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.innerCard}>
          <Skeleton
            style={[styles.eventImage, featured ? styles.featuredEventImage : styles.regularEventImage, { backgroundColor: `${colors.text}10` }]}
          />
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyContent = () => (
    <View style={styles.emptyContentContainer}>
      <LottieView
        source={require('../assets/animations/empty-state.json')}
        autoPlay
        loop
        style={styles.emptyStateAnimation}
      />
      <Text variant="headingMedium" color={colors.text} style={styles.emptyStateTitle}>
        {searchQuery ? 'No Results Found' : 'No Events Yet'}
      </Text>
      <Text variant="bodyMedium" color={colors.textSecondary} style={styles.emptyStateDescription}>
        {searchQuery ? 'Try a different search term.' : 'Be the first to create an event for your campus community!'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={[styles.createEventButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateEvent}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.createEventButtonGradient}
          >
            <PlusIcon size={20} color={colors.onPrimary} />
            <Text variant="labelLarge" color={colors.onPrimary} style={styles.createEventButtonText}>
              Create Event
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <LinearGradient
        colors={theme === 'dark' ? ['#1A1A1A', '#121212'] : ['#F5F7FA', '#E8ECEF']}
        style={styles.backgroundGradient}
      />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text variant="headingLarge" color={colors.text} style={styles.headerTitle}>
          Events
        </Text>
        <View style={styles.searchContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} style={styles.searchBlur}>
            <View style={[styles.searchInputWrapper, { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#E8ECEF' }]}>
              <SearchIcon size={18} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search events..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                accessibilityLabel="Search events input"
              />
            </View>
          </BlurView>
        </View>
      </View>
      

      {loading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text variant="titleMedium" color={colors.text}>Live Now</Text>
                <View style={[styles.liveIndicator, { backgroundColor: colors.error }]} />
              </View>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {Array(2)
                .fill(0)
                .map((_, index) => (
                  <View key={`live-skeleton-${index}`} style={styles.featuredCardWrapper}>
                    <EventCardSkeleton featured={true} />
                  </View>
                ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" color={colors.text}>Upcoming Events</Text>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <View key={`upcoming-skeleton-${index}`} style={styles.featuredCardWrapper}>
                    <EventCardSkeleton featured={true} />
                  </View>
                ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" color={colors.text}>University Events</Text>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <View key={`university-skeleton-${index}`} style={styles.featuredCardWrapper}>
                    <EventCardSkeleton featured={true} />
                  </View>
                ))}
            </ScrollView>
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" color={colors.text}>Recent Events</Text>
              <Text variant="labelMedium" color={colors.primary}>See All</Text>
            </View>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <EventCardSkeleton key={`recent-skeleton-${index}`} />
              ))}
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
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
            {/* Show the No Upcoming Events notice at the top when appropriate */}
            {(!hasLiveOrUpcomingEvents && showNoEventsNotice) && (
              <View style={styles.noEventsContainer}>
                <View style={[
                  styles.noEventsCard, 
                  { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#FFFFFF' }
                ]}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowNoEventsNotice(false)}
                    accessibilityLabel="Dismiss notification"
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>×</Text>
                  </TouchableOpacity>
                  
                  <View style={[
                    styles.iconContainer, 
                    { backgroundColor: theme === 'dark' ? 'rgba(0,122,255,0.1)' : 'rgba(0,122,255,0.05)' }
                  ]}>
                    <CalendarIcon size={40} color={colors.primary} />
                  </View>
                  
                  <Text variant="headingMedium" color={colors.text} style={styles.noEventsTitle}>
                    No Upcoming Events
                  </Text>
                  
                  <Text variant="bodyMedium" color={colors.textSecondary} style={styles.noEventsMessage}>
                    Check back later for new events
                  </Text>
                  
                  {hasCompletedEvents && (
                    <TouchableOpacity
                      style={[styles.seeRecentButton, { borderColor: colors.primary }]}
                      onPress={() => setShowNoEventsNotice(false)}
                    >
                      <Text variant="labelLarge" color={colors.primary}>
                        See Recent Events
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Live events section */}
            {filteredPublicEvents.live.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <Text variant="titleMedium" color={colors.text}>Live Now</Text>
                    <View style={[styles.liveIndicator, { backgroundColor: colors.error }]} />
                  </View>
                  <TouchableOpacity onPress={() => handleSeeAllPress('LIVE', 'PUBLIC')}>
                    <Text variant="labelMedium" color={colors.primary}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredContainer}
                  decelerationRate="fast"
                  snapToInterval={moderateScale(300)}
                  snapToAlignment="start"
                >
                  {filteredPublicEvents.live.map((event) => (
                    <View key={event._id} style={styles.featuredCardWrapper}>
                      <EventCard
                        event={event}
                        featured={true}
                        onPress={handleEventPress}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Upcoming events section */}
            {filteredPublicEvents.upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" color={colors.text}>Upcoming Events</Text>
                  <TouchableOpacity onPress={() => handleSeeAllPress('UPCOMING', 'PUBLIC')}>
                    <Text variant="labelMedium" color={colors.primary}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredContainer}
                  decelerationRate="fast"
                  snapToInterval={moderateScale(300)}
                  snapToAlignment="start"
                >
                  {filteredPublicEvents.upcoming.map((event) => (
                    <View key={event._id} style={styles.featuredCardWrapper}>
                      <EventCard
                        event={event}
                        featured={true}
                        onPress={handleEventPress}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* University events section */}
            {filteredUniversityEvents.upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" color={colors.text}>University Events</Text>
                  <TouchableOpacity onPress={() => handleSeeAllPress('UPCOMING', 'UNIVERSITY')}>
                    <Text variant="labelMedium" color={colors.primary}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredContainer}
                  decelerationRate="fast"
                  snapToInterval={moderateScale(300)}
                  snapToAlignment="start"
                >
                  {filteredUniversityEvents.upcoming.map((event) => (
                    <View key={event._id} style={styles.featuredCardWrapper}>
                      <EventCard
                        event={event}
                        featured={true}
                        onPress={handleEventPress}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {/* Recent events section - always show if available */}
            {filteredPublicEvents.completed.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" color={colors.text}>Recent Events</Text>
                  <TouchableOpacity onPress={() => handleSeeAllPress('COMPLETED', 'PUBLIC')}>
                    <Text variant="labelMedium" color={colors.primary}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  {filteredPublicEvents.completed.slice(0, 3).map((event) => (
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

            {/* Show empty state ONLY when there are no events at all */}
            {!hasLiveOrUpcomingEvents && !hasCompletedEvents && (
              renderEmptyContent()
            )}
          </ScrollView>
          
          <MotiView
            style={[styles.fabContainer, { bottom: insets.bottom + SPACING.xl + 60 }]}
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 500 }}
          >
            <Pressable
              onPress={handleCreateEvent}
              onPressIn={() => setIsFabPressed(true)}
              onPressOut={() => setIsFabPressed(false)}
              accessibilityLabel="Create new event"
            >
              <MotiView
                animate={{ scale: isFabPressed ? 0.9 : 1 }}
                transition={{ type: 'spring', duration: 200 }}
              >
                <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} style={styles.fabBlur}>
                  <LinearGradient
                    colors={theme === 'dark' ? ['#007AFF', '#005BB5'] : ['#007AFF', '#005BB5']}
                    style={styles.fab}
                  >
                    <PlusIcon size={28} color="#FFFFFF" />
                  </LinearGradient>
                </BlurView>
              </MotiView>
            </Pressable>
          </MotiView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '800',
  },
  searchContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchBlur: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: SPACING.sm,
  },
  featuredContainer: {
    paddingBottom: SPACING.sm,
  },
  featuredCardWrapper: {
    marginRight: SPACING.md,
  },
  eventCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  featuredEventCard: {
    width: moderateScale(300),
    height: moderateScale(180),
  },
  regularEventCard: {
    marginBottom: SPACING.md,
    height: moderateScale(160),
  },
  cardBorder: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 2,
  },
  innerCard: {
    borderRadius: BORDER_RADIUS.lg - 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  eventImageContainer: {
    position: 'relative',
  },
  eventImage: {
    backgroundColor: '#E1E1E1',
  },
  featuredEventImage: {
    width: '100%',
    height: moderateScale(180),
  },
  regularEventImage: {
    width: '100%',
    height: moderateScale(160),
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    marginLeft: SPACING.xs,
    fontSize: moderateScale(12),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
  eventContent: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.md,
    right: SPACING.md,
  },
  featuredEventContent: {
    bottom: SPACING.xl,
  },
  eventTitle: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '800',
    fontSize: moderateScale(18),
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventMetaText: {
    marginLeft: SPACING.sm,
    fontSize: moderateScale(12),
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateAnimation: {
    width: moderateScale(200),
    height: moderateScale(200),
    marginBottom: SPACING.lg,
  },
  emptyStateTitle: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
  emptyStateDescription: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
    maxWidth: '80%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '400',
  },
  createEventButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  createEventButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  createEventButtonText: {
    marginLeft: SPACING.sm,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontWeight: '600',
  },
  errorContainer: {
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  fabContainer: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 1000,
  },
  fabBlur: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  fab: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New styles for the No Upcoming Events notification
  noEventsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  noEventsCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  noEventsTitle: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  noEventsMessage: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: SPACING.sm,
  },
  seeRecentButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
});

export default EventsScreen;