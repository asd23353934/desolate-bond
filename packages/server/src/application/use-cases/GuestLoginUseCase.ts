import jwt from 'jsonwebtoken';
const { sign } = jwt;

export interface GuestLoginResult {
  token: string;
  guestId: string;
  displayName: string;
}

export class GuestLoginUseCase {
  execute(displayName: string): GuestLoginResult {
    if (displayName.trim().length < 1 || displayName.trim().length > 32) {
      throw new Error('DISPLAY_NAME_INVALID');
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) throw new Error('JWT_SECRET not configured');

    const guestId = `guest_${crypto.randomUUID()}`;
    // 訪客 token 更短（無帳號根基，一次性遊玩為主；無 refresh 機制）
    const token = sign(
      { sub: guestId, displayName: displayName.trim(), isGuest: true },
      secret,
      { expiresIn: '4h' }
    );

    return { token, guestId, displayName: displayName.trim() };
  }
}
