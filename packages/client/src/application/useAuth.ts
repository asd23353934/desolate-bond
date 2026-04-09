import { useState, useCallback } from 'react';
import { api } from '../infrastructure/api.js';

export interface AuthUser {
  id: string;
  displayName: string;
  isGuest: boolean;
  token: string;
}

const SESSION_KEY = 'db_auth';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (isTokenExpired(user.token)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const register = useCallback(async (username: string, password: string) => {
    await api.register(username, password);
    const { token, id } = await api.login(username, password);
    const authUser: AuthUser = { id, displayName: username, isGuest: false, token };
    saveSession(authUser);
    setUser(authUser);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token, id, username: name } = await api.login(username, password);
    const authUser: AuthUser = { id, displayName: name, isGuest: false, token };
    saveSession(authUser);
    setUser(authUser);
  }, []);

  const loginAsGuest = useCallback(async (displayName: string) => {
    const { token, guestId } = await api.guest(displayName);
    const authUser: AuthUser = { id: guestId, displayName, isGuest: true, token };
    saveSession(authUser);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, register, login, loginAsGuest, logout };
}
