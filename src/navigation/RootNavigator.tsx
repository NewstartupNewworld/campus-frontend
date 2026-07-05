import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme/colors';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { TabNavigator } from './TabNavigator';
import {
  initNotifications,
  getNavigationTarget,
  NotificationData,
  clearBadge,
} from '../utils/notifications';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Register push token once logged in
    initNotifications();

    // Foreground: notification received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Foreground:', notification.request.content.title);
    });

    // User tapped a notification (background or killed state)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as NotificationData;
      clearBadge();
      const target = getNavigationTarget(data);
      if (!target) return;
      setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(target.screen, target.params);
        }
      }, 500);
    });

    // App launched by tapping notification from killed state
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) return;
      const data = response.notification.request.content.data as NotificationData;
      const target = getNavigationTarget(data);
      if (!target) return;
      setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.navigate(target.screen, target.params);
        }
      }, 1000);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isLoggedIn]);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    } catch (e) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}