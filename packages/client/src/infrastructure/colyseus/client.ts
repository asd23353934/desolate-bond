import { Client } from 'colyseus.js';

const WS_URL = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:2567';

export const colyseusClient = new Client(WS_URL);
