import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import WebCompatibleIcon from '../components/WebCompatibleIcon';

import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CasesScreen from '../screens/CasesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddCaseScreen from '../screens/AddCaseScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import CaseProcessScreen from '../screens/CaseProcessScreen';
import AddEventScreen from '../screens/AddEventScreen';
import AdvancedCalendarScreen from '../screens/AdvancedCalendarScreen';
import AddAdvancedEventScreen from '../screens/AddAdvancedEventScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import EDevletIntegrationScreen from '../screens/EDevletIntegrationScreen';
import ChatScreen from '../screens/ChatScreen';
import LogScreen from '../screens/LogScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

// Hamburger menü sayfaları
import ClientsScreen from '../screens/ClientsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import AddCommunicationScreen from '../screens/AddCommunicationScreen';
import FinancialScreen from '../screens/FinancialScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SearchScreen from '../screens/SearchScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SyncScreen from '../screens/SyncScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CasesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CasesList" 
      component={CasesScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddCase" 
      component={AddCaseScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="CaseDetail" 
      component={CaseDetailScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="CaseProcess" 
      component={CaseProcessScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const CalendarStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CalendarMain" 
      component={AdvancedCalendarScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddEvent" 
      component={AddAdvancedEventScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="EventDetail" 
      component={EventDetailScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Hamburger menü stack navigator'ları
const ClientsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ClientsList" 
      component={ClientsScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddClient" 
      component={AddClientScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ClientDetail" 
      component={ClientDetailScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AddCommunication" 
      component={AddCommunicationScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const FinancialStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="FinancialMain" 
      component={FinancialScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="NotificationsMain" 
      component={NotificationsScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="SearchMain" 
      component={SearchScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const DocumentsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DocumentsMain" 
      component={DocumentsScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

    const SyncStack = () => (
      <Stack.Navigator>
        <Stack.Screen
          name="SyncMain"
          component={SyncScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );

    const ChatStack = () => (
      <Stack.Navigator>
        <Stack.Screen
          name="ChatMain"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );


const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Dashboard') {
                iconName = 'dashboard';
              } else if (route.name === 'Calendar') {
                iconName = 'event';
              } else if (route.name === 'Cases') {
                iconName = 'folder';
              } else if (route.name === 'Profile') {
                iconName = 'person';
              }

              return <WebCompatibleIcon name={iconName} size={size} color={color} />;
            },
        tabBarActiveTintColor: '#4a9eff',
        tabBarInactiveTintColor: '#8a9ba8',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2d2d3d',
          borderTopWidth: 1,
        },
      })}
    >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ 
            headerShown: false,
            title: 'Ana Sayfa'
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarStack}
          options={{ 
            headerShown: false,
            title: 'Takvim'
          }}
        />
        <Tab.Screen
          name="Cases"
          component={CasesStack}
          options={{ 
            headerShown: false,
            title: 'Dosyalar'
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ 
            headerShown: false,
            title: 'Profil'
          }}
        />
        {/* Hamburger menü sayfaları - gizli tab'lar */}
        <Tab.Screen
          name="Clients"
          component={ClientsStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Financial"
          component={FinancialStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Documents"
          component={DocumentsStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Sync"
          component={SyncStack}
          options={{ headerShown: false, tabBarButton: () => null }}
        />
            <Tab.Screen
              name="EDevletIntegration"
              component={EDevletIntegrationScreen}
              options={{ headerShown: false, tabBarButton: () => null }}
            />
            <Tab.Screen
              name="Chat"
              component={ChatStack}
              options={{ headerShown: false, tabBarButton: () => null }}
            />
            <Tab.Screen
              name="Log"
              component={LogScreen}
              options={{ headerShown: false, tabBarButton: () => null }}
            />
            <Tab.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
              options={{ headerShown: false, tabBarButton: () => null }}
            />
        </Tab.Navigator>
  );
};

export default MainTabNavigator;
