// src/screens/EditEventScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  ImageBackground,
  Image
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
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
  CheckIcon
} from '../components/NavigationIcons';
import * as Haptics from 'expo-haptics';
import ApiService, { Event } from '../services/ApiService';
import { StatusBar } from 'expo-status-bar';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '../components/Button';

type EditEventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditEvent'>;
type EditEventScreenRouteProp = RouteProp<RootStackParamList, 'EditEvent'>;

interface EditEventScreenProps {
  navigation: EditEventScreenNavigationProp;
  route: EditEventScreenRouteProp;
}

const EditEventScreen: React.FC<EditEventScreenProps> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Input refs for focus handling
  const descriptionRef = useRef<RNTextInput>(null);
  const venueRef = useRef<RNTextInput>(null);
  const termsRef = useRef<RNTextInput>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [terms, setTerms] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [eventScope, setEventScope] = useState<'university' | 'public'>('university');
  
  // UI state
  const [isStartDatePickerVisible, setStartDatePickerVisible] = useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  
  // Fetch event details on mount
  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      
      try {
        // We'll need to fetch the event based on the event ID
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
          // Populate form with event data
          setTitle(event.title);
          setDescription(event.description);
          setVenue(event.venue);
          setTerms(event.termsCondition);
          setStartDate(new Date(event.startTime));
          setEndDate(new Date(event.endTime));
          setBackgroundImage(event.backgroundImage);
          setEventScope(event.eventScope);
        } else {
          Alert.alert('Error', 'Event not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        Alert.alert('Error', 'Failed to load event details');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const errors: Record<string, string> = {};
    
    if (!title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (!description.trim()) {
      errors.description = 'Event description is required';
    }
    
    if (!venue.trim()) {
      errors.venue = 'Event venue is required';
    }
    
    if (!terms.trim()) {
      errors.terms = 'Terms and conditions are required';
    }
    
    if (!startDate) {
      errors.startDate = 'Start date and time are required';
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
      
      // Haptic feedback for error
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
      const response = await ApiService.editEvent(
        eventId,
        {
          title,
          description,
          startTime: startDate!.toISOString(),
          endTime: endDate!.toISOString(),
          venue,
          termsCondition: terms,
          backgroundImage,
          eventScope
        }
      );
      
      if (response.success) {
        // Show success message
        Alert.alert(
          'Success',
          'Your event has been updated successfully!',
          [
            {
              text: 'View Event',
              onPress: () => {
                navigation.replace('EventDetails', { eventId });
              }
            }
          ]
        );
      } else {
        // Show error message
        Alert.alert('Error', response.message?.toString() || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'An unexpected error occurred');
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
      Alert.alert('Permission required', 'We need access to your photo library to select an image');
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
        // In a real app, you would upload the image to your server and get a URL
        // For this demo, we'll just set it directly, but in production you'd need to handle the upload
        Alert.alert(
          'Image Selected',
          'In a real app, this image would be uploaded to the server. For now, we\'ll keep the existing image.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  // Toggle event scope between university and public
  const toggleEventScope = () => {
    setEventScope(prev => prev === 'university' ? 'public' : 'university');
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Show loading state while fetching event data
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyLarge" color={colors.text} style={{ marginTop: SPACING.md }}>
          Loading event details...
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text variant="titleMedium" color={colors.text}>
          Edit Event
        </Text>
        <View style={styles.backButton} /> {/* Empty view for centering */}
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
            <View style={[styles.imagePicker, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <ImageIcon size={20} color="white" />
              <Text variant="labelMedium" color="white" style={{ marginLeft: SPACING.xs }}>
                Change Image
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
              placeholder="Enter event title"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              error={validationErrors.title}
              errorText={validationErrors.title}
            />
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
              placeholder="Describe your event"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => venueRef.current?.focus()}
              error={validationErrors.description}
              errorText={validationErrors.description}
            />
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
                    borderColor: validationErrors.startDate 
                      ? colors.error 
                      : colors.border,
                    backgroundColor: colors.card
                  }
                ]}
                onPress={() => setStartDatePickerVisible(true)}
              >
                <CalendarIcon size={18} color={colors.primary} />
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
                    borderColor: validationErrors.endDate 
                      ? colors.error 
                      : colors.border,
                    backgroundColor: colors.card
                  }
                ]}
                onPress={() => setEndDatePickerVisible(true)}
              >
                <ClockIcon size={18} color={colors.primary} />
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
            <Text variant="labelLarge" color={colors.text}>
              Venue
            </Text>
            <TextInput
              ref={venueRef}
              value={venue}
              onChangeText={setVenue}
              placeholder="Enter event location"
              returnKeyType="next"
              onSubmitEditing={() => termsRef.current?.focus()}
              error={validationErrors.venue}
              errorText={validationErrors.venue}
              leftIcon={<LocationPinIcon size={18} color={colors.primary} />}
            />
          </View>
          
          {/* Event Terms and Conditions */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Terms & Conditions
            </Text>
            <TextInput
              ref={termsRef}
              value={terms}
              onChangeText={setTerms}
              placeholder="Enter event terms and conditions"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              error={validationErrors.terms}
              errorText={validationErrors.terms}
            />
          </View>
          
          {/* Event Scope Toggle */}
          <View style={styles.inputContainer}>
            <Text variant="labelLarge" color={colors.text}>
              Event Visibility
            </Text>
            <View style={styles.scopeContainer}>
              <TouchableOpacity
                style={[
                  styles.scopeOption,
                  eventScope === 'university' && { 
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => setEventScope('university')}
              >
                {eventScope === 'university' && (
                  <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                    <CheckIcon size={12} color="white" />
                  </View>
                )}
                <Text 
                  variant="bodyMedium" 
                  color={eventScope === 'university' ? colors.primary : colors.text}
                >
                  University Only
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.scopeOption,
                  eventScope === 'public' && { 
                    backgroundColor: `${colors.primary}20`,
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => setEventScope('public')}
              >
                {eventScope === 'public' && (
                  <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                    <CheckIcon size={12} color="white" />
                  </View>
                )}
                <Text 
                  variant="bodyMedium" 
                  color={eventScope === 'public' ? colors.primary : colors.text}
                >
                  Public
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: SPACING.xs }}>
              {eventScope === 'university' 
                ? 'Only university members can view this event' 
                : 'Anyone can view this event'}
            </Text>
          </View>
          
          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Update Event"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      
      {/* Date Time Pickers */}
      <DateTimePickerModal
        isVisible={isStartDatePickerVisible}
        mode="datetime"
        onConfirm={handleStartDateConfirm}
        onCancel={() => setStartDatePickerVisible(false)}
        date={startDate || new Date()}
      />
      
      <DateTimePickerModal
        isVisible={isEndDatePickerVisible}
        mode="datetime"
        onConfirm={handleEndDateConfirm}
        onCancel={() => setEndDatePickerVisible(false)}
        minimumDate={startDate || new Date()}
        date={endDate || new Date()}
      />
      
      {/* Image Picker Bottom Sheet */}
      {showImagePicker && (
        <View style={styles.bottomSheet}>
          <TouchableOpacity 
            style={styles.bottomSheetOverlay}
            onPress={() => setShowImagePicker(false)}
          />
          
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.card }]}>
            <View style={styles.bottomSheetHeader}>
              <Text variant="titleSmall" color={colors.text}>
                Choose a Background Image
              </Text>
              <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                <Text variant="labelMedium" color={colors.primary}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Gallery Option */}
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={handlePickImage}
            >
              <View style={[styles.imagePickerIcon, { backgroundColor: `${colors.primary}20` }]}>
                <ImageIcon size={20} color={colors.primary} />
              </View>
              <Text variant="bodyMedium" color={colors.text}>
                Choose from Library
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xxl,
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(200),
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  formContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  dateTimeContainer: {
    marginBottom: SPACING.sm,
  },
  dateTimePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: moderateScale(12),
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  dateTimeText: {
    marginLeft: SPACING.sm,
  },
  errorText: {
    marginTop: SPACING.xxs,
    marginLeft: SPACING.xxs,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  scopeContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  scopeOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  checkIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  bottomSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  bottomSheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheetContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: SPACING.md,
  },
  imagePickerIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
});

export default EditEventScreen;