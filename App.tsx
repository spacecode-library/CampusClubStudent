import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import OnboardingWelcomeScreen from './src/screens/OnboardingWelcomeScreen';
import OnboardingVerificationScreen from './src/screens/OnboardingVerificationScreen';
import OnboardingDocumentScreen from './src/screens/OnboardingDocumentScreen';
import VerificationStatusScreen from './src/screens/VerificationStatusScreen';

import HomeScreen from './src/screens/HomeScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import EventsScreen from './src/screens/EventsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import DiscountDetailsScreen from './src/screens/DiscountDetailsScreen';
import MerchantProfileScreen from './src/screens/MerchantProfileScreen';
import RedemptionSuccessScreen from './src/screens/RedemptionSuccessScreen';
import ActiveRedemptionsScreen from './src/screens/ActiveRedemptionsScreen';
import RedemptionHistoryScreen from './src/screens/RedemptionHistoryScreen';

// Event Screens
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import EditEventScreen from './src/screens/EditEventScreen';
import EventsListScreen from './src/screens/EventsListScreen';
import EventAttendeesScreen from './src/screens/EventAttendeesScreen';

// Components
import FloatingTabBar from './src/components/FloatingTabBar';
import { LoadingScreen } from './src/components/LoadingScreen';

// Services
import ApiService from './src/services/ApiService';

// Theme context
import { ThemeProvider } from './src/context/ThemeContext';

// Icons for Tab Navigation
import { 
  HomeIcon, 
  ExploreIcon, 
  EventIcon, 
  ProfileIcon 
} from './src/components/NavigationIcons';

//
// Types for Navigation
//

export interface RedemptionSuccessParams {
  redemptionId: string;
  discountTitle: string;
  discountPercentage: number;
  merchantName?: string;
  merchantLogo?: string;
  redemptionCode: string;
  isOnline: boolean;
  storeLink?: string;
  expirationDate?: string;
}

// Fix for navigation type issues
export type RootStackParamList = {
  // Authentication Screens
  Login: undefined;
  SignUp: undefined;
  // Onboarding Screens
  OnboardingWelcome: undefined;
  OnboardingVerification: undefined;
  OnboardingDocument: undefined;
  VerificationStatus: undefined;
  // Main App Screens
  MainTabs: undefined; // This screen renders the Tab Navigator
  DiscountDetails: { discountId: string };
  Subscription: undefined;
  MerchantProfile: { merchantId: string };
  RedemptionSuccess: RedemptionSuccessParams;
  ActiveRedemptions: { redemptionId: string };
  RedemptionHistory: undefined;
  // Event Screens
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventsList: { status: 'UPCOMING' | 'LIVE' | 'COMPLETED' };
  EventAttendees: { eventId: string };
  // Individual tab screens (needed for type safety)
  Home: undefined;
  Explore: undefined;
  Events: undefined;
  Profile: undefined;
};

// Define a separate TabParamList for bottom tabs
export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Events: undefined;
  Profile: undefined;
};

//
// Create Navigators
//

