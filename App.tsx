import { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initNotifications } from './src/utils/notifications';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  useEffect(() => {
    // Register + save to backend
    initNotifications();

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}