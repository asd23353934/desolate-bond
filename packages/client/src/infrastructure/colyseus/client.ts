import { Client } from 'colyseus.js';
import type { Room } from 'colyseus.js';

const WS_URL = import.meta.env['VITE_WS_URL'] ?? `ws://${window.location.hostname}:2567`;

export const colyseusClient = new Client(WS_URL);

export function createRoom(options: object): Promise<Room> {
  return colyseusClient.create('game_room', options);
}

export function joinRoomById(roomId: string, options: object): Promise<Room> {
  return colyseusClient.joinById(roomId, options);
}
