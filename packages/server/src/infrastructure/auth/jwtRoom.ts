import { verify } from 'jsonwebtoken';
import type { AuthPayload } from './jwt.js';

export function verifyToken(token: string): AuthPayload {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');
  return verify(token, secret) as AuthPayload;
}
