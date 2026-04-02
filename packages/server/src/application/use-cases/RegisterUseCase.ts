import { hash } from 'bcryptjs';
import type { IPlayerRepository } from '../../domain/interfaces/IPlayerRepository.js';

export interface RegisterResult {
  id: string;
  username: string;
}

export class RegisterUseCase {
  constructor(private readonly players: IPlayerRepository) {}

  async execute(username: string, password: string): Promise<RegisterResult> {
    if (username.length < 2 || username.length > 32) {
      throw new Error('USERNAME_INVALID');
    }
    if (password.length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }

    const existing = await this.players.findByUsername(username);
    if (existing) {
      throw new Error('USERNAME_TAKEN');
    }

    const passwordHash = await hash(password, 10);
    const user = await this.players.create(username, passwordHash, false);
    return { id: user.id, username: user.username };
  }
}
