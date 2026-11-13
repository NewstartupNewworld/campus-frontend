import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://campus-backend-arfy.onrender.com';

export type ApiFailure = { ok: false; status: number; title: string; message: string; field?: string };
export type ApiResult<T = any> = { ok: true; data: T } | ApiFailure;

// Turns an answer code into words a student understands
export const friendlyStatus = (status: number, serverMessage?: string): { title: string; message: string } => {
  if (status === 400 || status === 422) return { title: 'Please check this', message: serverMessage || 'Some details are not right.' };
  if (status === 401) return { title: 'Signed out', message: 'Please sign in again.' };
  if (status === 403) return { title: 'Not allowed', message: serverMessage || 'You do not have permission to do this.' };
  if (status === 404) return { title: 'Not found', message: serverMessage || 'This is no longer available.' };
  if (status === 409) return { title: 'Already exists', message: serverMessage || 'This already exists.' };
  if (status === 413) return { title: 'Too large', message: 'The file or text is too big.' };
  if (status === 429) return { title: 'Too many attempts', message: 'Please wait a minute and try again.' };
  if (status === 502 || status === 503 || status === 504) return { title: 'Server is starting', message: 'Wait a few seconds and try again.' };
  if (status >= 500) return { title: 'Server problem', message: serverMessage || 'Something went wrong on our side. Please try again.' };
  return { title: 'Something went wrong', message: serverMessage || 'Please try again.' };
};

/** One request to the server. It never throws: check `result.ok`. */
export async function apiRequest<T = any>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {};
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth !== false) {
      const token = await AsyncStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => null);
    if (response.ok) return { ok: true, data: data as T };
    return { ok: false, status: response.status, ...friendlyStatus(response.status, data?.error), field: data?.field ?? undefined };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, status: 0, title: 'Taking too long', message: 'The server is slow right now. Please try again in a moment.' };
    }
    return { ok: false, status: 0, title: 'No connection', message: 'Could not reach the server. Check your internet and try again.' };
  }
}

export const alertApiError = (result: ApiFailure) => Alert.alert(result.title, result.message);
// END OF FILE