const BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:2567';

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
    const res = await fetch(`${BASE}/rooms/find/${code}`);
    const data = await res.json() as { roomId?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'ROOM_NOT_FOUND');
    return data.roomId!;
  },
};
