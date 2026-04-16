import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
const { sign } = jwt;
import type { IPlayerRepository } from '../../domain/interfaces/IPlayerRepository.js';

export interface LoginResult {
  token: string;
  id: string;
  username: string;
}

export class LoginUseCase {
  constructor(private readonly players: IPlayerRepository) {}

  async execute(username: string, password: string): Promise<LoginResult> {
    const user = await this.players.findByUsername(username);

    // Always compare to prevent timing attacks; use a dummy hash on miss
    const hash = user?.passwordHash ?? '$2a$10$invalidhashfortimingprotection000000000000000000000000';
    const valid = await compare(password, hash);

    if (!user || !valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET not configured');

    // 縮短有效期以降低 token 外洩時的暴露窗口（sessionStorage 關頁即清，但 token 本身仍需 server 驗證）
    const token = sign({ sub: user.id, username: user.username }, secret, { expiresIn: '8h' });
    return { token, id: user.id, username: user.username };
  }
}
