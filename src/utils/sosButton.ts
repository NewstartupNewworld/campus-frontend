import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export type SOSButtonMode = 'visible' | 'tucked' | 'hidden';
export type SOSButtonPosition = { side: 'left' | 'right'; top: number | null };

const MODE_KEY = 'sosButtonMode';
const POS_KEY = 'sosButtonPosition';
const EVENT = 'sosButtonModeChanged';

export const getSOSButtonMode = async (): Promise<SOSButtonMode> => {
  try {
    const saved = await AsyncStorage.getItem(MODE_KEY);
    if (saved === 'tucked' || saved === 'hidden') return saved;
  } catch (e) {}
  return 'visible';
};

export const setSOSButtonMode = async (mode: SOSButtonMode) => {
  try {
    await AsyncStorage.setItem(MODE_KEY, mode);
  } catch (e) {}
  DeviceEventEmitter.emit(EVENT, mode);
};

export const onSOSButtonModeChange = (callback: (mode: SOSButtonMode) => void) => {
  const sub = DeviceEventEmitter.addListener(EVENT, callback);
  return () => sub.remove();
};

export const getSOSButtonPosition = async (): Promise<SOSButtonPosition | null> => {
  try {
    const saved = await AsyncStorage.getItem(POS_KEY);
    if (saved) {
      const p = JSON.parse(saved);
      if ((p.side === 'left' || p.side === 'right') && (typeof p.top === 'number' || p.top === null)) {
        return { side: p.side, top: p.top };
      }
    }
  } catch (e) {}
  return null;
};

export const setSOSButtonPosition = async (pos: SOSButtonPosition) => {
  try {
    await AsyncStorage.setItem(POS_KEY, JSON.stringify(pos));
  } catch (e) {}
};