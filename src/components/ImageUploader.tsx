import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { FONTS, FONT_SIZE } from '../constants/typography';
import { CameraIcon } from './icons';
import Card from './Card';

// Create animated TouchableOpacity
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ImageUploaderProps {
  onImageSelected: (imageUri: string, imageData?: Asset) => void;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  imageUrl?: string;
  loading?: boolean;
  error?: string;
  maxSize?: number; // in MB
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  textStyle?: StyleProp<TextStyle>;
  errorTextStyle?: StyleProp<TextStyle>;
  showCameraOption?: boolean;
  cameraPermissionPrompt?: string;
  onImageRemove?: () => void;
  acceptedTypes?: string[]; // e.g. ['image/jpeg', 'image/png']
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  title = 'Upload Image',
  subtitle = 'Tap to upload an image',
  placeholder = 'No image selected',
  imageUrl,
  loading = false,
  error,
  maxSize = 10, // Default 10MB
  style,
  imageStyle,
  textStyle,
  errorTextStyle,
  showCameraOption = true,
  cameraPermissionPrompt = 'This app needs access to your camera to take pictures',
  onImageRemove,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'],
}) => {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(imageUrl || null);
  const scale = useSharedValue(1);
  
  // Handle press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 20,
      stiffness: 300,
    });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 300,
    });
  };
  
  // Animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  // Request camera permission (Android)
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: cameraPermissionPrompt,
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };
  
  // Handle image selection
  const handleImageSelection = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }
    
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'There was an error selecting the image');
      return;
    }
    
    const asset = response.assets?.[0];
    
    if (!asset) {
      Alert.alert('Error', 'No image data found');
      return;
    }
    
    // Check file type
    if (acceptedTypes.length > 0 && asset.type && !acceptedTypes.includes(asset.type)) {
      Alert.alert('Invalid file type', `Please select a file of type: ${acceptedTypes.join(', ')}`);
      return;
    }
    
    // Check file size
    if (maxSize > 0 && asset.fileSize) {
      const fileSizeInMB = asset.fileSize / (1024 * 1024);
      if (fileSizeInMB > maxSize) {
        Alert.alert('File too large', `Please select an image smaller than ${maxSize}MB`);
        return;
      }
    }
    
    setSelectedImage(asset.uri || null);
    onImageSelected(asset.uri || '', asset);
  };
  
  // Open image picker
  const openImagePicker = () => {
    launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    }, handleImageSelection);
  };
  
  // Open camera
  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Camera permission is required to take pictures');
      return;
    }
    
    launchCamera({
      mediaType: 'photo',
      includeBase64: false,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    }, handleImageSelection);
  };
  
// Show options dialog
const showImageSourceOptions = () => {
  Alert.alert(
    'Select Image Source',
    'Where would you like to get the image from?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Photo Library',
        onPress: openImagePicker,
      },
      ...(showCameraOption
        ? [
            {
              text: 'Camera',
              onPress: openCamera,
            },
          ]
        : []),
      ...(selectedImage && onImageRemove
        ? [
            {
              text: 'Remove Current Image',
              onPress: () => {
                setSelectedImage(null);
                onImageRemove();
              },
              style: 'destructive' as const,
            },
          ]
        : []),
    ]
  );
};
  
  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text
          style={[
            styles.title,
            { color: colors.text },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
      
      <AnimatedTouchable
        style={[
          styles.uploaderContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: error ? colors.error : colors.border,
          },
          animatedStyle,
        ]}
        onPress={showImageSourceOptions}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={styles.loader}
          />
        ) : selectedImage ? (
          // Image preview
          <Image
            source={{ uri: selectedImage }}
            style={[
              styles.image,
              imageStyle,
            ]}
            resizeMode="cover"
          />
        ) : (
          // Upload placeholder
          <View style={styles.placeholderContainer}>
            <CameraIcon
              size={40}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
                textStyle,
              ]}
            >
              {subtitle}
            </Text>
            <Text
              style={[
                styles.placeholder,
                { color: colors.textTertiary },
              ]}
            >
              {placeholder}
            </Text>
          </View>
        )}
      </AnimatedTouchable>
      
      {error && (
        <Text
          style={[
            styles.errorText,
            { color: colors.error },
            errorTextStyle,
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  uploaderContainer: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.medium,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.medium,
    marginTop: SPACING.xs,
  },
  loader: {
    padding: SPACING.md,
  },
});

export default ImageUploader;