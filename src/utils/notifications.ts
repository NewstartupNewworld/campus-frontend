import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://campus-backend-production-2dbb.up.railway.app';
const EXPO_PROJECT_ID = 'your-expo-project-id'; // Replace from app.json > extra.eas.projectId

// ─── FOREGROUND HANDLER ───────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── REGISTER FOR PUSH ────────────────────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Push] Skipping — not a real device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CampusConnect',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F7CFF',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('sos', {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#EF4444',
      sound: 'default',
    });
  }

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EXPO_PROJECT_ID,
    });
    token = tokenData.data;
  } catch (err) {
    console.error('[Push] Failed to get token:', err);
    return null;
  }

  await AsyncStorage.setItem('pushToken', token);
  console.log('[Push] Token:', token);
  return token;
}

// ─── SAVE TOKEN TO BACKEND ────────────────────────────────────────────────────
export async function savePushTokenToBackend(token: string): Promise<void> {
  try {
    const authToken = await AsyncStorage.getItem('token');
    if (!authToken) return;

    await axios.post(
      `${BASE_URL}/api/users/push-token`,
      { push_token: token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('[Push] Token saved to backend');
  } catch (err) {
    console.error('[Push] Failed to save token:', err);
  }
}

// ─── INIT (call on app startup after login) ───────────────────────────────────
export async function initNotifications(): Promise<string | null> {
  try {
    const cachedToken = await AsyncStorage.getItem('pushToken');
    const token = await registerForPushNotifications();
    if (token && token !== cachedToken) {
      await savePushTokenToBackend(token);
    }
    return token;
  } catch (err) {
    console.error('[Push] init error:', err);
    return null;
  }
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ─── LOCAL NOTIFICATION ───────────────────────────────────────────────────────
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: 'default' },
    trigger: null,
  });
}

// ─── NOTIFICATION DATA TYPES ──────────────────────────────────────────────────
export type NotificationData =
  | { type: 'chat_accepted'; chatId: number; listingId: number }
  | { type: 'chat_request'; chatId: number; listingId: number }
  | { type: 'new_message'; chatId: number }
  | { type: 'buzz_reaction'; postId: number }
  | { type: 'buzz_comment'; postId: number }
  | { type: 'rating'; fromUser: string; score: number }
  | { type: 'sos_alert'; alertId: number }
  | { type: 'offer_received'; chatId: number; amount: number }
  | { type: 'offer_accepted'; chatId: number; amount: number };

// ─── DEEP LINK HELPER ─────────────────────────────────────────────────────────
export function getNavigationTarget(data: NotificationData): {
  screen: string;
  params?: Record<string, any>;
} | null {
  switch (data.type) {
    case 'chat_accepted':
    case 'chat_request':
    case 'new_message':
    case 'offer_received':
    case 'offer_accepted':
      return { screen: 'ChatRoom', params: { chatId: data.chatId } };
    case 'buzz_reaction':
    case 'buzz_comment':
      return { screen: 'Buzz', params: { postId: data.postId } };
    case 'rating':
      return { screen: 'Profile' };
    case 'sos_alert':
      return { screen: 'SOS' };
    default:
      return null;
  }
}