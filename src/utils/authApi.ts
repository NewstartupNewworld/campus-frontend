const API_URL = 'https://campus-backend-arfy.onrender.com';

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// Same rule as the server
export const passwordProblem = (pw: string): string | null => {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Add at least one letter.';
  if (!/\d/.test(pw)) return 'Add at least one number.';
  return null;
};

export type AuthSuccess = { ok: true; data: { token: string; user: any } };
export type AuthFailure = { ok: false; title: string; message: string; field?: string };

/** Sends a login or signup request and turns every possible failure into a clear message. */
export async function authRequest(
  path: 'login' | 'signup',
  body: Record<string, unknown>
): Promise<AuthSuccess | AuthFailure> {
  try {
    const response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data?.token && data?.user) return { ok: true, data };

    if (response.status === 429) {
      return { ok: false, title: 'Too many attempts', message: 'Please wait a few minutes and try again.' };
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return { ok: false, title: 'Server is starting', message: 'The server was asleep. Wait a few seconds and try again.' };
    }
    if (response.status >= 500) {
      return { ok: false, title: 'Server problem', message: data?.error || 'Something went wrong on our side. Please try again.' };
    }
    return {
      ok: false,
      title: 'Please check this',
      message: data?.error || 'Something went wrong. Please try again.',
      field: data?.field ?? undefined,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        title: 'Server is waking up',
        message: 'It is taking longer than usual. Wait about a minute and try again.',
      };
    }
    return {
      ok: false,
      title: 'No connection',
      message: 'Could not reach the server. Check your internet and try again.',
    };
  }
}