// Create a Bottom Tab Navigator for the main app screens.
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
    }}
    tabBar={(props) => <FloatingTabBar {...props} />}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <HomeIcon color={color} size={size} filled={focused} />
        ),
      }}
    />
    <Tab.Screen 
      name="Explore" 
      component={ExploreScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <ExploreIcon color={color} size={size} filled={focused} />
        ),
      }}
    />
    <Tab.Screen 
      name="Events" 
      component={EventsScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <EventIcon color={color} size={size} filled={focused} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <ProfileIcon color={color} size={size} filled={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Create the Root Stack Navigator
const Stack = createStackNavigator<RootStackParamList>();

//
// App Component
//

const App = () => {
  // Local state to hold authentication and onboarding status.
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check authentication status and user onboarding status
    const checkAuth = async () => {
      try {
        console.log('Starting authentication check...');
        
        // First, check if the user is logged in
        const isUserLoggedIn = await ApiService.isLoggedIn();
        console.log('User logged in status:', isUserLoggedIn);
        setIsLoggedIn(isUserLoggedIn);

        if (isUserLoggedIn) {
          try {
            // Only attempt to get student status if user is logged in
            console.log('Fetching student status...');
            const studentStatus = await ApiService.getStudentStatus();
            console.log('Student status response:', studentStatus);
            
            if (studentStatus.success && studentStatus.data) {
              // User has started onboarding
              setIsOnboardingCompleted(true);
              // Set verified flag if the user is verified
              setIsVerified(
                studentStatus.data.isVerified && 
                studentStatus.data.status === 'VERIFIED'
              );
              console.log('Student verification status:', studentStatus.data.isVerified, studentStatus.data.status);
            } else {
              // Student status failed but user is logged in - they need to complete onboarding
              setIsOnboardingCompleted(false);
              setIsVerified(false);
              
              // If there's a specific message, log it
              if (studentStatus.message) {
                console.warn('Student status warning:', studentStatus.message);
              }
            }
          } catch (statusError) {
            // Error getting student status - likely needs to complete onboarding
            console.error('Error fetching student status:', statusError);
            setIsOnboardingCompleted(false);
            setIsVerified(false);
            
            // If it's a parsing error, the API might be returning non-JSON
            if (statusError instanceof SyntaxError) {
              console.error('JSON parsing error - API may be returning non-JSON response');
              setHasError(true);
              setErrorMessage('Server returned an invalid response. Please try again later.');
              // Force logout on critical API errors
              await ApiService.logout();
              setIsLoggedIn(false);
            }
          }
        } else {
          // User is not logged in, reset other state
          setIsOnboardingCompleted(false);
          setIsVerified(false);
        }
      } catch (error: any) {
        console.error('Auth check critical error:', error);
        
        // Handle critical errors - set error state
        setHasError(true);
        setErrorMessage(error.message || 'Authentication check failed');
        
        // Default to not logged in for safety
        setIsLoggedIn(false);
        setIsOnboardingCompleted(false);
        setIsVerified(false);
        
        // Force logout on critical errors
        try {
          await ApiService.logout();
        } catch (logoutError) {
          console.error('Error during forced logout:', logoutError);
        }
      } finally {
        // Always finish loading
        setIsLoading(false);
        console.log('Authentication check completed');
      }
    };

    checkAuth();
  }, []);

  // Show a loading screen while checking auth status
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If there was a critical error during auth check, we can show an error
  // but still proceed to the login screen
  if (hasError) {
    // Show an alert about the error but continue to the login screen
    setTimeout(() => {
      Alert.alert(
        'Connection Error',
        errorMessage || 'Could not connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }, 500);
  }

  // Choose initial route based on the authentication and onboarding status.
  // Default to Login when not authenticated
  let initialRoute: keyof RootStackParamList = 'Login';
  
  // Only change route if we're actually logged in
  if (isLoggedIn) {

    

    if (!isOnboardingCompleted) {
      initialRoute = 'OnboardingWelcome';
    } else if (!isVerified) {
      initialRoute = 'VerificationStatus';
    } else {
      initialRoute = 'MainTabs';
    }
  }
  
  console.log('Navigation route determined:', { 
    isLoggedIn, 
    isOnboardingCompleted, 
    isVerified, 
    initialRoute 
  });

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          {/* Authentication Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />

          {/* Onboarding Screens */}
          <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
          <Stack.Screen name="OnboardingVerification" component={OnboardingVerificationScreen} />
          <Stack.Screen name="OnboardingDocument" component={OnboardingDocumentScreen} />
          <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />

          {/* Main Application */}
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="DiscountDetails" component={DiscountDetailsScreen} />
          <Stack.Screen name="Subscription" component={MainTabNavigator} />
          <Stack.Screen name="MerchantProfile" component={MerchantProfileScreen} />
          <Stack.Screen name="RedemptionSuccess" component={RedemptionSuccessScreen} />
          <Stack.Screen name="ActiveRedemptions" component={ActiveRedemptionsScreen} />
          <Stack.Screen name="RedemptionHistory" component={RedemptionHistoryScreen} />
          
          {/* Event Screens */}
          <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="EditEvent" component={EditEventScreen} />
          <Stack.Screen name="EventsList" component={EventsListScreen} />
          <Stack.Screen name="EventAttendees" component={EventAttendeesScreen} />

          {/* Individual tab screens (needed for type access but not used in navigation) */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Explore" component={ExploreScreen} />
          <Stack.Screen name="Events" component={EventsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;