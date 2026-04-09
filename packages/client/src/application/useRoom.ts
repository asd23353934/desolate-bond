import { useState, useCallback } from 'react';
import type { Room } from 'colyseus.js';
import { createRoom as colyseuCreateRoom, joinRoomById } from '@/infrastructure/colyseus/client';
import { api } from '@/infrastructure/api';
import type { AuthUser } from './useAuth';

export interface RoomState {
  room: Room | null;
  roomCode: string;
  error: string;
  loading: boolean;
}

function roomError(msg: string): string {
  if (msg === 'ROOM_FULL') return '房間已滿（最多 4 人）';
  if (msg === 'ROOM_NOT_FOUND') return '房間碼無效或已關閉';
  if (msg.includes('UNAUTHORIZED') || msg.includes('jwt')) return '登入已過期，請重新登入';
  return '無法加入，請稍後再試';
}

export function useRoom(user: AuthUser) {
  const [state, setState] = useState<RoomState>({ room: null, roomCode: '', error: '', loading: false });

  const createRoom = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const room = await colyseuCreateRoom({ token: user.token });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const code: string = (room.state as any)?.roomCode ?? '';
      setState({ room, roomCode: code, error: '', loading: false });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: roomError(err instanceof Error ? err.message : '') }));
    }
  }, [user.token]);

  const joinRoom = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setState((s) => ({ ...s, error: '房間碼需為 6 個字元' }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const roomId = await api.findRoom(trimmed);
      const room = await joinRoomById(roomId, { token: user.token });
      setState({ room, roomCode: trimmed, error: '', loading: false });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: roomError(err instanceof Error ? err.message : '') }));
    }
  }, [user.token]);

  const leaveRoom = useCallback(() => {
    state.room?.leave();
    setState({ room: null, roomCode: '', error: '', loading: false });
  }, [state.room]);

  return { ...state, createRoom, joinRoom, leaveRoom };
}
