import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  Animated,
  Modal,
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
  InfoIcon,

} from '../components/NavigationIcons';
import { AlertCircleIcon, XIcon, CheckCircleIcon} from '../components/icons/index';
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
import Button from '../components/Button';

type EventDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetails'>;
type EventDetailsScreenRouteProp = RouteProp<RootStackParamList, 'EventDetails'>;

interface EventDetailsScreenProps {
  navigation: EventDetailsScreenNavigationProp;
  route: EventDetailsScreenRouteProp;
}

// Alert types for in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alert, setAlert] = useState<AlertData | null>(null);

  // Animation refs
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // Show in-screen alert
  const showAlert = (type: AlertType, message: string, title?: string, duration = 5000) => {
    setAlert({ type, message, title });

    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    if (duration > 0) {
      setTimeout(() => {
        hideAlert();
      }, duration);
    }
  };

  // Hide in-screen alert
  const hideAlert = () => {
    Animated.timing(alertAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAlert(null);
    });
  };

  // Fetch event data and check if user is registered
  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const userJson = await AsyncStorage.getItem('@campusclub:user');
        const currentUserId = userJson ? JSON.parse(userJson).id : null;
        setUserId(currentUserId);

        const upcomingResponse = await ApiService.getEvents({
          status: 'UPCOMING',
          eventScope: 'UNIVERSITY',
        });

        const liveResponse = await ApiService.getEvents({
          status: 'LIVE',
          eventScope: 'UNIVERSITY',
        });

        const completedResponse = await ApiService.getEvents({
          status: 'COMPLETED',
          eventScope: 'UNIVERSITY',
        });

        const allEvents = [
          ...(upcomingResponse.success && upcomingResponse.data ? upcomingResponse.data : []),
          ...(liveResponse.success && liveResponse.data ? liveResponse.data : []),
          ...(completedResponse.success && completedResponse.data ? completedResponse.data : []),
        ];

        const foundEvent = allEvents.find((e) => e._id === eventId);

        if (foundEvent) {
          setEvent(foundEvent);
          setIsCreator(foundEvent.userId === currentUserId);

          const registrationsResponse = await ApiService.getRegisteredStudents(foundEvent._id);

          if (registrationsResponse.success && registrationsResponse.data) {
            setRegisteredStudents(registrationsResponse.data);
            const isRegistered = registrationsResponse.data.some(
              (student) => student._id === currentUserId
            );
            setUserRegistered(isRegistered);
          }
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        showAlert('error', 'Failed to load event details', 'Error');
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
        time: `${startTimeStr} - ${endTimeStr}`,
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return {
        date: 'Date unavailable',
        time: 'Time unavailable',
      };
    }
  };

  // Handle share event
  const handleShare = async () => {
    if (!event) return;

    try {
      await Share.share({
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

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const response = await ApiService.registerForEvent(event._id);

      if (response.success) {
        setUserRegistered(true);

        if (userId) {
          const userJson = await AsyncStorage.getItem('@campusclub:user');
          const userData = userJson ? JSON.parse(userJson) : {};

          const newRegisteredStudent: RegisteredStudent = {
            _id: userId,
            name: userData.name || 'You',
            email: userData.email || '',
          };

          setRegisteredStudents((prev) => [...prev, newRegisteredStudent]);
          setShowConfetti(true);
        }
      } else {
        showAlert('error', response.message?.toString() || 'Failed to register for event', 'Registration Failed');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      showAlert('error', 'An unexpected error occurred', 'Registration Error');
    } finally {
      setRegistering(false);
    }
  };

  // Handle edit event
  const handleEdit = () => {
    if (!event) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    navigation.navigate('EditEvent', { eventId: event._id });
  };

  // Show delete modal
  const handleShowDeleteModal = () => {
    if (!event) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setShowDeleteModal(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  };

  // Hide delete modal
  const handleHideDeleteModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowDeleteModal(false);
    });

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Handle delete event
  const handleDelete = async () => {
    if (!event) return;

    setDeleting(true);

    try {
      const response = await ApiService.deleteEvent(event._id);

      if (response.success) {
        showAlert('success', 'Event deleted successfully', 'Success', 1500);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showAlert('error', response.message?.toString() || 'Failed to delete event', 'Delete Failed');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showAlert('error', 'An unexpected error occurred', 'Delete Error');
    } finally {
      setDeleting(false);
      handleHideDeleteModal();
    }
  };

  // Handle location press
  const handleLocationPress = () => {
    if (!event) return;

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
  const canRegister = event?.status === 'UPCOMING' && !userRegistered && !isCreator;

  // Render alert icon based on type
  const renderAlertIcon = () => {
    if (!alert) return null;

    switch (alert.type) {
      case 'error':
        return <AlertCircleIcon size={24} color={colors.error} />;
      case 'success':
        return <CheckCircleIcon size={24} color={colors.success} />;
      case 'info':
        return <InfoIcon size={24} color={colors.info} />;
      default:
        return null;
    }
  };

  // Get alert background color based on type
  const getAlertBackgroundColor = () => {
    if (!alert) return colors.card;

    switch (alert.type) {
      case 'error':
        return theme === 'dark' ? '#3D1515' : '#FEE7E7';
      case 'success':
        return theme === 'dark' ? '#153D1A' : '#E7FEEA';
      case 'info':
        return theme === 'dark' ? '#15293D' : '#E7F2FE';
      default:
        return colors.card;
    }
  };

  // Get alert text color based on type
  const getAlertTextColor = () => {
    if (!alert) return colors.text;

    switch (alert.type) {
      case 'error':
        return theme === 'dark' ? '#FF9A9A' : '#D32F2F';
      case 'success':
        return theme === 'dark' ? '#9AFFAE' : '#2E7D32';
      case 'info':
        return theme === 'dark' ? '#9AC8FF' : '#1976D2';
      default:
        return colors.text;
    }
  };

  // Show loading skeleton if data is being fetched
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

        <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BackIcon size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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

        <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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

      {/* In-screen alert */}
      {alert && (
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: getAlertBackgroundColor(),
              transform: [
                {
                  translateY: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
                {
                  scale: alertAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: alertAnimation,
              borderLeftWidth: 4,
              borderLeftColor: getAlertTextColor(),
            },
          ]}
        >
          <View style={styles.alertContent}>
            <View style={styles.alertIconContainer}>{renderAlertIcon()}</View>
            <View style={styles.alertTextContainer}>
              {alert.title && (
                <Text
                  variant="labelLarge"
                  style={[styles.alertTitle, { color: getAlertTextColor() }]}
                >
                  {alert.title}
                </Text>
              )}
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                {alert.message}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.alertCloseButton}
            onPress={hideAlert}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <XIcon size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

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
                onPress={handleShowDeleteModal}
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
          <Image source={{ uri: event.backgroundImage }} style={styles.eventImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageGradient}
          />

          <View style={styles.statusBadgeContainer}>
            <EventStatusBadge status={event.status} large />
          </View>
        </View>

        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <Text variant="headingMedium" color={colors.text} style={styles.eventTitle}>
            {event.title}
          </Text>

          <View style={styles.metaContainer}>
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

          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              About
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {event.description}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Terms & Conditions
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {event.termsCondition}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text variant="titleSmall" color={colors.text} style={styles.sectionTitle}>
              Organizer
            </Text>
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.descriptionText}>
              {isCreator ? 'You are the organizer of this event' : 'This event is organized by a campus member'}
            </Text>
          </View>

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

          {canRegister && (
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: colors.primary }]}
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

          {userRegistered && !isCreator && (
            <View style={[styles.registeredBadge, { backgroundColor: `${colors.success}20` }]}>
              <Text variant="bodyMedium" color={colors.success} style={styles.registeredText}>
                You're registered for this event
              </Text>
            </View>
          )}

          {isCreator && (
            <View style={[styles.registeredBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text variant="bodyMedium" color={colors.primary} style={styles.registeredText}>
                You're the organizer of this event
              </Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleHideDeleteModal}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 20 : 10} style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.deleteModalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            <LinearGradient
              colors={
                theme === 'dark'
                  ? ['#2A1A1A', '#1A0F0F']
                  : ['#FEE7E7', '#FDD5D5']
              }
              style={styles.deleteModalGradient}
            >
              <View style={styles.deleteModalContent}>
                <View style={styles.deleteModalIconContainer}>
                  <AlertCircleIcon size={40} color={colors.error} />
                </View>
                <Text variant="titleMedium" color={colors.text} style={styles.deleteModalTitle}>
                  Delete Event
                </Text>
                <Text variant="bodyMedium" color={colors.textSecondary} style={styles.deleteModalMessage}>
                  Are you sure you want to delete this event? This action cannot be undone.
                </Text>
                <View style={styles.deleteModalButtons}>
                  <Button
                    title="Cancel"
                    onPress={handleHideDeleteModal}
                    variant="secondary"
                    size="medium"
                    style={styles.deleteModalButton}
                  />
                  <Button
                    title="Delete"
                    onPress={handleDelete}
                    loading={deleting}
                    disabled={deleting}
                    variant="ghost"
                    size="medium"
                    style={styles.deleteModalButton}
                  />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </BlurView>
      </Modal>
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
  // Alert styles
  alertContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.md,
    right: SPACING.md,
    padding: SPACING.md,
    borderRadius: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: SPACING.sm,
    paddingTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    marginBottom: 2,
    fontWeight: '600',
  },
  alertCloseButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  // Delete modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  deleteModalGradient: {
    flex: 1,
    padding: SPACING.lg,
  },
  deleteModalContent: {
    alignItems: 'center',
  },
  deleteModalIconContainer: {
    marginBottom: SPACING.md,
  },
  deleteModalTitle: {
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  deleteModalMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
});

export default EventDetailsScreen;