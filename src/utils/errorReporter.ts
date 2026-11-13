import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const MAX_REPORTS_PER_LAUNCH = 8;
const ALERT_COOLDOWN_MS = 15000;

let sent = 0;
let lastAlertAt = 0;
const seen = new Set<string>();

const textOf = (e: unknown): { message: string; stack: string } => {
  if (e instanceof Error) return { message: e.message || e.name, stack: e.stack ?? '' };
  try {
    return { message: typeof e === 'string' ? e : JSON.stringify(e), stack: '' };
  } catch {
    return { message: String(e), stack: '' };
  }
};

// A slow or missing internet connection is not a bug in the app, so it is not reported
const isNetworkNoise = (message: string) => /network request failed|aborted|timed? ?out|failed to fetch/i.test(message);

/** Sends a short report so the developer can see problems from other phones. It never throws. */
export async function reportError(error: unknown, where = 'unknown'): Promise<void> {
  try {
    const { message, stack } = textOf(error);
    console.error(`[error:${where}]`, message);
    if (isNetworkNoise(message)) return;
    const key = `${where}|${message}`.slice(0, 200);
    if (seen.has(key) || sent >= MAX_REPORTS_PER_LAUNCH) return;
    seen.add(key);
    sent += 1;

    const token = await AsyncStorage.getItem('token');
    await fetch(`${API_URL}/api/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        message: message.slice(0, 500),
        stack: stack.slice(0, 3000),
        where,
        appVersion: Constants.expoConfig?.version ?? null,
      }),
    });
  } catch {
    // Reporting must never cause another error
  }
}

const tellUser = () => {
  const now = Date.now();
  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return;
  lastAlertAt = now;
  Alert.alert('Something went wrong', 'Please try again. If it keeps happening, close the app and open it again.');
};

let installed = false;

/** Catches errors nobody else caught, so the app keeps running instead of closing. */
export function installGlobalHandlers() {
  if (installed) return;
  installed = true;

  const handle = (error: unknown, where: string) => {
    const { message } = textOf(error);
    reportError(error, where);
    if (!isNetworkNoise(message)) tellUser();
  };

  const errorUtils = (globalThis as any).ErrorUtils;
  if (errorUtils?.setGlobalHandler) {
    errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => handle(error, isFatal ? 'fatal' : 'uncaught'));
  }

  try {
    (globalThis as any).HermesInternal?.enablePromiseRejectionTracker?.({
      allRejections: true,
      onUnhandled: (_id: number, error: unknown) => handle(error, 'promise'),
    });
  } catch {
    // Not available on this phone
  }
}
// END OF FILE