import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://campus-backend-arfy.onrender.com';
const REFRESH_MS = 30000;

export type TabBadges = Record<string, number>;

// Which tab icon shows the red number for each kind of notification.
// Anything not listed here shows on Profile, where the notifications screen lives.
const tabForType = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('sos')) return 'Home';
  if (/(chat|message|offer|listing|rating|market|roommate|lost)/.test(t)) return 'Marketplace';
  if (/(buzz|comment|group|event|club|confession|like|react|post)/.test(t)) return 'Buzz';
  return 'Profile';
};

/**
 * Returns how many unread notifications each tab has, e.g. { Buzz: 2, Profile: 1 }.
 * Refreshes every 30 seconds, when the app comes back to the front, and whenever
 * `refreshKey` changes (pass the current screen name so it updates after you read them).
 */
export function useTabBadges(refreshKey: string): TabBadges {
  const [badges, setBadges] = useState<TabBadges>({});

  const load = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setBadges({});
        return;
      }
      const res = await fetch(`${API_URL}/api/notifications/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const next: TabBadges = {};
      Object.entries(data.byType ?? {}).forEach(([type, count]) => {
        const tab = tabForType(type);
        next[tab] = (next[tab] ?? 0) + Number(count);
      });
      setBadges(next);
    } catch {
      // Offline or the server is waking up: keep the old numbers
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const id = setInterval(load, REFRESH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [load]);

  return badges;
}