import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Request location permissions on app launch
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          // We'll still allow the app to function, but some features won't work
        } else {
          console.log('Location permission granted');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }
    })();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
