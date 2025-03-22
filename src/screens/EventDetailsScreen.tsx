// src/screens/EventDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Platform,
  Linking
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
  BackIcon, 
  ShareIcon, 
  EditIcon, 
  TrashIcon,
  InfoIcon
} from '../components/NavigationIcons';
import * as Haptics from 'expo-haptics';
import EventStatusBadge from '../components/EventStatusBadge';
import ApiService, { Event, RegisteredStudent } from '../services/ApiService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Skeleton from '../components/Skeleton';
import ConfettiCannon from 'react-native-confetti-cannon';

type EventDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetails'>;
type EventDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;

interface EventDetailsScreenProps {
  navigation: EventDetailsScreenNavigationProp;
  route: EventDetailsScreenRouteProp;
}

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [userRegistered, setUserRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Fetch event data and check if user is registered
  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // Get current user ID
        const userJson = await AsyncStorage.getItem('@campusclub:user');
        const currentUserId = userJson ? JSON.parse(userJson).id : null;
        setUserId(currentUserId);
        
        // Fetch individual events by querying all events and filtering
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
        
        const foundEvent = allEvents.find(e => e._id === eventId);
        
        if (foundEvent) {
          setEvent(foundEvent);
          
          // Check if current user is the creator
          setIsCreator(foundEvent.userId === currentUserId);
          
          // Fetch registered students
          const registrationsResponse = await ApiService.getRegisteredStudents(foundEvent._id);
          
          if (registrationsResponse.success && registrationsResponse.data) {
            setRegisteredStudents(registrationsResponse.data);
            
            // Check if current user is registered
            const isRegistered = registrationsResponse.data.some(
              student => student._id === currentUserId
            );
            setUserRegistered(isRegistered);
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        Alert.alert('Error', 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  // Format date for display
  const formatEventDate = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      const dateStr = format(start, 'EEEE, MMMM d, yyyy');
      const startTimeStr = format(start, 'h:mm a');
      const endTimeStr = format(end, 'h:mm a');
      
      return {
        date: dateStr,
        time: `${startTimeStr} - ${endTimeStr}`
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return {
        date: 'Date unavailable',
        time: 'Time unavailable'
      };
    }
  };
  
  // Handle share event
  const handleShare = async () => {
    if (!event) return;
    
    try {
      const result = await Share.share({
        message: `Check out this event: ${event.title} at ${event.venue} on ${
          formatEventDate(event.startTime, event.endTime).date
        }`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };
  
  // Handle register for event
  const handleRegister = async () => {
    if (!event || registering) return;
    
    try {
      setRegistering(true);
      
      // Apply haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const response = await ApiService.registerForEvent(event._id);
      
      if (response.success) {
        setUserRegistered(true);
        
        // Add current user to registered students
        if (userId) {
          const userJson = await AsyncStorage.getItem('@campusclub:user');
          const userData = userJson ? JSON.parse(userJson) : {};
          
          const newRegisteredStudent: RegisteredStudent = {
            _id: userId,
            name: userData.name || 'You',
            email: userData.email || '',
          };
          
          setRegisteredStudents(prev => [...prev, newRegisteredStudent]);
          
          // Show confetti animation
          setShowConfetti(true);
        }
      } else {
        Alert.alert('Registration Failed', response.message?.toString() || 'Failed to register for event');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      Alert.alert('Registration Error', 'An unexpected error occurred');
    } finally {
      setRegistering(false);
    }
  };
  
  // Handle edit event
  const handleEdit = () => {
    if (!event) return;
    
    // Apply haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    navigation.navigate('EditEvent', { eventId: event._id });
  };
  
  // Handle delete event
  const handleDelete = () => {
    if (!event) return;
    
    // Apply haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await ApiService.deleteEvent(event._id);
              
              if (response.success) {
                navigation.goBack();
              } else {
                Alert.alert('Delete Failed', response.message?.toString() || 'Failed to delete event');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Delete Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };
  
  // Handle location press
  const handleLocationPress = () => {
    if (!event) return;
    
    // Open map app with location
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(event.venue)}`,
      android: `geo:0,0?q=${encodeURIComponent(event.venue)}`,
    });
    
    if (mapUrl) {
      Linking.openURL(mapUrl);
    }
  };
  
  // Format date object from event if available
  const formattedDateTime = event 
    ? formatEventDate(event.startTime, event.endTime) 
    : { date: '', time: '' };
    
  // Determine if the event is upcoming and can be registered for
  const canRegister = event?.status === 'upcoming' && !userRegistered && !isCreator;
  
  // Show loading skeleton if data is being fetched
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header with back button */}
        <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Loading skeleton */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <Skeleton style={[styles.imageContainer, { height: moderateScale(220) }]} />
          
          <View style={styles.contentContainer}>
            <Skeleton style={{ height: moderateScale(28), width: '80%', marginBottom: SPACING.md }} />
            
            <View style={styles.metaContainer}>
              <Skeleton style={{ height: moderateScale(20), width: '60%', marginBottom: SPACING.sm }} />
              <Skeleton style={{ height: moderateScale(20), width: '50%', marginBottom: SPACING.sm }} />
              <Skeleton style={{ height: moderateScale(20), width: '40%', marginBottom: SPACING.lg }} />
            </View>
            
            <Skeleton style={{ height: moderateScale(24), width: '40%', marginBottom: SPACING.sm }} />
            <Skeleton style={{ height: moderateScale(100), width: '100%', marginBottom: SPACING.lg }} />
            
            <Skeleton style={{ height: moderateScale(24), width: '60%', marginBottom: SPACING.sm }} />
            <Skeleton style={{ height: moderateScale(60), width: '100%', marginBottom: SPACING.lg }} />
            
            <Skeleton style={{ height: moderateScale(50), width: '100%', borderRadius: BORDER_RADIUS.md }} />
          </View>
        </ScrollView>
      </View>
    );
  }
  
  // Show error message if event not found
  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        
        {/* Header with back button */}
        <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <BackIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <InfoIcon size={60} color={colors.error} />
          <Text variant="titleMedium" color={colors.text} style={styles.errorTitle}>
            Event Not Found
          </Text>
          <Text variant="bodyMedium" color={colors.textSecondary} style={styles.errorMessage}>
            The event you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity 
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text variant="labelLarge" color={colors.primary}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Confetti animation on successful registration */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          fallSpeed={2000}
          fadeOut={true}
          autoStart={true}
          onAnimationEnd={() => setShowConfetti(false)}
        />
      )}
      
      {/* Header with back button and actions */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <BackIcon size={20} color="white" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
              <ShareIcon size={18} color="white" />
            </View>
          </TouchableOpacity>
          
          {isCreator && (
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleEdit}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <EditIcon size={18} color="white" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleDelete}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <View style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <TrashIcon size={18} color="white" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Event image with gradient overlay */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: event.backgroundImage }} 
            style={styles.eventImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />
          
          {/* Event status badge */}
          <View style={styles.statusBadgeContainer}>
            <EventStatusBadge status={event.status} large />
          </View>
        </View>
        
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {/* Event title */}
          <Text variant="headingMedium" color={colors.text} style={styles.eventTitle}>
            {event.title}
          </Text>
          
          {/* Event meta information */}
          <View style={styles.metaContainer}>
            {/* Date and time */}
            <View style={styles.metaItem}>
              <CalendarIcon size={20} color={colors.primary} />
              <View style={styles.metaTextContainer}>
                <Text variant="bodyMedium" color={colors.text} style={styles.metaTextPrimary}>
                  {formattedDateTime.date}
                </Text>
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.metaTextSecondary}>
                  {formattedDateTime.time}
                </Text>
              </View>
            </View>
            
            {/* Location */}
            <TouchableOpacity style={styles.metaItem} onPress={handleLocationPress}>
              <LocationPinIcon size={20} color={colors.primary} />
              <View style={styles.metaTextContainer}>
                <Text variant="bodyMedium" color={colors.text} style={styles.metaTextPrimary}>
                  {event.venue}
                </Text>
                <Text variant="bodySmall" color={colors.primary} style={styles.metaTextSecondary}>
                  Open in Maps
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* Attendees */}
            <View style={styles.metaItem}>
              <PeopleIcon size={20} color={colors.primary} />
              <View style={styles.metaTextContainer}>
                <Text variant="bodyMedium" color={colors.text} style={styles.metaTextPrimary}>
                  {registeredStudents.length} {registeredStudents.length === 1 ? 'Attendee' : 'Attendees'}
                </Text>
                {userRegistered && (
                  <Text variant="bodySmall" color={colors.success} style={styles.metaTextSecondary}>
                    You're registered
                  </Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Event description */}
          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {event.description}
            </Text>
          </View>
          
          {/* Event terms and conditions */}
          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Terms & Conditions
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {event.termsCondition}
            </Text>
          </View>
          
          {/* Event creator */}
          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Organizer
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {isCreator ? 'You are the organizer of this event' : 'This event is organized by a campus member'}
            </Text>
          </View>
          
          {/* Attendees preview (if there are any) */}
          {registeredStudents.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
                  Attendees
                </Text>
                {registeredStudents.length > 3 && isCreator && (
                  <TouchableOpacity onPress={() => navigation.navigate('EventAttendees', { eventId: event._id })}>
                    <Text variant="labelMedium" color={colors.primary}>
                      See All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Show first 3 attendees */}
              <View style={styles.attendeesContainer}>
                {registeredStudents.slice(0, 3).map((student) => (
                  <View key={student._id} style={styles.attendeeItem}>
                    <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}20` }]}>
                      <Text variant="titleSmall" color={colors.primary}>
                        {student.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.attendeeDetails}>
                      <Text variant="bodyMedium" color={colors.text} numberOfLines={1}>
                        {student._id === userId ? 'You' : student.name}
                      </Text>
                      {isCreator && (
                        <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={1}>
                          {student.email}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Registration button */}
          {canRegister && (
            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text variant="labelLarge" color={colors.primary}>
                  Register for Event
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          {/* Registered badge */}
          {userRegistered && !isCreator && (
            <View style={[styles.registeredBadge, { backgroundColor: `${colors.success}20` }]}>
              <Text variant="bodyMedium" color={colors.success} style={styles.registeredText}>
                You're registered for this event
              </Text>
            </View>
          )}
          
          {/* Creator badge */}
          {isCreator && (
            <View style={[styles.registeredBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text variant="bodyMedium" color={colors.primary} style={styles.registeredText}>
                You're the organizer of this event
              </Text>
            </View>
          )}
          
          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    zIndex: 10,
  },
  backButton: {
    zIndex: 10,
  },
  iconButton: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    height: moderateScale(300),
    width: '100%',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: moderateScale(220),
    right: SPACING.lg,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    marginTop: -SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  eventTitle: {
    marginBottom: SPACING.md,
  },
  metaContainer: {
    marginBottom: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaTextContainer: {
    marginLeft: SPACING.sm,
  },
  metaTextPrimary: {
    fontWeight: '500',
  },
  metaTextSecondary: {
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  descriptionText: {
    lineHeight: 22,
  },
  attendeesContainer: {
    marginTop: SPACING.xs,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  registerButton: {
    height: moderateScale(56),
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  registeredBadge: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  registeredText: {
    fontWeight: '500',
  },
  bottomSpacer: {
    height: moderateScale(40),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
});

export default EventDetailsScreen;