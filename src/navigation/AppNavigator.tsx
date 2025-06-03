import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import FoodScreen from '../screens/FoodScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FoodCameraScreen from '../screens/FoodCameraScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import WorkoutLogScreen from '../screens/WorkoutLogScreen';
import BiomarkersScreen from '../screens/BiomarkersScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { BottomTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Theme colors
const lightTheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
  card: '#F2F2F7',
  text: '#000000',
  border: '#C6C6C8',
  notification: '#FF3B30',
  tabBarActive: '#007AFF',
  tabBarInactive: '#8E8E93',
};

const darkTheme = {
  primary: '#0A84FF',
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  border: '#38383A',
  notification: '#FF453A',
  tabBarActive: '#0A84FF',
  tabBarInactive: '#8E8E93',
};

function MainTabNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Food':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            case 'Workout':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Progress':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.text,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.primary,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: '🏥 HealthTracker Pro',
        }}
      />
      <Tab.Screen 
        name="Food" 
        component={FoodScreen}
        options={{
          title: 'Nutrition',
          headerTitle: '🍎 Food Tracking',
        }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen}
        options={{
          title: 'Fitness',
          headerTitle: '💪 Workouts',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          title: 'Progress',
          headerTitle: '📈 Progress',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: '👤 Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const navigationTheme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.notification,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            color: theme.text,
            fontSize: 18,
            fontWeight: '600',
          },
          headerTintColor: theme.primary,
          gestureEnabled: true,
          cardStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FoodCamera" 
          component={FoodCameraScreen}
          options={{
            title: '📸 Scan Food',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="AddFood" 
          component={AddFoodScreen}
          options={{
            title: '➕ Add Food',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="WorkoutLog" 
          component={WorkoutLogScreen}
          options={{
            title: '🏃‍♂️ Log Workout',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="WorkoutSession" 
          component={WorkoutSessionScreen}
          options={{
            title: '💪 Active Workout',
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="Biomarkers" 
          component={BiomarkersScreen}
          options={{
            title: '🩺 Biomarkers',
          }}
        />
        <Stack.Screen 
          name="Goals" 
          component={GoalsScreen}
          options={{
            title: '🎯 Goals',
          }}
        />
        <Stack.Screen 
          name="Reports" 
          component={ReportsScreen}
          options={{
            title: '📊 Health Reports',
          }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: '⚙️ Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator; 