import jwt from 'jsonwebtoken';
const { verify } = jwt;
import type { Request, Response, NextFunction } from 'express';

export interface AuthPayload {
  sub: string;
  username?: string;
  displayName?: string;
  isGuest: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
    return;
  }

  try {
    const payload = verify(token, secret) as AuthPayload;
    req.user = {
      sub: payload.sub,
      username: payload.username,
      displayName: payload.displayName,
      isGuest: payload.isGuest ?? false,
    };
    next();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

export function getDisplayName(user: AuthPayload): string {
  return user.isGuest ? (user.displayName ?? user.sub) : (user.username ?? user.sub);
}
