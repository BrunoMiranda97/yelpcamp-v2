import type { User } from "../types.ts";

const TOKEN_KEY = "token";
const USER_KEY = "user";

/** Fired when the API rejects the stored token, so the auth state can reset. */
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

// Storage can throw (private mode, blocked site data), so every access is guarded.
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function saveSession(user: User, token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Session still works in memory for this tab
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clear
  }
}

/** Returns the stored user only when a valid, unexpired token is present. */
export function readStoredUser(): User | null {
  const token = getToken();
  const raw = safeGet(USER_KEY);
  if (!token || !raw || isTokenExpired(token)) {
    clearSession();
    return null;
  }
  try {
    const user = JSON.parse(raw) as User;
    return user?.id && user?.username ? user : null;
  } catch {
    clearSession();
    return null;
  }
}
