// ===== lib/session.ts — mock session persisted in localStorage =====

export interface SessionUser {
  name: string;
}

const STORAGE_KEY = "av_user";

export function getSession(): SessionUser | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser | null): void {
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
