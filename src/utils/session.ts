import { Alert, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const confirmLogout = () =>
  Alert.alert('Log out', 'Are you sure you want to log out?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Log out',
      style: 'destructive',
      onPress: async () => {
        await AsyncStorage.multiRemove(['token', 'user', 'profilePic']);
        DeviceEventEmitter.emit('auth:logout');
      },
    },
  ]);
// END OF FILE