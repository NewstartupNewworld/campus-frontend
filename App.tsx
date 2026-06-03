import { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { registerForPushNotifications } from './src/utils/notifications';
import * as Notifications from 'expo-notifications';

export default function App() {
  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications();

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // TODO: navigate to relevant screen based on data.type
    });

    return () => subscription.remove();
  }, []);

  return <RootNavigator />;
}