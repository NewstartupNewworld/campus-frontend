import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'https://campus-backend-arfy.onrender.com';

// The reactions a student can give. They are written as escapes so the same text reaches the server.
export const REACTIONS = ['\uD83D\uDD25', '\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDC4D'];

export type EngageSummary = { reactions: Record<string, number>; mine: string[]; comments: number };
export const EMPTY_SUMMARY: EngageSummary = { reactions: {}, mine: [], comments: 0 };

// Reaction counts and comment counts for a list of posts, in one request
export async function fetchEngageSummary(type: string, ids: string[]): Promise<Record<string, EngageSummary>> {
  if (ids.length === 0) return {};
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(
      `${API_URL}/api/engage/summary?type=${encodeURIComponent(type)}&ids=${encodeURIComponent(ids.join(','))}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return res.ok ? data.items ?? {} : {};
  } catch {
    return {};
  }
}