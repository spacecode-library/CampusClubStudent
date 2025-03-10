import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/globalStyles';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  padded?: boolean;
  safeArea?: boolean;
  statusBarStyle?: 'light-content' | 'dark-content';
  backgroundStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  keyboardAvoiding = true,
  padded = true,
  safeArea = true,
  statusBarStyle,
  backgroundStyle,
  contentContainerStyle,
}) => {
  const { colors, theme } = useTheme();
  
  // Determine status bar style based on theme if not explicitly provided
  const barStyle = statusBarStyle || (theme === 'dark' ? 'light-content' : 'dark-content');
  
  // Base background style
  const baseBackgroundStyle = {
    backgroundColor: colors.background,
    flex: 1,
  };
  
  // Padding for the content
  const paddingStyle = padded ? { padding: SPACING.lg } : undefined;
  
  // Render content based on scrollable and keyboardAvoiding props
  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            paddingStyle,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      );
    }
    
    return (
      <View style={[styles.innerContainer, paddingStyle, contentContainerStyle]}>
        {children}
      </View>
    );
  };
  
  // Wrap content with KeyboardAvoidingView if needed
  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  ) : (
    renderContent()
  );
  
  // Use SafeAreaView if requested
  if (safeArea) {
    return (
      <View style={[baseBackgroundStyle, backgroundStyle]}>
        <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={[baseBackgroundStyle, backgroundStyle]}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
  },
});

export default ScreenContainer;