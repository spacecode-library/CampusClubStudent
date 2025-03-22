export type ColorTheme = 'light' | 'dark';

export interface ThemeColors {
  // Brand colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  onPrimary: string; // Color for text/icons on primary color backgrounds

  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  card: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  buttonText: string;
  
  // Utility colors
  border: string;
  shadow: string;
  overlay: string;
  inputBackground: string;
  placeholder: string;
  
  // Status colors
  error: string;
  success: string;
  warning: string;
  info: string;
  notification: string;
  
  // Special colors
  highlight: string;
  premium: string;
}

const lightColors: ThemeColors = {
  // Brand colors - Indigo-based
  primary: '#5C6BC0',
  primaryDark: '#3949AB',
  primaryLight: '#7986CB',
  onPrimary: '#FFFFFF',
  
  // Secondary colors - Teal-based for youthful accent
  secondary: '#26A69A',
  secondaryDark: '#00897B',
  secondaryLight: '#4DB6AC',
  
  // Accent color for highlights and CTAs
  accent: '#FF5722',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F5F7FA',
  backgroundTertiary: '#EAEEF2',
  card: '#FFFFFF',
  
  // Text colors
  text: '#1E293B',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  buttonText: '#FFFFFF',
  
  // Utility colors
  border: '#E2E8F0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#F8FAFC',
  placeholder: '#94A3B8',
  
  // Status colors
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  notification: '#3B82F6',
  
  // Special colors
  highlight: 'rgba(56, 189, 248, 0.1)',
  premium: '#F59E0B',
};

const darkColors: ThemeColors = {
  // Brand colors - Indigo-based, slightly muted for dark mode
  primary: '#5C6BC0',
  primaryDark: '#3949AB',
  primaryLight: '#7986CB',
  onPrimary: '#FFFFFF',
  
  // Secondary colors - Teal-based, adjusted for dark mode
  secondary: '#26A69A',
  secondaryDark: '#00897B',
  secondaryLight: '#4DB6AC',
  
  // Accent color for highlights and CTAs
  accent: '#FF5722',
  
  // Background colors - Premium dark look with charcoal
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  backgroundTertiary: '#2D2D2D',
  card: '#1E1E1E',
  
  // Text colors
  text: '#E2E8F0',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  buttonText: '#FFFFFF',
  
  // Utility colors
  border: '#334155',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  inputBackground: '#262626',
  placeholder: '#6B7280',
  
  // Status colors - slightly desaturated for dark mode
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  notification: '#60A5FA',
  
  // Special colors
  highlight: 'rgba(56, 189, 248, 0.15)',
  premium: '#FBBF24',
};

export const getColors = (theme: ColorTheme = 'light'): ThemeColors => {
  return theme === 'light' ? lightColors : darkColors;
};

// Default theme is light
export default getColors('light');