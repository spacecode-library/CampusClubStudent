// src/screens/EventsScreen.tsx
import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Animated 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarIcon, LocationPinIcon } from '../components/NavigationIcons';

type EventsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;

interface EventsScreenProps {
  navigation: EventsScreenNavigationProp;
}

// Define the Event interface
interface EventData {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  attending: number;
}

// Interface for EventCard props
interface EventCardProps {
  event: EventData;
  featured?: boolean;
}

// Mock events data
const upcomingEvents: EventData[] = [
  {
    id: '1',
    title: 'End of Year Campus Party',
    date: 'May 15, 2025 • 8:00 PM',
    location: 'Student Union Hall',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop',
    attending: 142
  },
  {
    id: '2',
    title: 'Tech Conference 2025',
    date: 'June 3, 2025 • 10:00 AM',
    location: 'Engineering Building',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop',
    attending: 89
  }
];

const popularEvents: EventData[] = [
  {
    id: '3',
    title: 'International Food Festival',
    date: 'April 28, 2025 • 12:00 PM',
    location: 'Campus Quad',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1374&auto=format&fit=crop',
    attending: 210
  },
  {
    id: '4',
    title: 'Student Art Exhibition',
    date: 'May 2, 2025 • 4:00 PM',
    location: 'Arts Building Gallery',
    image: 'https://images.unsplash.com/photo-1526306063970-d5498ad00f1c?q=80&w=1470&auto=format&fit=crop',
    attending: 65
  },
  {
    id: '5',
    title: 'Career Fair Spring 2025',
    date: 'April 20, 2025 • 9:00 AM',
    location: 'Business School Hall',
    image: 'https://images.unsplash.com/photo-1560523159-4a9692d222f9?q=80&w=1470&auto=format&fit=crop',
    attending: 320
  }
];

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;
  
  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [moderateScale(200), moderateScale(80)],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp'
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });

  // Event Card Component
  const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => (
    <TouchableOpacity
      style={[
        styles.eventCard,
        featured ? styles.featuredEventCard : styles.regularEventCard,
        { 
          backgroundColor: colors.card,
          shadowColor: theme === 'dark' ? '#000' : '#888', 
        }
      ]}
      activeOpacity={0.9}
      onPress={() => console.log(`Event ${event.id} pressed`)}
    >
      <Image 
        source={{ uri: event.image }} 
        style={[
          styles.eventImage,
          featured ? styles.featuredEventImage : styles.regularEventImage
        ]}
      />
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
          >
            {event.date}
          </Text>
        </View>
        
        <View style={styles.eventMeta}>
          <LocationPinIcon size={14} color={colors.textSecondary} />
          <Text 
            variant="bodySmall" 
            color={colors.textSecondary}
            style={styles.eventMetaText}
          >
            {event.location}
          </Text>
        </View>
        
        <View style={styles.attendingContainer}>
          <Text 
            variant="labelSmall" 
            color={colors.primary}
          >
            {event.attending} attending
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            backgroundColor: colors.background,
            height: headerHeight,
            borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            paddingTop: insets.top
          }
        ]}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <View>
            <Animated.Text 
              style={[
                styles.headerTitle, 
                { color: colors.text, transform: [{ scale: titleScale }] }
              ]}
            >
              Campus Events
            </Animated.Text>
            <Text variant="bodyMedium" color={colors.textSecondary}>
              Find exciting events around campus
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
      
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: moderateScale(210) + insets.top }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Section: Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" color={colors.text}>
              Upcoming Events
            </Text>
            <TouchableOpacity>
              <Text variant="labelMedium" color={colors.primary}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Horizontal scroll for featured events */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          >
            {upcomingEvents.map(event => (
              <View key={event.id} style={styles.featuredCardWrapper}>
                <EventCard event={event} featured={true} />
              </View>
            ))}
            
            {/* "Create Event" card */}
            <TouchableOpacity
              style={[
                styles.createEventCard,
                { 
                  backgroundColor: theme === 'dark' ? colors.backgroundSecondary : colors.backgroundTertiary,
                  borderColor: `${colors.primary}30`
                }
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.createEventIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Text variant="headingLarge" color={colors.primary}>+</Text>
              </View>
              <Text variant="labelLarge" color={colors.primary} style={styles.createEventText}>
                Create Event
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Section: Popular Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" color={colors.text}>
              Popular Events
            </Text>
            <TouchableOpacity>
              <Text variant="labelMedium" color={colors.primary}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* List of regular events */}
          <View style={styles.regularEventsContainer}>
            {popularEvents.map(event => (
              <EventCard key={event.id} event={event} featured={false} />
            ))}
          </View>
        </View>
        
        {/* Bottom spacing for tab navigator */}
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
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    justifyContent: 'center',
    height: '100%',
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
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
  featuredContainer: {
    paddingBottom: SPACING.xs,
    paddingRight: SPACING.lg,
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
    elevation: 3,
  },
  featuredEventCard: {
    width: moderateScale(280),
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
  },
  attendingContainer: {
    marginTop: SPACING.xs,
  },
  createEventCard: {
    width: moderateScale(140),
    height: moderateScale(230),
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginRight: SPACING.md,
  },
  createEventIconContainer: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  createEventText: {
    fontWeight: '600',
  },
  regularEventsContainer: {
    
  },
  bottomSpacer: {
    height: 120, // Increased space for floating bottom navigation
  },
});

export default EventsScreen;