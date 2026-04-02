import { sign } from 'jsonwebtoken';

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
    // Short-lived token (browser session only — no refresh)
    const token = sign(
      { sub: guestId, displayName: displayName.trim(), isGuest: true },
      secret,
      { expiresIn: '12h' }
    );

    return { token, guestId, displayName: displayName.trim() };
  }
}
