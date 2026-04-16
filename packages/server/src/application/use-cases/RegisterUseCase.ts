import { hash } from 'bcryptjs';
import type { IPlayerRepository } from '../../domain/interfaces/IPlayerRepository.js';

export interface RegisterResult {
  id: string;
  username: string;
}

// bcrypt 成本輪次：每 +1 耗時翻倍。2026 建議 >= 12。
// 合法範圍 10–15：低於 10 不安全，高於 15 單次雜湊 >數秒，易被拿來 DoS。
const BCRYPT_ROUNDS = (() => {
  const raw = process.env['BCRYPT_ROUNDS'];
  if (raw === undefined) return 12;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 10 || n > 15) {
    console.warn(`[auth] BCRYPT_ROUNDS 無效（${raw}），使用預設 12`);
    return 12;
  }
  return n;
})();

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

    const passwordHash = await hash(password, BCRYPT_ROUNDS);
    const user = await this.players.create(username, passwordHash, false);
    return { id: user.id, username: user.username };
  }
}
