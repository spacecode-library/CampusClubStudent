import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  Keyboard,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BackIcon,
  CalendarIcon,
  ClockIcon,
  LocationPinIcon,
  ImageIcon,
  InfoIcon,
  CheckIcon,
  PlusIcon,
  ShareIcon,
} from '../components/NavigationIcons';
import { XIcon, CheckCircleIcon, AlertCircleIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import ApiService from '../services/ApiService';
import { StatusBar } from 'expo-status-bar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, addHours, addMinutes, isBefore, isAfter } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '../components/Button';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import * as Sharing from 'expo-sharing';
import LottieView from 'lottie-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import LocationPicker from '../components/LocationPicker';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CreateEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEvent'>;

interface CreateEventScreenProps {
  navigation: CreateEventScreenNavigationProp;
}

interface VenueCoordinates {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

// Alert types for in-screen alerts
type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

// Default background images with high-quality event-themed images
const defaultBackgroundImages = [
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1469&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=1374&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop',
];

// Inappropriate content keywords to check against
const inappropriateKeywords = [
  'explicit', 'nsfw', 'adult', 'xxx', 'sex', 'nude', 'naked', 'porn',
  'drugs', 'cocaine', 'heroin', 'meth', 'illegal',
  'gambling', 'violence', 'weapon', 'gun', 'kill', 'suicide', 'bomb', 'terrorist',
];

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);
  const successAnimationRef = useRef<LottieView>(null);

  // Alert state and animation
  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;

  // Input refs for focus handling
  const descriptionRef = useRef<RNTextInput>(null);
  const venueRef = useRef<any>(null);
  const termsRef = useRef<RNTextInput>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [venueCoordinates, setVenueCoordinates] = useState<VenueCoordinates | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [venueAddress, setVenueAddress] = useState('');
  const [terms, setTerms] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [backgroundImage, setBackgroundImage] = useState(defaultBackgroundImages[0]);
  const [eventScope, setEventScope] = useState<'UNIVERSITY' | 'PUBLIC'>('UNIVERSITY');

  // UI state
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<VenueCoordinates[]>([]);

  // Show in-screen alert
  const showAlert = (type: AlertType, message: string, title?: string, duration = 5000) => {
    setAlert({ type, message, title });

    // Animate alert in
    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    // Auto-hide after duration
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

  // Load any saved recent locations from storage on mount
  useEffect(() => {
    const loadRecentLocations = async () => {
      try {
        setRecentLocations([
          {
            latitude: 37.7749,
            longitude: -122.4194,
            name: 'University Main Hall',
            address: '123 University Ave, San Francisco, CA',
          },
          {
            latitude: 37.7831,
            longitude: -122.4039,
            name: 'Student Union Building',
            address: '456 Union St, San Francisco, CA',
          },
        ]);
      } catch (error) {
        console.error('Error loading recent locations:', error);
      }
    };

    loadRecentLocations();
  }, []);

  // Monitor keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Check if the form is complete
  useEffect(() => {
    const complete = Boolean(
      title.trim() &&
      description.trim() &&
      venue.trim() &&
      terms.trim() &&
      startDate &&
      endDate &&
      backgroundImage
    );
    setIsFormComplete(complete);

    // Animate the progress indicator
    Animated.timing(animation, {
      toValue: complete ? 1 : calculateProgress() / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [title, description, venue, terms, startDate, endDate, backgroundImage]);

  // Set default times for new events - start time rounded to nearest 30 min, end time 1 hour later
  useEffect(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    const defaultStartTime = addMinutes(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0),
      roundedMinutes
    );

    setStartDate(defaultStartTime);
    setEndDate(addHours(defaultStartTime, 1));
  }, []);

  // Check for inappropriate content
  const checkInappropriateContent = () => {
    const allText = [title, description, venue, terms].join(' ').toLowerCase();

    for (const keyword of inappropriateKeywords) {
      if (allText.includes(keyword)) {
        return `Your event contains inappropriate content ("${keyword}"). Please revise and try again.`;
      }
    }

    return null;
  };

  // Callback to receive selected location from LocationPicker
  const handleLocationSelected = (coordinates: { latitude: number; longitude: number }, address: string) => {
    setVenueCoordinates(coordinates);
    setVenueAddress(address);
    setShowLocationPicker(false); // Close the modal
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Hide keyboard if visible
    Keyboard.dismiss();

    // First check for inappropriate content
    const inappropriateContent = checkInappropriateContent();
    if (inappropriateContent) {
      showAlert('error', inappropriateContent, 'Content Policy Violation');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Validate form
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Event title is required';
    } else if (title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    } else if (title.length > 80) {
      errors.title = 'Title must be less than 80 characters';
    }

    if (!description.trim()) {
      errors.description = 'Event description is required';
    } else if (description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!venue.trim()) {
      errors.venue = 'Event venue is required';
    }

    if (!terms.trim()) {
      errors.terms = 'Terms and conditions are required';
    } else if (terms.length < 10) {
      errors.terms = 'Terms must be at least 10 characters';
    }

    if (!startDate) {
      errors.startDate = 'Start date and time are required';
    } else {
      const now = new Date();
      if (isBefore(startDate, now)) {
        errors.startDate = 'Start time cannot be in the past';
      }
    }

    if (!endDate) {
      errors.endDate = 'End date and time are required';
    } else if (startDate && endDate <= startDate) {
      errors.endDate = 'End time must be after start time';
    }

    if (!backgroundImage) {
      errors.backgroundImage = 'Background image is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Show an in-screen alert summarizing the validation errors
      const errorMessages = Object.values(errors).join('. ');
      showAlert('error', errorMessages, 'Form Incomplete');
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    // Haptic feedback for submission
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Submit form
    setIsSubmitting(true);

    try {
      // Simulated response
      const mockResponse = {
        success: true,
        data: {
          _id: 'event_' + Date.now(),
          title,
          description,
          startTime: startDate!.toISOString(),
          endTime: endDate!.toISOString(),
          venue,
          termsCondition: terms,
          backgroundImage,
        },
      };

      const response = mockResponse;

      if (response.success && response.data) {
        // Success haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Show success alert before transitioning to success view
        showAlert('success', 'Your event has been successfully created!', 'Event Created', 1500);
        setTimeout(() => {
          // Store the created event ID
          setCreatedEventId(response.data._id);

          // Store the venue in recent locations if it has coordinates
          if (venueCoordinates) {
            setRecentLocations((prev) => [
              venueCoordinates,
              ...prev
                .filter(
                  (loc) =>
                    loc.latitude !== venueCoordinates.latitude ||
                    loc.longitude !== venueCoordinates.longitude
                )
                .slice(0, 4), // Keep only the 5 most recent
            ]);
          }

          // Show success view
          setShowSuccessView(true);

          // Play success animation
          setTimeout(() => {
            if (confettiRef.current) {
              confettiRef.current.start();
            }
            if (successAnimationRef.current) {
              successAnimationRef.current.play();
            }
          }, 300);
        }, 1500);
      } else {
        showAlert('error', response.toString() || 'Failed to create event', 'Creation Failed');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showAlert('error', 'An unexpected error occurred while creating your event', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle date selection for start date
  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    setStartDatePickerVisible(false);

    // If end date is not set or is before start date, set end date to 1 hour after start date
    if (!endDate || date >= endDate) {
      const newEndDate = new Date(date);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  };

  // Handle date selection for end date
  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    setEndDatePickerVisible(false);
  };

  // Format date for display
  const formatDate = (date: Date | null, includeTime = true): string => {
    if (!date) return '';

    try {
      if (includeTime) {
        return format(date, 'EEE, MMM d, yyyy h:mm a');
      } else {
        return format(date, 'EEE, MMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Handle image picker from library
  const handlePickImage = async () => {
    setShowImagePicker(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      showAlert('error', 'We need access to your photo library to select an image', 'Permission Required');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBackgroundImage(result.assets[0].uri);
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('error', 'Failed to select image', 'Error');
    }
  };

  // Toggle event scope between university and public
  const toggleEventScope = () => {
    setEventScope((prev) => (prev === 'UNIVERSITY' ? 'PUBLIC' : 'UNIVERSITY'));
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Add event to calendar
  const addToCalendar = async () => {
    if (!startDate || !endDate || !title) return;

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status !== 'granted') {
        showAlert('error', 'Calendar permission is needed to add this event', 'Permission Required');
        return;
      }

      try {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const defaultCalendar = calendars.find((cal) => cal.isPrimary) || calendars[0];

        if (!defaultCalendar) {
          showAlert('error', 'No calendar found on this device', 'Calendar Error');
          return;
        }

        const eventDetails = {
          title,
          startDate,
          endDate,
          location: venue,
          notes: description,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);

        if (eventId) {
          showAlert('success', 'Event added to your calendar', 'Success', 1500);
          if (Platform.OS === 'ios') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (calendarError) {
        console.error('Calendar operation error:', calendarError);
        showAlert('error', 'Could not access calendar. Please check your permissions.', 'Calendar Error');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showAlert('error', 'Failed to add event to calendar', 'Error');
    }
  };

  // Share event
  const shareEvent = async () => {
    if (!title || !startDate) return;

    try {
      const message = `Join me at ${title} on ${formatDate(startDate)}${venue ? ` at ${venue}` : ''}!`;
      await Sharing.shareAsync(message);
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      showAlert('error', 'Failed to share event', 'Error');
    }
  };

  // View created event
  const viewCreatedEvent = () => {
    if (createdEventId) {
      navigation.replace('EventDetails', { eventId: createdEventId });
    }
  };

  // Create another event
  const createAnotherEvent = () => {
    setShowSuccessView(false);
    setTitle('');
    setDescription('');
    setVenue('');
    setVenueCoordinates(null);
    setTerms('');
    const now = new Date();
    const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30;
    const defaultStartTime = addMinutes(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0),
      roundedMinutes
    );
    setStartDate(defaultStartTime);
    setEndDate(addHours(defaultStartTime, 1));
    setBackgroundImage(defaultBackgroundImages[0]);
    setEventScope('UNIVERSITY');
  };

  // Progress bar calculation - fill based on completed fields
  const calculateProgress = () => {
    let progress = 0;

    if (title.trim()) progress += 1;
    if (description.trim()) progress += 1;
    if (venue.trim()) progress += 1;
    if (terms.trim()) progress += 1;
    if (startDate) progress += 1;
    if (endDate) progress += 1;
    if (backgroundImage) progress += 1;

    return (progress / 7) * 100;
  };

  // Add this function to your component
  const getStaticMapUrl = (latitude: number, longitude: number) => {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=AIzaSyD7_tt95oyNRydKL0CzELwfDq25wTVb-Nk`;
  };

  const progressPercentage = calculateProgress();
  const progressWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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

  // Render background image selection modal
  const renderImagePickerModal = () => {
    if (!showImagePicker) return null;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalTouchableOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePicker(false)}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text variant="titleMedium" color={colors.text}>
              Choose Background Image
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowImagePicker(false)}>
              <Text variant="bodyLarge" color={colors.primary}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.backgroundImagesContainer}
          >
            {defaultBackgroundImages.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.backgroundImageOption,
                  backgroundImage === image && {
                    borderColor: colors.primary,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => {
                  setBackgroundImage(image);
                  setShowImagePicker(false);
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.backgroundImageThumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.primary }]}
            onPress={handlePickImage}
          >
            <Text variant="labelLarge" color="white">
              Upload from Library
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render success view
  if (showSuccessView) {
    return (
      <View style={[styles.container, styles.successContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: screenWidth / 2, y: -10 }}
          fallSpeed={2500}
          fadeOut={true}
          colors={['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0']}
        />

        <LottieView
          ref={successAnimationRef}
          source={require('../assets/animations/success-confetti.json')}
          style={styles.successAnimation}
          autoPlay={false}
          loop={false}
        />

        <Text variant="headingLarge" color={colors.text} style={styles.successTitle}>
          Event Created!
        </Text>

        <Text variant="bodyLarge" color={colors.textSecondary} style={styles.successMessage}>
          Your event "{title}" has been successfully created and is now visible to others.
        </Text>

        <View style={styles.successButtonsContainer}>
          <Button
            title="View Event"
            onPress={viewCreatedEvent}
            variant="primary"
            size="large"
            style={styles.successButton}
          />

          <View style={styles.successActionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={addToCalendar}
            >
              <CalendarIcon size={24} color={colors.primary} />
              <Text variant="bodyMedium" color={colors.primary} style={styles.actionButtonText}>
                Add to Calendar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={shareEvent}
            >
              <ShareIcon size={24} color={colors.primary} />
              <Text variant="bodyMedium" color={colors.primary} style={styles.actionButtonText}>
                Share Event
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.createAnotherButton} onPress={createAnotherEvent}>
            <Text variant="bodyMedium" color={colors.primary}>
              Create Another Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

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

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" color={colors.text}>
          Create Event
        </Text>
        <View style={styles.backButton} /> {/* Empty view for centering */}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${colors.primary}20`, width: '100%' }]}>
          <Animated.View
            style={[styles.progressFill, { backgroundColor: colors.primary, width: progressWidth }]}
          />
        </View>
        <Text variant="bodySmall" color={colors.textSecondary} style={styles.progressText}>
          {Math.round(progressPercentage)}% complete
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 30 : 0}
      >
        {/* Background Image Selector */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={() => setShowImagePicker(true)}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={{ uri: backgroundImage }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
              style={styles.imageDarkener}
            />
            <View style={styles.imagePicker}>
              <ImageIcon size={24} color="white" />
              <Text variant="labelMedium" color="white" style={{ marginLeft: SPACING.xs }}>
                {backgroundImage === defaultBackgroundImages[0] ? 'Choose Event Image' : 'Change Event Image'}
              </Text>
            </View>
          </ImageBackground>

          {/* Validation error for background image */}
          {validationErrors.backgroundImage && (
            <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
              {validationErrors.backgroundImage}
            </Text>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Event Title */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Event Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What's your event called?"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              error={validationErrors.title}
              errorText={validationErrors.title}
            />
            <Text variant="bodySmall" color={colors.textSecondary}>
              Choose a clear, catchy title (3-80 characters)
            </Text>
          </View>

          {/* Event Description */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Description
            </Text>
            <TextInput
              ref={descriptionRef}
              value={description}
              onChangeText={setDescription}
              placeholder="What's your event about? Include important details for attendees."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              returnKeyType="next"
              error={validationErrors.description}
              errorText={validationErrors.description}
            />
            <Text variant="bodySmall" color={colors.textSecondary}>
              Provide a detailed description to attract attendees (min 10 characters)
            </Text>
          </View>

          {/* Event Date and Time Pickers */}
          <View style={styles.dateTimeContainer}>
            {/* Start Date and Time */}
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" color={colors.text}>
                Start Date & Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateTimePicker,
                  {
                    borderColor: validationErrors.startDate ? colors.error : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => setStartDatePickerVisible(true)}
              >
                <CalendarIcon size={22} color={colors.primary} />
                <Text
                  variant="bodyMedium"
                  color={startDate ? colors.text : colors.textSecondary}
                  style={styles.dateTimeText}
                >
                  {startDate ? formatDate(startDate) : 'Select start date and time'}
                </Text>
              </TouchableOpacity>

              {/* Validation error for start date */}
              {validationErrors.startDate && (
                <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {validationErrors.startDate}
                </Text>
              )}
            </View>

            {/* End Date and Time */}
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" color={colors.text}>
                End Date & Time
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateTimePicker,
                  {
                    borderColor: validationErrors.endDate ? colors.error : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => setEndDatePickerVisible(true)}
              >
                <ClockIcon size={22} color={colors.primary} />
                <Text
                  variant="bodyMedium"
                  color={endDate ? colors.text : colors.textSecondary}
                  style={styles.dateTimeText}
                >
                  {endDate ? formatDate(endDate) : 'Select end date and time'}
                </Text>
              </TouchableOpacity>

              {/* Validation error for end date */}
              {validationErrors.endDate && (
                <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {validationErrors.endDate}
                </Text>
              )}
            </View>
          </View>

          {/* Event Venue */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Venue</Text>
            <Text>{venueAddress || 'No venue selected'}</Text>
            <Button title="Select Venue" onPress={() => setShowLocationPicker(true)} />

            {/* Modal to display LocationPicker */}
            <Modal visible={showLocationPicker} animationType="slide">
              <View style={styles.modalContainer}>
                <LocationPicker onLocationSelected={handleLocationSelected} />
                <Button title="Cancel" onPress={() => setShowLocationPicker(false)} />
              </View>
            </Modal>

            {/* Recent Locations */}
            {recentLocations.length > 0 && (
              <View style={styles.recentLocationsContainer}>
                <Text variant="labelMedium" color={colors.textSecondary} style={styles.recentLocationsTitle}>
                  Recent Locations
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recentLocationsScroll}
                >
                  {recentLocations.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.recentLocationItem,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        setVenue(location.address || '');
                        setVenueCoordinates(location);
                      }}
                    >
                      <LocationPinIcon size={16} color={colors.primary} />
                      <Text
                        variant="bodySmall"
                        color={colors.text}
                        style={styles.recentLocationText}
                        numberOfLines={1}
                      >
                        {location.name || location.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Map Preview */}
            {venueCoordinates && (
              <View style={styles.mapPreviewContainer}>
                <Image
                  source={{
                    uri: getStaticMapUrl(venueCoordinates.latitude, venueCoordinates.longitude),
                  }}
                  style={styles.mapPreview}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Validation error for venue */}
            {validationErrors.venue && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {validationErrors.venue}
              </Text>
            )}

            <Text variant="bodySmall" color={colors.textSecondary}>
              Search for a specific location or enter an address
            </Text>
          </View>

          {/* Terms and Conditions */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Terms & Conditions
            </Text>
            <TextInput
              ref={termsRef}
              value={terms}
              onChangeText={setTerms}
              placeholder="Add terms, conditions, or special requirements for attendees."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              error={validationErrors.terms}
              errorText={validationErrors.terms}
            />
            <Text variant="bodySmall" color={colors.textSecondary}>
              Include any important policies, cancellation info, or restrictions (min 10 characters)
            </Text>
          </View>

          {/* Event Scope Toggle */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Event Scope
            </Text>
            <View style={styles.eventScopeContainer}>
              <TouchableOpacity
                style={[
                  styles.eventScopeOption,
                  eventScope === 'UNIVERSITY' && {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                  { borderColor: colors.border },
                ]}
                onPress={() => setEventScope('UNIVERSITY')}
              >
                <Text
                  variant="bodyMedium"
                  color={eventScope === 'UNIVERSITY' ? colors.primary : colors.text}
                >
                  University Only
                </Text>
                {eventScope === 'UNIVERSITY' && (
                  <CheckIcon size={16} color={colors.primary} style={{ marginLeft: SPACING.xs }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.eventScopeOption,
                  eventScope === 'PUBLIC' && {
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary,
                  },
                  { borderColor: colors.border },
                ]}
                onPress={() => setEventScope('PUBLIC')}
              >
                <Text
                  variant="bodyMedium"
                  color={eventScope === 'PUBLIC' ? colors.primary : colors.text}
                >
                  Public
                </Text>
                {eventScope === 'PUBLIC' && (
                  <CheckIcon size={16} color={colors.primary} style={{ marginLeft: SPACING.xs }} />
                )}
              </TouchableOpacity>
            </View>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {eventScope === 'UNIVERSITY'
                ? 'Only university members can see and join this event'
                : 'Anyone can discover and join this event'}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View
        style={[
          styles.submitContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, SPACING.md),
          },
        ]}
      >
        <Button
          title={isSubmitting ? 'Creating Event...' : 'Create Event'}
          onPress={handleSubmit}
          variant="primary"
          size="large"
          disabled={!isFormComplete || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>

      {/* Date picker modals */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="datetime"
        date={startDate || new Date()}
        onConfirm={handleStartDateConfirm}
        onCancel={() => setStartDatePickerVisible(false)}
        minimumDate={new Date()}
      />

      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="datetime"
        date={endDate || new Date()}
        onConfirm={handleEndDateConfirm}
        onCancel={() => setEndDatePickerVisible(false)}
        minimumDate={startDate || new Date()}
      />

      {/* Background image picker modal */}
      {renderImagePickerModal()}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: SPACING.sm,
    width: 90,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(200),
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageDarkener: {
    ...StyleSheet.absoluteFillObject,
  },
  imagePicker: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  formContainer: {
    padding: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  dateTimeContainer: {
    flexDirection: 'column',
  },
  dateTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dateTimeText: {
    marginLeft: SPACING.sm,
  },
  errorText: {
    marginTop: SPACING.xs,
  },
  locationInputContainer: {
    position: 'relative',
    marginTop: SPACING.xs,
  },
  locationIcon: {
    position: 'absolute',
    left: 10,
    top: 15,
    zIndex: 1,
  },
  mapPreviewContainer: {
    marginTop: SPACING.sm,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    height: moderateScale(150),
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  recentLocationsContainer: {
    marginTop: SPACING.sm,
  },
  recentLocationsTitle: {
    marginBottom: SPACING.xs,
  },
  recentLocationsScroll: {
    paddingVertical: SPACING.xs,
  },
  recentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  recentLocationText: {
    marginLeft: SPACING.xs,
    maxWidth: 120,
  },
  eventScopeContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  eventScopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  submitContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  submitButton: {
    width: '100%',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  modalTouchableOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  backgroundImagesContainer: {
    paddingVertical: SPACING.sm,
  },
  backgroundImageOption: {
    width: moderateScale(120),
    height: moderateScale(70),
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  backgroundImageThumbnail: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  successAnimation: {
    width: moderateScale(200),
    height: moderateScale(200),
  },
  successTitle: {
    marginTop: SPACING.xl,
    textAlign: 'center',
  },
  successMessage: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  successButtonsContainer: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  successButton: {
    width: '100%',
  },
  successActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
  },
  createAnotherButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  // Alert styles (copied from LoginScreen.tsx)
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
});

export default CreateEventScreen;