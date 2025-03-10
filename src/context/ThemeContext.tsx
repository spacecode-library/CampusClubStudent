import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTheme, getColors, ThemeColors } from '../constants/colors';
import { getGlobalStyles } from '../constants/globalStyles';

type ThemeContextType = {
  theme: ColorTheme;
  colors: ThemeColors;
  styles: ReturnType<typeof getGlobalStyles>;
  toggleTheme: () => void;
  setTheme: (theme: ColorTheme) => void;
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark', // Default to dark theme as requested
  colors: getColors('dark'),
  styles: getGlobalStyles('dark'),
  toggleTheme: () => {},
  setTheme: () => {},
});

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = '@campusclub:theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const deviceTheme = useColorScheme() as ColorTheme || 'light';
  
  // State for the current theme
  const [theme, setThemeState] = useState<ColorTheme>('dark'); // Default to dark theme
  
  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeState(savedTheme as ColorTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme preference when it changes
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        console.error('Failed to save theme preference', error);
      }
    };
    
    saveTheme();
  }, [theme]);
  
  // Get colors and styles for current theme
  const colors = getColors(theme);
  const styles = getGlobalStyles(theme);
  
  // Toggle between light and dark theme
  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Set theme directly
  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, colors, styles, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;