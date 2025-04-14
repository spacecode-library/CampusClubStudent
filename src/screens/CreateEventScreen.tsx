import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Platform,
  ActivityIndicator,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
  Keyboard,
  Modal,
  FlatList,
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
  ShareIcon,
  SearchIcon,
  ChevronDownIcon,
} from '../components/NavigationIcons';
import { XIcon, CheckCircleIcon, AlertCircleIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import ApiService, { ApiResponse } from '../services/ApiService';
import { StatusBar } from 'expo-status-bar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, addHours, addMinutes, isBefore, isAfter } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '../components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import * as Calendar from 'expo-calendar';
import * as Sharing from 'expo-sharing';
import LottieView from 'lottie-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import LocationPicker from '../components/LocationPicker';
import moment from 'moment-timezone';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker'; // New import

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

type AlertType = 'error' | 'success' | 'info' | null;

interface AlertData {
  type: AlertType;
  message: string;
  title?: string;
}

interface Event {
  _id: string;
  userId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  backgroundImage: string;
  termsCondition: string;
  venue: string;
  eventScope: 'UNIVERSITY' | 'PUBLIC';
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  timeZone?: string;
  eventType?: string;
  onlineLink?: string;
}

const defaultBackgroundImages = [
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1469&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1470&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=1374&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1470&auto=format&fit=crop',
];

const inappropriateKeywords = [
  'explicit', 'nsfw', 'adult', 'xxx', 'sex', 'nude', 'naked', 'porn',
  'drugs', 'cocaine', 'heroin', 'meth', 'illegal',
  'gambling', 'violence', 'weapon', 'gun', 'kill', 'suicide', 'bomb', 'terrorist',
];

const allTimeZones = moment.tz.names();
type TimeZone = typeof allTimeZones[number];

const eventTypes = ['IN_PERSON', 'ONLINE', 'HYBRID'] as const;
type EventType = typeof eventTypes[number];

const TimezoneDropdown = ({ 
  selectedTimeZone, 
  onSelectTimeZone, 
  error,
  colors,
  theme,
}: { 
  selectedTimeZone: TimeZone, 
  onSelectTimeZone: (tz: TimeZone) => void, 
  error?: string,
  colors: any,
  theme: string,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<RNTextInput>(null);

  const filteredTimeZones = searchQuery.trim() === '' 
    ? allTimeZones 
    : allTimeZones.filter(tz => 
        tz.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleSelect = (tz: TimeZone) => {
    onSelectTimeZone(tz);
    setModalVisible(false);
    setSearchQuery('');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatTimeZone = (tz: string) => {
    try {
      const offset = moment.tz(tz).format('Z');
      return `${tz} (GMT${offset})`;
    } catch (error) {
      return tz;
    }
  };

  const currentTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { 
            borderColor: error ? colors.error : colors.border, 
            backgroundColor: colors.card 
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          variant="bodyMedium"
          color={selectedTimeZone ? colors.text : colors.textSecondary}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {selectedTimeZone ? formatTimeZone(selectedTimeZone) : 'Select time zone'}
        </Text>
        <ChevronDownIcon size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.tzModalContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 90 : 100}
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={[styles.tzModalContent, { 
              backgroundColor: theme === 'dark' 
                ? 'rgba(30, 30, 30, 0.9)' 
                : 'rgba(240, 240, 240, 0.9)' 
            }]}
          >
            <View style={styles.tzModalHeader}>
              <Text variant="titleMedium" color={colors.text}>
                Select Time Zone
              </Text>
              <TouchableOpacity
                style={styles.tzCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text variant="bodyLarge" color={colors.primary}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.tzSearchContainer, { backgroundColor: `${colors.text}10` }]}>
              <SearchIcon size={18} color={colors.textSecondary} style={styles.tzSearchIcon} />
              <RNTextInput
                ref={searchInputRef}
                style={[styles.tzSearchInput, { color: colors.text }]}
                placeholder="Search time zones..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                clearButtonMode="while-editing"
                autoFocus
              />
            </View>

            {currentTimeZone && searchQuery === '' && (
              <TouchableOpacity
                style={[
                  styles.tzItem,
                  { backgroundColor: `${colors.primary}15` }
                ]}
                onPress={() => handleSelect(currentTimeZone as TimeZone)}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" color={colors.primary} numberOfLines={1}>
                    {formatTimeZone(currentTimeZone)}
                  </Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>
                    Current device time zone
                  </Text>
                </View>
                {selectedTimeZone === currentTimeZone && (
                  <CheckIcon size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}

            <FlatList
              data={filteredTimeZones}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tzItem,
                    selectedTimeZone === item && {
                      backgroundColor: `${colors.primary}15`,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text 
                    variant="bodyMedium" 
                    color={selectedTimeZone === item ? colors.primary : colors.text}
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {formatTimeZone(item)}
                  </Text>
                  {selectedTimeZone === item && (
                    <CheckIcon size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={10}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.tzListContent}
            />
          </BlurView>
        </View>
      </Modal>
    </>
  );
};

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const animation = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon>(null);
  const successAnimationRef = useRef<LottieView>(null);

  const [alert, setAlert] = useState<AlertData | null>(null);
  const alertAnimation = useRef(new Animated.Value(0)).current;

  const descriptionRef = useRef<RNTextInput>(null);
  const venueRef = useRef<any>(null);
  const termsRef = useRef<RNTextInput>(null);
  const onlineLinkRef = useRef<RNTextInput>(null);

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
  const [timeZone, setTimeZone] = useState<TimeZone>(() => {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return allTimeZones.includes(deviceZone as TimeZone) ? (deviceZone as TimeZone) : 'UTC';
  });
  const [eventType, setEventType] = useState<EventType>('IN_PERSON');
  const [onlineLink, setOnlineLink] = useState('');

  // Date pickers visibility
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndEndTimePickerVisible] = useState(false);
  
  // Temp dates for two-stage selection process
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  
  // Current picker mode (helps track what we're editing)
  const [currentPickerMode, setCurrentPickerMode] = useState<'date' | 'time'>('date');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  const showAlert = (type: AlertType, message: string, title?: string, duration = 5000) => {
    setAlert({ type, message, title });
    Animated.spring(alertAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();

    if (duration > 0) {
      setTimeout(() => hideAlert(), duration);
    }
  };

  const hideAlert = () => {
    Animated.timing(alertAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setAlert(null));
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const complete = Boolean(
      title.trim() &&
      startDate &&
      endDate &&
      timeZone &&
      eventType &&
      (eventType === 'IN_PERSON' ? true : onlineLink.trim())
    );
    setIsFormComplete(complete);

    Animated.timing(animation, {
      toValue: complete ? 1 : calculateProgress() / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [title, description, venue, terms, startDate, endDate, backgroundImage, timeZone, eventType, onlineLink]);

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

  const checkInappropriateContent = () => {
    const allText = [title, description, venue, terms, onlineLink].join(' ').toLowerCase();
    for (const keyword of inappropriateKeywords) {
      if (allText.includes(keyword)) {
        return `Your event contains inappropriate content ("${keyword}"). Please revise and try again.`;
      }
    }
    return null;
  };

  const handleLocationSelected = (coordinates: { latitude: number; longitude: number }, address: string) => {
    setVenueCoordinates({ latitude: coordinates.latitude, longitude: coordinates.longitude, address });
    setVenueAddress(address);
    setVenue(address);
    setShowLocationPicker(false);
  };


  // Completely revamped date handlers
  const handleStartDateSelect = (event: any, selectedDate?: Date) => {
    // For Android, we need to handle dismissing the picker
    if (Platform.OS === 'android') {
      setStartDatePickerVisible(false);
    }
    
    // Only proceed if we have a date selection
    if (selectedDate) {
      // Create a new temp date with the selected date but preserve time from existing date if available
      const newTempDate = new Date(selectedDate);
      
      // If we already have a start date, copy its time portion
      if (startDate) {
        newTempDate.setHours(
          startDate.getHours(),
          startDate.getMinutes(),
          startDate.getSeconds()
        );
      } else {
        // Default to current time, rounded to nearest hour
        const now = new Date();
        newTempDate.setHours(now.getHours(), 0, 0);
      }
      
      setTempStartDate(newTempDate);
      
      // For Android, move directly to time picker
      if (Platform.OS === 'android') {
        setStartTimePickerVisible(true);
      }
    }
  };
  
  const handleStartTimeSelect = (event: any, selectedTime?: Date) => {
    // For Android, we need to handle dismissing the picker
    if (Platform.OS === 'android') {
      setStartTimePickerVisible(false);
    }
    
    // Only proceed if we have a time selection
    if (selectedTime) {
      // We need a base date to work with
      const baseDate = tempStartDate || startDate || new Date();
      
      // Create a new date with the date portion from base date and time from selection
      const newDate = new Date(baseDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0, // Reset seconds
        0  // Reset milliseconds
      );
      
      // Actually update the start date
      setStartDate(newDate);
      
      // If end date is before new start date or not set, update it to be an hour later
      if (!endDate || newDate >= endDate) {
        const newEndDate = new Date(newDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDate(newEndDate);
      }
      
      // Clean up - reset the temp date
      setTempStartDate(null);
      
      // Close the picker on Android (iOS uses button)
      if (Platform.OS === 'android') {
        setStartTimePickerVisible(false);
      }
      
      // Debug info to help track the flow
      console.log('Start date updated to:', newDate.toLocaleString());
    }
  };
  
  const handleEndDateSelect = (event: any, selectedDate?: Date) => {
    // For Android, we need to handle dismissing the picker
    if (Platform.OS === 'android') {
      setEndDatePickerVisible(false);
    }
    
    // Only proceed if we have a date selection
    if (selectedDate) {
      // Create a new temp date with the selected date but preserve time from existing date if available
      const newTempDate = new Date(selectedDate);
      
      // If we already have an end date, copy its time portion
      if (endDate) {
        newTempDate.setHours(
          endDate.getHours(),
          endDate.getMinutes(),
          endDate.getSeconds()
        );
      } else if (startDate) {
        // Default to start date + 1 hour if we have a start date
        newTempDate.setHours(
          startDate.getHours() + 1,
          startDate.getMinutes(),
          startDate.getSeconds()
        );
      } else {
        // Default to current time + 1 hour
        const now = new Date();
        newTempDate.setHours(now.getHours() + 1, 0, 0);
      }
      
      setTempEndDate(newTempDate);
      
      // For Android, move directly to time picker
      if (Platform.OS === 'android') {
        setEndEndTimePickerVisible(true);
      }
    }
  };
  
  const handleEndTimeSelect = (event: any, selectedTime?: Date) => {
    // For Android, we need to handle dismissing the picker
    if (Platform.OS === 'android') {
      setEndEndTimePickerVisible(false);
    }
    
    // Only proceed if we have a time selection
    if (selectedTime) {
      // We need a base date to work with
      const baseDate = tempEndDate || endDate || new Date();
      
      // Create a new date with the date portion from base date and time from selection
      const newDate = new Date(baseDate);
      newDate.setHours(
        selectedTime.getHours(),
        selectedTime.getMinutes(),
        0, // Reset seconds
        0  // Reset milliseconds
      );
      
      // Actually update the end date
      setEndDate(newDate);
      
      // Clean up - reset the temp date
      setTempEndDate(null);
      
      // Close the picker on Android (iOS uses button)
      if (Platform.OS === 'android') {
        setEndEndTimePickerVisible(false);
      }
      
      // Debug info to help track the flow
      console.log('End date updated to:', newDate.toLocaleString());
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const inappropriateContent = checkInappropriateContent();
    if (inappropriateContent) {
      showAlert('error', inappropriateContent, 'Content Policy Violation');
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Event title is required';
    else if (title.length < 3) errors.title = 'Title must be at least 3 characters';
    else if (title.length > 80) errors.title = 'Title must be less than 80 characters';

    if (description && description.length < 10) errors.description = 'Description must be at least 10 characters';

    const now = new Date();
    if (startDate && timeZone) {
      const selectedStartLocal = format(startDate, 'yyyy-MM-dd HH:mm:ss');
      const startMoment = moment.tz(selectedStartLocal, 'yyyy-MM-dd HH:mm:ss', timeZone);
      const startUtc = startMoment.utc().toDate();
      if (isBefore(startUtc, now)) {
        errors.startDate = 'Start time cannot be in the past';
      }
    } else {
      errors.startDate = 'Start date and time are required';
    }

    if (endDate && startDate && timeZone) {
      const selectedEndLocal = format(endDate, 'yyyy-MM-dd HH:mm:ss');
      const endMoment = moment.tz(selectedEndLocal, 'yyyy-MM-dd HH:mm:ss', timeZone);
      const endUtc = endMoment.utc().toDate();
      const selectedStartLocal = format(startDate, 'yyyy-MM-dd HH:mm:ss');
      const startMoment = moment.tz(selectedStartLocal, 'yyyy-MM-dd HH:mm:ss', timeZone);
      const startUtc = startMoment.utc().toDate();
      if (isBefore(endUtc, startUtc)) {
        errors.endDate = 'End time must be after start time';
      }
    } else {
      errors.endDate = 'End date and time are required';
    }

    if (!timeZone) errors.timeZone = 'Time zone is required';
    else if (!allTimeZones.includes(timeZone)) errors.timeZone = 'Invalid time zone';

    if (!eventType) errors.eventType = 'Event type is required';
    else if (!eventTypes.includes(eventType)) errors.eventType = 'Invalid event type';

    if ((eventType === 'ONLINE' || eventType === 'HYBRID') && !onlineLink.trim()) {
      errors.onlineLink = 'Online link is required for online or hybrid events';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join('. ');
      showAlert('error', errorMessages, 'Form Incomplete');
      if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setValidationErrors({});
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const selectedStartLocal = startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : null;
      const startMoment = selectedStartLocal ? moment.tz(selectedStartLocal, 'yyyy-MM-dd HH:mm:ss', timeZone) : null;
      const startUtc = startMoment ? startMoment.utc().toDate() : null;
      const selectedEndLocal = endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : null;
      const endMoment = selectedEndLocal ? moment.tz(selectedEndLocal, 'yyyy-MM-dd HH:mm:ss', timeZone) : null;
      const endUtc = endMoment ? endMoment.utc().toDate() : null;
      const startTime = startUtc ? Math.floor(startUtc.getTime() / 1000).toString() : '';
      const endTime = endUtc ? Math.floor(endUtc.getTime() / 1000).toString() : '';

      const eventData = {
        title,
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        startTime,
        endTime,
        eventScope,
        timeZone,
        eventType,
        onlineLink: onlineLink.trim() || undefined,
        backgroundImage: backgroundImage || undefined,
        termsCondition: terms.trim() || undefined,
      };

      const response: ApiResponse<Event> = await ApiService.createEvent(eventData);

      if (response.success && response.data) {
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert('success', 'Your event has been successfully created!', 'Event Created', 1500);

        setTimeout(() => {
          setCreatedEventId(response.data?._id ?? null);
          setShowSuccessView(true);

          setTimeout(() => {
            confettiRef.current?.start();
            successAnimationRef.current?.play();
          }, 300);
        }, 1500);
      } else {
        const errorMessage = Array.isArray(response.message)
          ? response.message.join('. ')
          : response.message || 'Failed to create event';
        showAlert('error', errorMessage, 'Creation Failed');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showAlert('error', 'An unexpected error occurred while creating your event', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToCalendar = async () => {
    if (!startDate || !endDate || !title) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        showAlert('error', 'Calendar permission is needed to add this event', 'Permission Required');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((cal) => cal.isPrimary) || calendars[0];
      if (!defaultCalendar) {
        showAlert('error', 'No calendar found on this device', 'Calendar Error');
        return;
      }

      const startMoment = moment.tz(startDate, timeZone);
      const endMoment = moment.tz(endDate, timeZone);
      const eventDetails = {
        title,
        startDate: startMoment.toDate(), // Local time in event's time zone
        endDate: endMoment.toDate(),     // Local time in event's time zone
        location: venue,
        notes: description,
        timeZone,
      };

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
      if (eventId) {
        showAlert('success', 'Event added to your calendar', 'Success', 1500);
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showAlert('error', 'Failed to add event to calendar', 'Error');
    }
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    setStartDatePickerVisible(false);
    if (!endDate || date >= endDate) {
      const newEndDate = new Date(date);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    setEndDatePickerVisible(false);
  };

  const formatDate = (date: Date | null, includeTime = true): string => {
    if (!date || !timeZone) return '';
    try {
      const formattedDate = format(date, includeTime ? 'EEE, MMM d, yyyy h:mm a' : 'EEE, MMM d, yyyy');
      const tzAbbr = moment.tz(timeZone).format('z');
      return `${formattedDate} ${tzAbbr}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

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
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('error', 'Failed to select image', 'Error');
    }
  };

  const toggleEventScope = () => {
    setEventScope((prev) => (prev === 'UNIVERSITY' ? 'PUBLIC' : 'UNIVERSITY'));
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };


  const shareEvent = async () => {
    if (!title || !startDate) return;
    try {
      const formattedDate = formatDate(startDate);
      const message = `Join me at ${title} on ${formattedDate}${venue ? ` at ${venue}` : ''}!${eventType !== 'IN_PERSON' && onlineLink ? ` Join here: ${onlineLink}` : ''}`;
      await Sharing.shareAsync(message);
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error sharing event:', error);
      showAlert('error', 'Failed to share event', 'Error');
    }
  };

  const viewCreatedEvent = () => {
    if (createdEventId) navigation.replace('EventDetails', { eventId: createdEventId });
  };

  const createAnotherEvent = () => {
    setShowSuccessView(false);
    setTitle('');
    setDescription('');
    setVenue('');
    setVenueCoordinates(null);
    setVenueAddress('');
    setTerms('');
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(allTimeZones.includes(deviceZone as TimeZone) ? (deviceZone as TimeZone) : 'UTC');
    setEventType('IN_PERSON');
    setOnlineLink('');
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

  const calculateProgress = () => {
    let progress = 0;
    if (title.trim()) progress += 1;
    if (description.trim()) progress += 1;
    if (venue.trim()) progress += 1;
    if (terms.trim()) progress += 1;
    if (startDate) progress += 1;
    if (endDate) progress += 1;
    if (backgroundImage) progress += 1;
    if (timeZone) progress += 1;
    if (eventType) progress += 1;
    if (eventType === 'IN_PERSON' ? true : onlineLink.trim()) progress += 1;
    return (progress / 10) * 100;
  };

  const getStaticMapUrl = (latitude: number, longitude: number) => {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x300&markers=color:red%7C${latitude},${longitude}&key=AIzaSyD7_tt95oyNRydKL0CzELwfDq25wTVb-Nk`;
  };

  const progressPercentage = calculateProgress();
  const progressWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderAlertIcon = () => {
    if (!alert) return null;
    switch (alert.type) {
      case 'error': return <AlertCircleIcon size={24} color={colors.error} />;
      case 'success': return <CheckCircleIcon size={24} color={colors.success} />;
      case 'info': return <InfoIcon size={24} color={colors.info} />;
      default: return null;
    }
  };

  const getAlertBackgroundColor = () => {
    if (!alert) return colors.card;
    switch (alert.type) {
      case 'error': return theme === 'dark' ? '#3D1515' : '#FEE7E7';
      case 'success': return theme === 'dark' ? '#153D1A' : '#E7FEEA';
      case 'info': return theme === 'dark' ? '#15293D' : '#E7F2FE';
      default: return colors.card;
    }
  };

  const getAlertTextColor = () => {
    if (!alert) return colors.text;
    switch (alert.type) {
      case 'error': return theme === 'dark' ? '#FF9A9A' : '#D32F2F';
      case 'success': return theme === 'dark' ? '#9AFFAE' : '#2E7D32';
      case 'info': return theme === 'dark' ? '#9AC8FF' : '#1976D2';
      default: return colors.text;
    }
  };

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
                  backgroundImage === image && { borderColor: colors.primary, borderWidth: 3 },
                ]}
                onPress={() => {
                  setBackgroundImage(image);
                  setShowImagePicker(false);
                  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      {alert && (
        <Animated.View
          style={[
            styles.alertContainer,
            {
              backgroundColor: getAlertBackgroundColor(),
              transform: [
                { translateY: alertAnimation.interpolate({ inputRange: [0, 1], outputRange: [-100, 0] }) },
                { scale: alertAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
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
                <Text variant="labelLarge" style={[styles.alertTitle, { color: getAlertTextColor() }]}>
                  {alert.title}
                </Text>
              )}
              <Text variant="bodyMedium" style={{ color: colors.text }}>
                {alert.message}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.alertCloseButton} onPress={hideAlert}>
            <XIcon size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}
      <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" color={colors.text}>
          Create Event
        </Text>
        <View style={styles.backButton} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: `${colors.primary}20`, width: '100%' }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: colors.primary, width: progressWidth }]} />
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
        <TouchableOpacity style={styles.imageContainer} onPress={() => setShowImagePicker(true)} activeOpacity={0.9}>
          <ImageBackground source={{ uri: backgroundImage }} style={styles.backgroundImage} resizeMode="cover">
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']} style={styles.imageDarkener} />
            <View style={styles.imagePicker}>
              <ImageIcon size={24} color="white" />
              <Text variant="labelMedium" color="white" style={{ marginLeft: SPACING.xs }}>
                {backgroundImage === defaultBackgroundImages[0] ? 'Choose Event Image' : 'Change Event Image'}
              </Text>
            </View>
          </ImageBackground>
          {validationErrors.backgroundImage && (
            <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
              {validationErrors.backgroundImage}
            </Text>
          )}
        </TouchableOpacity>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Event Title</Text>
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
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Description</Text>
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
          <View style={styles.dateTimeContainer}>
           <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Start Date & Time</Text>
            <TouchableOpacity
              style={[
                styles.dateTimePicker,
                { borderColor: validationErrors.startDate ? colors.error : colors.border, backgroundColor: colors.card },
              ]}
              onPress={() => {
                // Clear any existing temp date state, then set up for new selection
                setTempStartDate(null);
                setTimeout(() => {
                  // Use setTimeout to ensure state is cleared before setting new values
                  setCurrentPickerMode('date');
                  setStartDatePickerVisible(true);
                }, 10);
              }}
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
            {validationErrors.startDate && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {validationErrors.startDate}
              </Text>
            )}
            <Text variant="bodySmall" color={colors.textSecondary}>
              Select the start time as it should be in {timeZone}.
            </Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Current time in {timeZone}: {moment().tz(timeZone).format('EEE, MMM d, yyyy h:mm a z')}
            </Text>
          </View>
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" color={colors.text}>End Date & Time</Text>
              <TouchableOpacity
                style={[
                  styles.dateTimePicker,
                  { borderColor: validationErrors.endDate ? colors.error : colors.border, backgroundColor: colors.card },
                ]}
                onPress={() => {
                  // Initialize tempEndDate when opening the picker
                  setTempEndDate(endDate || new Date());
                  setEndDatePickerVisible(true);
                }}
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
              {validationErrors.endDate && (
                <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                  {validationErrors.endDate}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Time Zone</Text>
            <TimezoneDropdown
              selectedTimeZone={timeZone}
              onSelectTimeZone={setTimeZone}
              error={validationErrors.timeZone}
              colors={colors}
              theme={theme}
            />
            {validationErrors.timeZone && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {validationErrors.timeZone}
              </Text>
            )}
            <Text variant="bodySmall" color={colors.textSecondary}>
              Select the time zone for the event's start and end times
            </Text>
          </View>
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Event Type</Text>
            <View style={styles.eventScopeContainer}>
              {eventTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.eventScopeOption,
                    eventType === type && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                    { borderColor: colors.border, marginRight: SPACING.sm },
                  ]}
                  onPress={() => setEventType(type)}
                >
                  <Text variant="bodyMedium" color={eventType === type ? colors.primary : colors.text}>
                    {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  {eventType === type && <CheckIcon size={16} color={colors.primary} style={{ marginLeft: SPACING.xs }} />}
                </TouchableOpacity>
              ))}
            </View>
            {validationErrors.eventType && (
              <Text variant="bodySmall" color={colors.error} style={styles.errorText}>
                {validationErrors.eventType}
              </Text>
            )}
            <Text variant="bodySmall" color={colors.textSecondary}>
              Specify if the event is in-person, online, or both (hybrid)
            </Text>
          </View>
          {(eventType === 'ONLINE' || eventType === 'HYBRID') && (
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" color={colors.text}>Online Link</Text>
              <TextInput
                ref={onlineLinkRef}
                value={onlineLink}
                onChangeText={setOnlineLink}
                placeholder="Enter the link for the online event (e.g., Zoom, Google Meet)"
                returnKeyType="next"
                error={validationErrors.onlineLink}
                errorText={validationErrors.onlineLink}
              />
              <Text variant="bodySmall" color={colors.textSecondary}>
                Provide a link for attendees to join the event online
              </Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Venue</Text>
            <TextInput
              ref={venueRef}
              value={venue}
              onChangeText={(text) => {
                setVenue(text);
                setVenueAddress(text);
                setVenueCoordinates(null); // Reset coordinates when typing manually
              }}
              placeholder="Enter venue address or select from map"
              returnKeyType="next"
              error={validationErrors.venue}
              errorText={validationErrors.venue}
            />
            <Button title="Select Venue from Map" onPress={() => setShowLocationPicker(true)} style={styles.mapButton} />
            <Modal visible={showLocationPicker} animationType="slide">
              <View style={styles.modalContainer}>
                <LocationPicker onLocationSelected={handleLocationSelected} />
                <Button title="Cancel" onPress={() => setShowLocationPicker(false)} />
              </View>
            </Modal>
            {venueCoordinates && venueCoordinates.latitude && venueCoordinates.longitude && (
              <View style={styles.mapPreviewContainer}>
                <Image
                  source={{ uri: getStaticMapUrl(venueCoordinates.latitude, venueCoordinates.longitude) }}
                  style={styles.mapPreview}
                  resizeMode="cover"
                />
              </View>
            )}
            <Text variant="bodySmall" color={colors.textSecondary}>
              Enter a specific location or use the map to select an address
            </Text>
          </View>
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Terms & Conditions</Text>
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
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>Event Scope</Text>
            <View style={styles.eventScopeContainer}>
              <TouchableOpacity
                style={[
                  styles.eventScopeOption,
                  eventScope === 'UNIVERSITY' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setEventScope('UNIVERSITY')}
              >
                <Text variant="bodyMedium" color={eventScope === 'UNIVERSITY' ? colors.primary : colors.text}>
                  University Only
                </Text>
                {eventScope === 'UNIVERSITY' && <CheckIcon size={16} color={colors.primary} style={{ marginLeft: SPACING.xs }} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.eventScopeOption,
                  eventScope === 'PUBLIC' && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => setEventScope('PUBLIC')}
              >
                <Text variant="bodyMedium" color={eventScope === 'PUBLIC' ? colors.primary : colors.text}>
                  Public
                </Text>
                {eventScope === 'PUBLIC' && <CheckIcon size={16} color={colors.primary} style={{ marginLeft: SPACING.xs }} />}
              </TouchableOpacity>
            </View>
            <Text variant="bodySmall" color={colors.textSecondary}>
              {eventScope === 'UNIVERSITY' ? 'Only university members can see and join this event' : 'Anyone can discover and join this event'}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <View style={[styles.submitContainer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
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
{/* Start Date Picker Modal */}
<Modal
        visible={isStartDatePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStartDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalTouchableOverlay}
            activeOpacity={1}
            onPress={() => setStartDatePickerVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" color={colors.text}>
                Select Start Date
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setStartDatePickerVisible(false)}>
                <Text variant="bodyLarge" color={colors.primary}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleStartDateSelect}
              minimumDate={new Date()}
              maximumDate={new Date(2100, 0, 1)}
            />
            {Platform.OS === 'ios' && (
              <Button
                title="Next"
                onPress={() => {
                  // Create a fresh temp date based on the current start date or now
                  const selectedDate = startDate || new Date();
                  setTempStartDate(new Date(selectedDate));
                  
                  // Update UI state
                  setStartDatePickerVisible(false);
                  setCurrentPickerMode('time');
                  
                  // Short delay to ensure state transitions properly
                  setTimeout(() => {
                    setStartTimePickerVisible(true);
                  }, 50);
                }}
                variant="primary"
                size="large"
                style={styles.modalButton}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Start Time Picker Modal */}
      <Modal
        visible={isStartTimePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStartTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalTouchableOverlay}
            activeOpacity={1}
            onPress={() => setStartTimePickerVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" color={colors.text}>
                Select Start Time
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setStartTimePickerVisible(false)}>
                <Text variant="bodyLarge" color={colors.primary}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempStartDate || startDate || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              onChange={handleStartTimeSelect}
              minuteInterval={5}
            />
            {Platform.OS === 'ios' && (
              <Button
                title="Confirm"
                onPress={() => {
                  if (tempStartDate) {
                    // Use the current time in the picker (which may be different from the device time)
                    const newDate = new Date(tempStartDate);
                    
                    // Set to the start date
                    setStartDate(newDate);
                    
                    // If end date is before new start date or not set, update it to be an hour later
                    if (!endDate || newDate >= endDate) {
                      const newEndDate = new Date(newDate);
                      newEndDate.setHours(newEndDate.getHours() + 1);
                      setEndDate(newEndDate);
                    }
                    
                    // Debug info
                    console.log('Start time confirmed:', newDate.toLocaleString());
                  }
                  
                  // Clean up state
                  setTempStartDate(null);
                  setStartTimePickerVisible(false);
                }}
                variant="primary"
                size="large"
                style={styles.modalButton}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* End Date Picker Modal */}
      <Modal
        visible={isEndDatePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEndDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalTouchableOverlay}
            activeOpacity={1}
            onPress={() => setEndDatePickerVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" color={colors.text}>
                Select End Date
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEndDatePickerVisible(false)}>
                <Text variant="bodyLarge" color={colors.primary}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleEndDateSelect}
              minimumDate={startDate || new Date()}
              maximumDate={new Date(2100, 0, 1)}
            />
            {Platform.OS === 'ios' && (
              <Button
                title="Next"
                onPress={() => {
                  // Create a fresh temp date based on the current end date or start date + 1hr
                  let selectedDate;
                  if (endDate) {
                    selectedDate = new Date(endDate);
                  } else if (startDate) {
                    selectedDate = new Date(startDate);
                    selectedDate.setHours(selectedDate.getHours() + 1);
                  } else {
                    selectedDate = new Date();
                    selectedDate.setHours(selectedDate.getHours() + 1);
                  }
                  
                  setTempEndDate(selectedDate);
                  
                  // Update UI state
                  setEndDatePickerVisible(false);
                  setCurrentPickerMode('time');
                  
                  // Short delay to ensure state transitions properly
                  setTimeout(() => {
                    setEndEndTimePickerVisible(true);
                  }, 50);
                }}
                variant="primary"
                size="large"
                style={styles.modalButton}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* End Time Picker Modal */}
      <Modal
        visible={isEndTimePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEndEndTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalTouchableOverlay}
            activeOpacity={1}
            onPress={() => setEndEndTimePickerVisible(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" color={colors.text}>
                Select End Time
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setEndEndTimePickerVisible(false)}>
                <Text variant="bodyLarge" color={colors.primary}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempEndDate || endDate || new Date()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
              onChange={handleEndTimeSelect}
              minuteInterval={5}
            />
            {Platform.OS === 'ios' && (
              <Button
                title="Confirm"
                onPress={() => {
                  if (tempEndDate) {
                    // Use the current temp time (which contains both date and time from the pickers)
                    const newDate = new Date(tempEndDate);
                    
                    // Set to the end date
                    setEndDate(newDate);
                    
                    // Debug info
                    console.log('End time confirmed:', newDate.toLocaleString());
                  }
                  
                  // Clean up state
                  setTempEndDate(null);
                  setEndEndTimePickerVisible(false);
                }}
                variant="primary"
                size="large"
                style={styles.modalButton}
              />
            )}
          </View>
        </View>
      </Modal>
      {renderImagePickerModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  },modalButton: {
    marginTop: SPACING.md,
  },
  progressBar: { height: 8, borderRadius: 4, flex: 1, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { marginLeft: SPACING.sm, width: 90, textAlign: 'right' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  imageContainer: { width: '100%', height: moderateScale(200) },
  backgroundImage: { width: '100%', height: '100%' },
  imageDarkener: { ...StyleSheet.absoluteFillObject },
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
  formContainer: { padding: SPACING.md },
  inputContainer: { marginBottom: SPACING.lg },
  dateTimeContainer: { flexDirection: 'column' },
  dateTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dateTimeText: { marginLeft: SPACING.sm },
  errorText: { marginTop: SPACING.xs },
  mapPreviewContainer: { 
    marginTop: SPACING.sm, 
    marginBottom: SPACING.sm, 
    overflow: 'hidden', 
    borderRadius: BORDER_RADIUS.md, 
    height: moderateScale(150),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mapPreview: { width: '100%', height: '100%' },
  eventScopeContainer: { flexDirection: 'row', marginTop: SPACING.xs, flexWrap: 'wrap' },
  eventScopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  submitContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  submitButton: { width: '100%' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  modalTouchableOverlay: { ...StyleSheet.absoluteFillObject },
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
  closeButton: { padding: SPACING.xs },
  backgroundImagesContainer: { paddingVertical: SPACING.sm },
  backgroundImageOption: {
    width: moderateScale(120),
    height: moderateScale(70),
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  backgroundImageThumbnail: { width: '100%', height: '100%' },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  successContainer: { justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  successAnimation: { width: moderateScale(200), height: moderateScale(200) },
  successTitle: { marginTop: SPACING.xl, textAlign: 'center' },
  successMessage: { marginTop: SPACING.md, textAlign: 'center' },
  successButtonsContainer: { width: '100%', marginTop: SPACING.xl },
  successButton: { width: '100%' },
  successActionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionButtonText: { marginLeft: SPACING.xs },
  createAnotherButton: { alignItems: 'center', paddingVertical: SPACING.lg, marginTop: SPACING.lg },
  modalContainer: { flex: 1, justifyContent: 'space-between', paddingBottom: 20 },
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
  alertContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  alertIconContainer: { marginRight: SPACING.sm, paddingTop: 2 },
  alertTextContainer: { flex: 1 },
  alertTitle: { marginBottom: 2, fontWeight: '600' },
  alertCloseButton: { padding: SPACING.xs, marginLeft: SPACING.xs },
  mapButton: { marginTop: SPACING.sm },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  tzModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tzModalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  tzModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tzCloseButton: {
    padding: SPACING.xs,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tzSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tzSearchIcon: {
    marginRight: SPACING.sm,
  },
  tzSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 0 : SPACING.sm,
  },
  tzItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: 1,
  },
  tzListContent: {
    paddingBottom: SPACING.lg,
  },
});

export default CreateEventScreen;