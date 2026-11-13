import { Alert, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Makes every request to the CampusConnect server more forgiving.
// The free server goes to sleep and can need up to a minute to wake up, so:
//  - a read (GET) that fails or gets a "server is starting" answer is tried again, up to 2 more times
//  - no request hangs forever: reads give up after 20 seconds each try, writes after 50 seconds
//  - the app is told whether the server is fine, waking up, or not reachable (shown as a strip at the top)
//  - when the login has ended (401), the student is signed out cleanly
const API_HOST = 'campus-backend-arfy.onrender.com';
const READ_TIMEOUT_MS = 20000;
const WRITE_TIMEOUT_MS = 50000;
const RETRY_DELAYS_MS = [1500, 4000];
const NO_LOGOUT_PATHS = ['/api/auth/', '/api/social/me']; // a wrong password also answers 401 there

const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);

type NetState = 'ok' | 'waking' | 'offline';
let netState: NetState = 'ok';
let relax: ReturnType<typeof setTimeout> | null = null;

const setNet = (next: NetState) => {
  if (relax) { clearTimeout(relax); relax = null; }
  // A warning that nobody confirms again goes away by itself
  if (next !== 'ok') relax = setTimeout(() => { relax = null; setNet('ok'); }, 20000);
  if (next !== netState) {
    netState = next;
    DeviceEventEmitter.emit('net:status', next);
  }
};

let signingOut = false;
const endSession = async () => {
  if (signingOut) return;
  signingOut = true;
  try { await AsyncStorage.multiRemove(['token', 'user', 'profilePic']); } catch { /* ignore */ }
  DeviceEventEmitter.emit('auth:logout');
  Alert.alert('Signed out', 'Your session ended. Please sign in again.');
  setTimeout(() => { signingOut = false; }, 5000);
};

const urlOf = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return (input as Request).url ?? '';
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = urlOf(input);
  if (!url.includes(API_HOST)) return originalFetch(input as any, init);

  const method = String(init?.method ?? 'GET').toUpperCase();
  const isRead = method === 'GET' || method === 'HEAD';
  const canRetry = isRead && !init?.signal;
  const attempts = canRetry ? RETRY_DELAYS_MS.length + 1 : 1;
  const timeoutMs = isRead ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS;
  let lastError: unknown = new Error('Network request failed');

  for (let i = 0; i < attempts; i++) {
    const controller = init?.signal ? null : new AbortController();
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await originalFetch(
        input as any,
        controller ? { ...init, signal: controller.signal } : init
      );
      if (timer) clearTimeout(timer);

      const starting = response.status === 502 || response.status === 503 || response.status === 504;
      if (starting) {
        setNet('waking');
        if (canRetry && i < attempts - 1) {
          await sleep(RETRY_DELAYS_MS[i]);
          continue;
        }
      } else {
        setNet('ok');
      }

      if (response.status === 401 && !NO_LOGOUT_PATHS.some((p) => url.includes(p))) {
        endSession();
      }
      return response;
    } catch (err) {
      if (timer) clearTimeout(timer);
      lastError = err;
      if (i < attempts - 1) await sleep(RETRY_DELAYS_MS[i]);
    }
  }
  setNet('offline');
  throw lastError;
}

try {
  Object.defineProperty(globalThis, 'fetch', { value: guardedFetch, writable: true, configurable: true });
} catch {
  // If the phone does not allow it, the normal fetch keeps working
}
// END OF FILE