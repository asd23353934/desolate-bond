export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  isGuest: boolean;
  createdAt: Date;
}

export interface IPlayerRepository {
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(username: string, passwordHash: string, isGuest: boolean): Promise<UserRecord>;
}
