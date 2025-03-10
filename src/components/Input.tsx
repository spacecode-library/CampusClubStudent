import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Animated,
  StyleProp,
  TextInputProps,
  KeyboardTypeOptions,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { FONT_SIZE, FONT_WEIGHT, FONTS } from '../constants/typography';
import { BORDER_RADIUS, SPACING } from '../constants/globalStyles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  secure = false,
  keyboardType = 'default',
  disabled = false,
  value,
  onChangeText,
  placeholder,
  ...restProps
}) => {
  const { colors, theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secure);
  
  // Animation for focus effect
  const [focusAnim] = useState(new Animated.Value(0));
  
  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };
  
  // Interpolate border color and background color for focus animation
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, colors.primary],
  });
  
  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.inputBackground, theme === 'light' ? '#FFFFFF' : colors.backgroundSecondary],
  });
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Animated.Text
          style={[
            styles.label,
            {
              color: isFocused ? colors.primary : colors.textSecondary,
              fontFamily: FONTS.medium,
            },
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor,
          },
          error && styles.errorInput,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            {
              color: disabled ? colors.textTertiary : colors.text,
              paddingLeft: leftIcon ? 0 : SPACING.md,
              flex: 1,
            },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secure && !isPasswordVisible}
          keyboardType={keyboardType}
          editable={!disabled}
          {...restProps}
        />
        
        {secure && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Text style={{ color: colors.primary, fontSize: FONT_SIZE.sm }}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && (
        <Animated.Text
          style={[
            styles.errorText,
            {
              color: colors.error,
            },
            errorStyle,
          ]}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium as any,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    overflow: 'hidden',
  },
  input: {
    fontSize: FONT_SIZE.md,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
    fontFamily: FONTS.regular,
  },
  leftIcon: {
    paddingHorizontal: SPACING.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    paddingHorizontal: SPACING.md,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorInput: {
    borderWidth: 1,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
});

export default Input;