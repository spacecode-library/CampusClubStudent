import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { AlertCircleIcon, XIcon } from './icons';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onDismiss: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = 'Error',
  message,
  onDismiss,
}) => {
  const { colors, theme } = useTheme();
  const { height } = Dimensions.get('window');
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity, height]);
  
  // Handle background press (dismiss modal)
  const handleBackdropPress = () => {
    onDismiss();
  };
  
  // Stop propagation of touches on the content
  const handleContentPress = (e: any) => {
    e.stopPropagation();
  };
  
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(0, 0, 0, 0.5)',
            opacity: backdropOpacity,
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={handleContentPress}>
              <Animated.View
                style={[
                  styles.content,
                  {
                    backgroundColor: colors.card,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.header}>
                  <View style={styles.titleContainer}>
                    <AlertCircleIcon size={24} color={colors.error} style={styles.icon} />
                    <Text variant="titleSmall" color={colors.text}>
                      {title}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                    <XIcon size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.body}>
                  <Text variant="bodyMedium" color={colors.textSecondary} style={styles.message}>
                    {message}
                  </Text>
                </View>
                
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onDismiss}
                  >
                    <Text variant="labelMedium" color={colors.buttonText}>
                      OK
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  message: {
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.sm,
  },
});

export default ErrorModal;