import type { Room } from '../entities/Room.js';

export interface IRoomRepository {
  findByCode(code: string): Promise<Room | null>;
  isCodeActive(code: string): Promise<boolean>;
  save(room: Room): Promise<void>;
  delete(roomId: string): Promise<void>;
}
