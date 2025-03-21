import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
  ViewStyle,
  TextStyle,
  Platform,
  KeyboardTypeOptions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { FONTS, FONT_SIZE } from '../constants/typography';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  containerStyle?: ViewStyle;
  cellStyle?: ViewStyle;
  cellActiveStyle?: ViewStyle;
  cellFilledStyle?: ViewStyle;
  cellErrorStyle?: ViewStyle;
  textStyle?: TextStyle;
  error?: boolean;
  secure?: boolean;
  onComplete?: (text: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
  length = 4,
  value,
  onChangeText,
  disabled = false,
  autoFocus = false,
  keyboardType = 'numeric',
  containerStyle,
  cellStyle,
  cellActiveStyle,
  cellFilledStyle,
  cellErrorStyle,
  textStyle,
  error = false,
  secure = false,
  onComplete,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  // Create animated values for shake animation
  const shakeAnimations = Array(length)
    .fill(0)
    .map(() => useSharedValue(0));
  
  useEffect(() => {
    if (error) {
      // Play shake animation for each cell when error occurs
      shakeAnimations.forEach((anim) => {
        anim.value = withSequence(
          withTiming(5, { duration: 50, easing: Easing.linear }),
          withTiming(-5, { duration: 50, easing: Easing.linear }),
          withTiming(5, { duration: 50, easing: Easing.linear }),
          withTiming(-5, { duration: 50, easing: Easing.linear }),
          withTiming(0, { duration: 50, easing: Easing.linear })
        );
      });
    }
  }, [error, shakeAnimations]);
  
  useEffect(() => {
    // Call onComplete when the OTP is filled
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);
  
  const handleFocus = () => {
    inputRef.current?.focus();
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // This is the masked value when secure is true
  const getMaskedValue = () => {
    return secure ? value.replace(/./g, '•') : value;
  };
  
  const maskedValue = getMaskedValue();
  
  // Render individual cells
  const renderCells = () => {
    const cells = [];
    
    for (let i = 0; i < length; i++) {
      const isCellFocused = isFocused && i === value.length;
      const isCellFilled = i < value.length;
      
      // Create animated style for shake effect
      const animatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ translateX: shakeAnimations[i].value }],
        };
      });
      
      cells.push(
        <Animated.View
          key={i}
          style={[
            styles.cell,
            {
              borderColor: error
                ? colors.error
                : isCellFocused
                ? colors.primary
                : isCellFilled
                ? colors.primary
                : colors.border,
              backgroundColor: colors.inputBackground,
            },
            cellStyle,
            isCellFocused && [
              styles.cellActive,
              { borderColor: colors.primary },
              cellActiveStyle,
            ],
            isCellFilled && [
              styles.cellFilled,
              { borderColor: colors.primary },
              cellFilledStyle,
            ],
            error && [
              styles.cellError,
              { borderColor: colors.error },
              cellErrorStyle,
            ],
            animatedStyle,
          ]}
        >
          <Animated.Text
            style={[
              styles.cellText,
              { color: colors.text },
              textStyle,
            ]}
          >
            {maskedValue[i] || ''}
          </Animated.Text>
          {isCellFocused && (
            <View
              style={[
                styles.cursor,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </Animated.View>
      );
    }
    
    return cells;
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.cellsContainer}>
        {renderCells()}
      </View>
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={(text) => {
          // Only allow the specified length and filter based on keyboardType
          let filteredText = text;
          if (keyboardType === 'numeric') {
            filteredText = text.replace(/[^0-9]/g, '');
          } else if (keyboardType === 'email-address') {
            filteredText = text.replace(/[^a-zA-Z0-9@._-]/g, '');
          }
          
          if (filteredText.length <= length) {
            onChangeText(filteredText);
          }
        }}
        keyboardType={keyboardType}
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={!disabled}
        caretHidden
      />
      <View
        style={styles.touchable}
        onTouchStart={handleFocus}
        pointerEvents={disabled ? 'none' : 'auto'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginVertical: SPACING.sm,
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280, // Adjust based on your design
  },
  cell: {
    width: 50,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderWidth: 2,
  },
  cellFilled: {
    borderWidth: 1.5,
  },
  cellError: {
    borderWidth: 1.5,
  },
  cellText: {
    fontSize: FONT_SIZE.xxl,
    fontFamily: FONTS.medium,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: 'black',
    opacity: 0.7,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  touchable: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default OtpInput;