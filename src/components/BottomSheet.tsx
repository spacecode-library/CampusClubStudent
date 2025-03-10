import React, { useCallback, useEffect, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  BackHandler,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { BORDER_RADIUS } from '../constants/globalStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const WINDOW_HEIGHT = Dimensions.get('window').height;
const DEFAULT_HEIGHT = WINDOW_HEIGHT * 0.5;

export interface BottomSheetProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  height?: number | string;
  snapPoints?: string[];
  enableDismissOnBackdropPress?: boolean;
  enableHandleIndicator?: boolean;
  enableDrag?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backdropOpacity?: number;
  avoidKeyboard?: boolean;
}

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
}

const BottomSheet = React.forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      visible,
      onClose,
      height = DEFAULT_HEIGHT,
      snapPoints,
      enableDismissOnBackdropPress = true,
      enableHandleIndicator = true,
      enableDrag = true,
      style,
      contentContainerStyle,
      backdropOpacity = 0.6,
      avoidKeyboard = true,
    },
    ref
  ) => {
    const { colors } = useTheme();
    
    // Calculate content height
    const calculateHeight = useCallback(() => {
      if (typeof height === 'string') {
        if (height.includes('%')) {
          const percentage = parseInt(height.replace('%', '')) / 100;
          return SCREEN_HEIGHT * percentage;
        }
        return parseInt(height) || DEFAULT_HEIGHT;
      }
      return height;
    }, [height]);
    
    // Animation values
    const contentHeight = calculateHeight();
    const translateY = useSharedValue(contentHeight);
    const active = useSharedValue(false);
    const backdropAnimation = useSharedValue(0);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      open: () => {
        active.value = true;
        backdropAnimation.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
      },
      close: () => {
        backdropAnimation.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(contentHeight, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onClose)();
            active.value = false;
          }
        });
      },
    }));
    
    // Handle visibility changes
    useEffect(() => {
      if (visible) {
        active.value = true;
        backdropAnimation.value = withTiming(1, { duration: 300 });
        translateY.value = withTiming(0, { duration: 300 });
      } else {
        backdropAnimation.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(contentHeight, { duration: 300 }, (finished) => {
          if (finished) {
            active.value = false;
          }
        });
      }
    }, [visible, contentHeight, active, translateY, backdropAnimation]);
    
    // Handle back button press
    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (visible) {
          onClose();
          return true;
        }
        return false;
      });
      
      return () => backHandler.remove();
    }, [visible, onClose]);
    
    // Pan gesture handler for dragging
    const gestureHandler = useAnimatedGestureHandler<
      PanGestureHandlerGestureEvent,
      { startY: number }
    >({
      onStart: (_, ctx) => {
        ctx.startY = translateY.value;
      },
      onActive: (event, ctx) => {
        if (enableDrag) {
          const newTranslateY = ctx.startY + event.translationY;
          if (newTranslateY >= 0) {
            translateY.value = newTranslateY;
          }
        }
      },
      onEnd: (event) => {
        if (enableDrag) {
          if (event.velocityY > 500 || event.translationY > contentHeight * 0.3) {
            backdropAnimation.value = withTiming(0, { duration: 300 });
            translateY.value = withTiming(contentHeight, { duration: 300 }, (finished) => {
              if (finished) {
                runOnJS(onClose)();
                active.value = false;
              }
            });
          } else {
            translateY.value = withTiming(0, { duration: 300 });
          }
        }
      },
    });
    
    // Animated styles
    const backdropAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: backdropAnimation.value * backdropOpacity,
        display: active.value ? 'flex' : 'none',
      };
    });
    
    const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
      const borderRadius = interpolate(
        translateY.value,
        [0, contentHeight],
        [BORDER_RADIUS.xl, BORDER_RADIUS.xl],
        Extrapolate.CLAMP
      );
      
      return {
        transform: [{ translateY: translateY.value }],
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
        display: active.value ? 'flex' : 'none',
      };
    });
    
    return (
      <>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: colors.overlay },
            backdropAnimatedStyle,
          ]}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              if (enableDismissOnBackdropPress) {
                onClose();
              }
            }}
          >
            <View style={styles.backdropTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>
        
        {/* Bottom Sheet Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' && avoidKeyboard ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: colors.card,
                height: contentHeight,
              },
              bottomSheetAnimatedStyle,
              style,
            ]}
          >
            <PanGestureHandler onGestureEvent={gestureHandler} enabled={enableDrag}>
              <Animated.View>
                {/* Handle Indicator */}
                {enableHandleIndicator && (
                  <View style={styles.handleContainer}>
                    <View
                      style={[
                        styles.handle,
                        { backgroundColor: colors.textTertiary },
                      ]}
                    />
                  </View>
                )}
                
                {/* Content */}
                <View style={[styles.contentContainer, contentContainerStyle]}>
                  {children}
                </View>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </KeyboardAvoidingView>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  backdropTouchable: {
    width: '100%',
    height: '100%',
  },
  keyboardAvoidingView: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  container: {
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    zIndex: 999,
    overflow: 'hidden',
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
});

export default BottomSheet;