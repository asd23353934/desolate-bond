import { useState, useCallback } from 'react';
import { api } from '../infrastructure/api.js';
import { loadSession, saveSession, clearSession, type AuthSession } from './session.js';

export type AuthUser = AuthSession;

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
