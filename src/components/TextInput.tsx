// src/components/TextInput.tsx
import React, { forwardRef, useRef, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Text from './Text';
import { SPACING, BORDER_RADIUS } from '../constants/globalStyles';
import { moderateScale } from '../utils/responsiveUtils';

interface TextInputProps extends RNTextInputProps {
  error?: string | boolean;
  errorText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  touched?: boolean;
  helperText?: string;
}

const TextInput = forwardRef<RNTextInput, TextInputProps>(
  (
    {
      error,
      errorText,
      containerStyle,
      inputStyle,
      leftIcon,
      rightIcon,
      label,
      touched,
      helperText,
      ...props
    },
    ref
  ) => {
    const { colors, theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    const handleFocus = () => {
      setIsFocused(true);
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      props.onFocus && props.onFocus({} as any);
    };

    const handleBlur = () => {
      setIsFocused(false);
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      props.onBlur && props.onBlur({} as any);
    };

    const borderColor = error
      ? colors.error
      : isFocused
      ? colors.primary
      : colors.border;

    const backgroundColor = theme === 'dark' 
      ? `${colors.backgroundSecondary}` 
      : `${colors.card}`;

    const textColor = props.editable === false
      ? colors.textSecondary
      : colors.text;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text
            variant="bodyMedium"
            color={error ? colors.error : colors.text}
            style={styles.label}
          >
            {label}
          </Text>
        )}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor,
              borderColor,
              borderWidth: error || isFocused ? 1.5 : 1,
            },
          ]}
        >
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: textColor,
                paddingLeft: leftIcon ? 0 : SPACING.md,
                paddingRight: rightIcon ? 0 : SPACING.md,
              },
              inputStyle,
            ]}
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.primary}
            autoCapitalize="none"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </View>
        {(error && errorText) || helperText ? (
          <Text
            variant="bodySmall"
            color={error ? colors.error : colors.textSecondary}
            style={styles.helperText}
          >
            {error ? errorText : helperText}
          </Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  label: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    minHeight: moderateScale(48),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 0,
    minHeight: moderateScale(48),
  },
  iconContainer: {
    paddingHorizontal: SPACING.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TextInput;