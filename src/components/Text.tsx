import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TEXT_STYLES } from '../constants/typography';

export type TextVariant = 
  | 'displayLarge'
  | 'displayMedium'
  | 'displaySmall'
  | 'headingLarge'
  | 'headingMedium'
  | 'headingSmall'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall'
  | 'button'
  | 'buttonSmall';

interface TextProps extends Omit<RNTextProps, 'style'> {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  italic?: boolean;
  underline?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color,
  align,
  weight,
  italic,
  underline,
  style,
  children,
  ...rest
}) => {
  const { colors } = useTheme();
  
  // Ensure variant is one of the allowed variants
  const safeVariant: TextVariant = TEXT_STYLES[variant] ? variant : 'bodyMedium';
  
  // Get base style for the variant
  const variantStyle = TEXT_STYLES[safeVariant];
  
  // Combine all styles
  const textStyles: StyleProp<TextStyle> = [
    variantStyle as TextStyle,
    {
      color: color || colors.text,
      textAlign: align,
      fontWeight: weight || variantStyle.fontWeight,
      fontStyle: italic ? 'italic' : 'normal',
      textDecorationLine: underline ? 'underline' : 'none',
    } as TextStyle,
    style,
  ];
  
  return (
    <RNText style={textStyles} {...rest}>
      {children}
    </RNText>
  );
};

export default Text;