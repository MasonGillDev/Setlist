import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomePage from '../screens/HomePage';
import SetsPage from '../screens/SetsPage';
import { Colors } from '../constants/colors';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'musical-notes' : 'musical-notes-outline';
            } else if (route.name === 'Sets') {
              iconName = focused ? 'list' : 'list-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.primary.teal,
          tabBarInactiveTintColor: Colors.text.secondary,
          headerShown: false,
          tabBarStyle: {
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            backgroundColor: Colors.background.secondary,
            borderTopColor: Colors.neutral.gray200,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.3,
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomePage}
          options={{
            tabBarLabel: 'Identify',
          }}
        />
        <Tab.Screen 
          name="Sets" 
          component={SetsPage}
          options={{
            tabBarLabel: 'Sets',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;