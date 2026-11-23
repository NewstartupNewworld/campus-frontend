import { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

const KEY = 'anonPostingDefault';
const EVENT = 'anon:default';
let cached: { at: number; value: boolean } | null = null;

async function readLocal(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}

/** The choice is saved on the server too, so a new phone or a reinstall keeps it. */
export async function getAnonDefault(): Promise<boolean> {
  if (cached && Date.now() - cached.at < 60000) return cached.value;
  const r = await apiRequest<{ anonymous: boolean }>('/api/privacy/anonymous');
  if (r.ok) {
    const value = !!r.data.anonymous;
    cached = { at: Date.now(), value };
    try { await AsyncStorage.setItem(KEY, value ? '1' : '0'); } catch { /* ignore */ }
    return value;
  }
  return readLocal();
}

export async function setAnonDefault(value: boolean): Promise<void> {
  cached = { at: Date.now(), value };
  try { await AsyncStorage.setItem(KEY, value ? '1' : '0'); } catch { /* ignore */ }
  DeviceEventEmitter.emit(EVENT, value);
  await apiRequest('/api/privacy/anonymous', { method: 'PATCH', body: { anonymous: value } });
}

/** The "post anonymously" switch of Profile and Settings. Every screen using it updates together. */
export function useAnonDefault(): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(false);
  useEffect(() => {
    let alive = true;
    readLocal().then((v) => { if (alive) setValue(v); });
    getAnonDefault().then((v) => { if (alive) setValue(v); });
    const sub = DeviceEventEmitter.addListener(EVENT, (v: boolean) => setValue(!!v));
    return () => { alive = false; sub.remove(); };
  }, []);
  return [value, (v: boolean) => { setValue(v); setAnonDefault(v); }];
}

/** A choice for one post or comment. It starts from the default switch and can be changed for this one. */
export function useAnonymousChoice(): [boolean, (v: boolean) => void, () => void] {
  const [fallback] = useAnonDefault();
  const [choice, setChoice] = useState<boolean | null>(null);
  return [choice ?? fallback, (v: boolean) => setChoice(v), () => setChoice(null)];
}
// END OF FILE