import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import SubscriptionScreen from './src/screens/SubscriptionScreen';

// Components
import FloatingTabBar from './src/components/FloatingTabBar';
import { LoadingScreen } from './src/components/LoadingScreen';

// Services
import ApiService from './src/services/ApiService';

// Theme context
import { ThemeProvider } from './src/context/ThemeContext';

// Icons
import { 
  HomeIcon, 
  ExploreIcon, 
  EventIcon, 
  ProfileIcon 
} from './src/components/NavigationIcons';
import MerchantProfileScreen from './src/screens/MerchantProfileScreen';
import RedemptionSuccessScreen from './src/screens/RedemptionSuccessScreen';
import ActiveRedemptionsScreen from './src/screens/ActiveRedemptionsScreen';
import RedemptionHistoryScreen from './src/screens/RedemptionHistoryScreen';


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

export type RootStackParamList = {
  AuthStack: undefined;
  OnboardingStack: undefined;
  MainTabs: undefined;
  Login: undefined;
  SignUp: undefined;
  OnboardingWelcome: undefined;
  OnboardingVerification: undefined;
  OnboardingDocument: undefined;
  VerificationStatus: undefined;
  Home: undefined;
  Explore: undefined;
  Events: undefined;
  Profile: undefined;
  DiscountDetails: { discountId: string };
  Subscription: undefined;
  ActiveRedemptions: { redemptionId: string };
  RedemptionHistory: undefined;
  // Add these missing routes:
  MerchantProfile: { merchantId: string };
  RedemptionSuccess: RedemptionSuccessParams;
};


// Create navigation stacks
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<RootStackParamList>();
const OnboardingStack = createStackNavigator<RootStackParamList>();

// Auth stack navigator
const AuthStackNavigator = () => (
  <AuthStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: false
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

// Onboarding stack navigator
const OnboardingStackNavigator = () => (
  <OnboardingStack.Navigator 
    screenOptions={{ 
      headerShown: false,
      gestureEnabled: false
    }}
  >
    <OnboardingStack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
    <OnboardingStack.Screen name="OnboardingVerification" component={OnboardingVerificationScreen} />
    <OnboardingStack.Screen name="OnboardingDocument" component={OnboardingDocumentScreen} />
    <OnboardingStack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
  </OnboardingStack.Navigator>
);

// Main tab navigator
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
    }}
    tabBar={props => <FloatingTabBar {...props} />}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <HomeIcon color={color} size={size} filled={focused} />
        )
      }}
    />
    <Tab.Screen 
      name="Explore" 
      component={ExploreScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <ExploreIcon color={color} size={size} filled={focused} />
        )
      }}
    />
    <Tab.Screen 
      name="Events" 
      component={EventsScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <EventIcon color={color} size={size} filled={focused} />
        )
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{
        tabBarIcon: ({ color, size, focused }) => (
          <ProfileIcon color={color} size={size} filled={focused} />
        )
      }}
    />
  </Tab.Navigator>
);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const isUserLoggedIn = await ApiService.isLoggedIn();
        setIsLoggedIn(isUserLoggedIn);

        if (isUserLoggedIn) {
          // Check if user has completed onboarding
          const studentStatus = await ApiService.getStudentStatus();
          
          if (studentStatus.success && studentStatus.data) {
            // User has started onboarding
            setIsOnboardingCompleted(true);
            
            // Check if user is verified
            setIsVerified(
              studentStatus.data.isVerified && 
              studentStatus.data.status === 'VERIFIED'
            );
          } else {
            // User has not started onboarding
            setIsOnboardingCompleted(false);
            setIsVerified(false);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: false
          }}
        >
          {!isLoggedIn ? (
            // Not logged in - show auth flow
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            ) : !isOnboardingCompleted ? (
            // Logged in but onboarding not completed
            <Stack.Screen name="OnboardingStack" component={OnboardingStackNavigator} />
          ) : !isVerified ? (
            // Onboarding completed but not verified
            <Stack.Screen 
              name="VerificationStatus" 
              component={VerificationStatusScreen}
              options={{ gestureEnabled: false }}
            />
          ) : (
            // Fully verified user
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen 
                name="DiscountDetails" 
                component={DiscountDetailsScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen 
                name="MerchantProfile"
                component={MerchantProfileScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen 
                name="RedemptionSuccess"
                component={RedemptionSuccessScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen 
                name="ActiveRedemptions"
                component={ActiveRedemptionsScreen}
                options={{ gestureEnabled: true }}
              />
              <Stack.Screen 
                name="RedemptionHistory"
                component={RedemptionHistoryScreen}
                options={{ gestureEnabled: true }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;