import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Platform,
  Image,
  PermissionsAndroid,
  Dimensions,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import Text from '../components/Text';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { CameraIcon, IDCardIcon, CheckIcon, ThemeToggleIcon } from '../components/icons';
import ApiService from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import { 
  horizontalScale, 
  verticalScale, 
  moderateScale,
  isSmallDevice,
  isTablet,
  useOrientation,
  OrientationType
} from '../utils/responsiveUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

type OnboardingDocumentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingDocument'>;

interface OnboardingDocumentScreenProps {
  navigation: OnboardingDocumentScreenNavigationProp;
}

const OnboardingDocumentScreen: React.FC<OnboardingDocumentScreenProps> = ({ navigation }) => {
  const { colors, styles, theme, toggleTheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const orientation = useOrientation();
  
  // State
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const uploadBoxAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  
  // Run entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Request permissions on Android
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: "Camera Permission",
              message: "CampusClub needs access to your camera to take a photo of your student ID.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          
          const storageGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: "Storage Permission",
              message: "CampusClub needs access to your storage to select a photo of your student ID.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
        } catch (err) {
          console.warn(err);
        }
      }
    })();
  }, []);
  
  // Animate to success state
  const animateToSuccess = () => {
    Animated.sequence([
      Animated.timing(uploadBoxAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };
  
  // Take a photo using camera
  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        // Set a maximum width/height to prevent memory issues with very large images
        exif: false,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };
  
  // Pick an image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        // Set a maximum width/height to prevent memory issues
        exif: false,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };
  
  // Upload image to server
  const uploadImage = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select or take a photo of your student ID first.');
      return;
    }
    
    setUploading(true);
    
    try {
      // First get the user's email from storage or API
      const userEmail = await getUserEmail();
      
      // Create form data for upload
      const formData = new FormData();
      const fileExt = image.split('.').pop();
      const fileName = `student_id_${Date.now()}.${fileExt}`;
      
      // Add the file
      // @ts-ignore - TypeScript doesn't like the FormData API with React Native
      formData.append('file', {
        uri: image,
        name: fileName,
        type: `image/${fileExt}`,
      });
      
      // Add required fields from backend validation
      formData.append('email', userEmail);
      
      const response = await ApiService.uploadStudentID(formData);
      
      if (response.success) {  // Keep using success since ApiService returns this
        setSuccess(true);
        animateToSuccess();
      } else {
        Alert.alert('Upload Failed', Array.isArray(response.message) ? response.message[0] : response.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', 'An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  const getUserEmail = async () => {
    try {
      // First try to get email from AsyncStorage as it's most reliable
      const userString = await AsyncStorage.getItem('@unicoup:user');
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData.email) {
          return userData.email;
        }
      }
      
      // Second, try to get email from student status (API call)
      const statusResponse = await ApiService.getStudentStatus();
      if (statusResponse.success && statusResponse.data && statusResponse.data.email) {
        return statusResponse.data.email;
      }
      
    } catch (error) {
      console.error('Error getting user email:', error);
      throw error;
    }
  };
  
  // Go to login screen
  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };
  
  // Calculate responsive dimensions
  const getPreviewHeight = () => {
    // Make preview height responsive to screen size
    if (isTablet) {
      return orientation === 'LANDSCAPE' ? height * 0.4 : height * 0.3;
    }
    
    return orientation === 'LANDSCAPE' ? height * 0.5 : moderateScale(250);
  };
  
  const previewHeight = getPreviewHeight();
  
  return (
    <ScreenContainer 
      scrollable={true} // Changed to true to make content scrollable
      statusBarStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
    >
      <Animated.View 
        style={[
          styles.layout.paddedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
            paddingBottom: verticalScale(30), // Add padding to bottom for scrolling
          },
        ]}
      >
        {/* Header with theme toggle */}
        <View style={localStyles.header}>
          <Text variant={isTablet ? "displaySmall" : "headingLarge"}>CampusClub</Text>
          <TouchableOpacity 
            style={localStyles.themeToggle} 
            onPress={toggleTheme}
          >
            <ThemeToggleIcon size={moderateScale(24)} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {/* Progress indicator */}
        <View style={localStyles.progressContainer}>
          <View style={localStyles.progressBar}>
            <View 
              style={[
                localStyles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: '100%', 
                },
              ]} 
            />
          </View>
          <Text variant="labelSmall" color={colors.textSecondary}>
            Step 2 of 2
          </Text>
        </View>
        
        {/* Upload Content */}
        <View style={localStyles.contentContainer}>
          <Text variant={isTablet ? "headingLarge" : "headingMedium"} style={localStyles.title}>
            Upload Student ID
          </Text>
          <Text 
            variant={isTablet ? "bodyLarge" : "bodyMedium"} 
            color={colors.textSecondary} 
            style={localStyles.subtitle}
          >
            Please upload a clear photo of your student ID to verify your student status.
          </Text>
          
          {/* Upload Box */}
          <Animated.View 
            style={[
              localStyles.uploadContainer,
              { 
                opacity: uploadBoxAnim,
                display: success ? 'none' : 'flex',
              },
            ]}
          >
            {image ? (
              <View style={localStyles.previewContainer}>
                <Image 
                  source={{ uri: image }} 
                  style={[
                    localStyles.preview,
                    { height: previewHeight }
                  ]} 
                  resizeMode="cover"
                />
                <View style={[
                  localStyles.imageActions,
                  { 
                    backgroundColor: theme === 'dark' 
                      ? colors.backgroundSecondary 
                      : '#F8FAFC',
                    flexDirection: orientation === 'PORTRAIT' || isTablet 
                      ? 'row' 
                      : isSmallDevice 
                        ? 'column' 
                        : 'row'
                  }
                ]}>
                  <Button
                    title="Change Photo"
                    onPress={pickImage}
                    variant="outlined"
                    size="small"
                    disabled={uploading}
                    style={[
                      localStyles.imageActionButton,
                      orientation === 'LANDSCAPE' && !isTablet && isSmallDevice 
                        ? { marginBottom: verticalScale(8) } 
                        : {}
                    ]}
                  />
                  <Button
                    title="Upload"
                    onPress={uploadImage}
                    disabled={uploading}
                    loading={uploading}
                    size="small"
                    style={localStyles.imageActionButton}
                  />
                </View>
              </View>
            ) : (
              <View style={localStyles.uploadBox}>
                <IDCardIcon 
                  size={moderateScale(isTablet ? 80 : 60)} 
                  color={colors.textSecondary} 
                />
                <Text 
                  variant={isTablet ? "headingMedium" : "headingSmall"} 
                  style={localStyles.uploadText}
                >
                  Upload Student ID
                </Text>
                <Text 
                  variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                  color={colors.textSecondary} 
                  style={localStyles.uploadSubtext}
                >
                  Take a clear photo of your student ID card
                </Text>
                <View style={[
                  localStyles.uploadActions,
                  orientation === 'LANDSCAPE' && !isTablet && isSmallDevice 
                    ? { flexDirection: 'column' } 
                    : {}
                ]}>
                  <Button
                    title="Take Photo"
                    onPress={takePicture}
                    icon={<CameraIcon size={moderateScale(20)} color={colors.buttonText} />}
                    iconPosition="left"
                    style={[
                      localStyles.uploadButton,
                      orientation === 'LANDSCAPE' && !isTablet && isSmallDevice 
                        ? { marginBottom: verticalScale(8), marginHorizontal: 0 } 
                        : {}
                    ]}
                  />
                  <Button
                    title="Choose File"
                    onPress={pickImage}
                    variant="outlined"
                    style={[
                      localStyles.uploadButton,
                      orientation === 'LANDSCAPE' && !isTablet && isSmallDevice 
                        ? { marginHorizontal: 0 } 
                        : {}
                    ]}
                  />
                </View>
              </View>
            )}
          </Animated.View>
          
          {/* Success State */}
          <Animated.View 
            style={[
              localStyles.successContainer,
              { 
                opacity: successAnim,
                display: success ? 'flex' : 'none',
              },
            ]}
          >
            <View style={localStyles.successContent}>
              <Animated.View 
                style={[
                  localStyles.checkmarkCircle,
                  { 
                    backgroundColor: colors.success,
                    transform: [{ scale: checkmarkScale }],
                    width: moderateScale(80),
                    height: moderateScale(80),
                    borderRadius: moderateScale(40),
                  },
                ]}
              >
                <CheckIcon size={moderateScale(40)} color="white" />
              </Animated.View>
              <Text 
                variant={isTablet ? "headingLarge" : "headingMedium"} 
                style={localStyles.successTitle}
              >
                Upload Successful!
              </Text>
              <Text 
                variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                color={colors.textSecondary} 
                style={localStyles.successText}
              >
                Your student ID has been submitted for verification. We'll review it shortly. You'll be notified when your account is approved.
              </Text>
              <Button
                title="Back to Login"
                onPress={goToLogin}
                fullWidth
                style={localStyles.successButton}
              />
            </View>
          </Animated.View>
          
          {/* Guidelines and Tips */}
          <View style={[
            localStyles.guidelinesContainer, 
            { display: success ? 'none' : 'flex' }
          ]}>
            <Text 
              variant={isTablet ? "titleMedium" : "labelLarge"} 
              style={localStyles.guidelinesTitle}
            >
              Tips for a successful verification:
            </Text>
            <View style={localStyles.guideline}>
              <View style={[localStyles.guidelineDot, { backgroundColor: colors.primary }]} />
              <Text 
                variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                color={colors.textSecondary}
              >
                Ensure all text is clearly visible
              </Text>
            </View>
            <View style={localStyles.guideline}>
              <View style={[localStyles.guidelineDot, { backgroundColor: colors.primary }]} />
              <Text 
                variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                color={colors.textSecondary}
              >
                Make sure your name and student ID are readable
              </Text>
            </View>
            <View style={localStyles.guideline}>
              <View style={[localStyles.guidelineDot, { backgroundColor: colors.primary }]} />
              <Text 
                variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                color={colors.textSecondary}
              >
                Include the university logo or name if possible
              </Text>
            </View>
            <View style={localStyles.guideline}>
              <View style={[localStyles.guidelineDot, { backgroundColor: colors.primary }]} />
              <Text 
                variant={isTablet ? "bodyLarge" : "bodyMedium"} 
                color={colors.textSecondary}
              >
                Avoid glare or shadows on the ID card
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
};

const localStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: verticalScale(16),
    marginBottom: verticalScale(16),
  },
  themeToggle: {
    padding: verticalScale(8),
  },
  progressContainer: {
    marginBottom: verticalScale(24),
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: '#E2E8F0',
    borderRadius: verticalScale(3),
    marginBottom: verticalScale(8),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: verticalScale(3),
  },
  contentContainer: {
    width: '100%',
  },
  title: {
    marginBottom: verticalScale(8),
  },
  subtitle: {
    marginBottom: verticalScale(24),
  },
  uploadContainer: {
    width: '100%',
    marginBottom: verticalScale(24),
  },
  uploadBox: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    padding: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(250),
  },
  uploadText: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  uploadSubtext: {
    textAlign: 'center',
    marginBottom: verticalScale(24),
    paddingHorizontal: horizontalScale(16),
  },
  uploadActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    marginHorizontal: horizontalScale(8),
  },
  previewContainer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  preview: {
    width: '100%',
    // Height is dynamically set in the component
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: moderateScale(16),
  },
  imageActionButton: {
    flex: 1,
    marginHorizontal: horizontalScale(8),
  },
  guidelinesContainer: {
    marginTop: verticalScale(24),
    paddingHorizontal: horizontalScale(8),
  },
  guidelinesTitle: {
    marginBottom: verticalScale(16),
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  guidelineDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginRight: horizontalScale(12),
  },
  successContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(32),
  },
  successContent: {
    alignItems: 'center',
    maxWidth: horizontalScale(300),
  },
  checkmarkCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(24),
    // Width, height and borderRadius are set in the component
  },
  successTitle: {
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  successButton: {
    marginTop: verticalScale(24),
    minWidth: horizontalScale(200),
  },
});

export default OnboardingDocumentScreen;