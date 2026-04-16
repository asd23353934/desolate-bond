import { getAuthToken } from '../application/session.js';

const BASE = import.meta.env['VITE_API_URL'] ?? `http://${window.location.hostname}:2567`;

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'REQUEST_FAILED');
  return data;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'REQUEST_FAILED');
  return data;
}

export const api = {
  register: (username: string, password: string) =>
    post<{ id: string; username: string }>('/auth/register', { username, password }),

  login: (username: string, password: string) =>
    post<{ token: string; id: string; username: string }>('/auth/login', { username, password }),

  guest: (displayName: string) =>
    post<{ token: string; guestId: string; displayName: string }>('/auth/guest', { displayName }),

  findRoom: async (code: string): Promise<string> => {
    const res = await fetch(`${BASE}/rooms/find/${code}`, { headers: authHeaders() });
    const data = await res.json() as { roomId?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'ROOM_NOT_FOUND');
    return data.roomId!;
  },

  networkInfo: () =>
    get<{ ipv4: string[] }>('/network-info'),

  // 13.3/13.6: Leaderboard endpoints
  leaderboardFastestClear: () =>
    get<LeaderboardEntry[]>('/leaderboard/fastest-clear'),
  leaderboardHighestDamage: () =>
    get<LeaderboardEntry[]>('/leaderboard/highest-damage'),
  leaderboardHighestSurvival: () =>
    get<LeaderboardEntry[]>('/leaderboard/highest-survival'),
};

export interface LeaderboardEntry {
  display_name: string;
  is_guest: boolean;
  player_class: string;
  total_damage: number;
  survival_time: number;
  clear_time: number | null;
}
