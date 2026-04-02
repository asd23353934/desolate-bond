import { Router } from 'express';
import type { Request, Response } from 'express';
import { RegisterUseCase } from '../../application/use-cases/RegisterUseCase.js';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase.js';
import { GuestLoginUseCase } from '../../application/use-cases/GuestLoginUseCase.js';
import { PlayerRepository } from '../../infrastructure/repositories/PlayerRepository.js';

export const authRouter = Router();

const players = new PlayerRepository();
const register = new RegisterUseCase(players);
const login = new LoginUseCase(players);
const guestLogin = new GuestLoginUseCase();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'INVALID_REQUEST' });
    return;
  }

  try {
    const result = await register.execute(username.trim(), password);
    res.status(201).json({ id: result.id, username: result.username });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'USERNAME_TAKEN') {
        res.status(409).json({ error: 'USERNAME_TAKEN' });
        return;
      }
      if (err.message === 'USERNAME_INVALID' || err.message === 'PASSWORD_TOO_SHORT') {
        res.status(400).json({ error: err.message });
        return;
      }
    }
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'INVALID_REQUEST' });
    return;
  }

  try {
    const result = await login.execute(username.trim(), password);
    res.json({ token: result.token, id: result.id, username: result.username });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'INVALID_CREDENTIALS' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

authRouter.post('/guest', (req: Request, res: Response) => {
  const { displayName } = req.body as { displayName?: string };

  if (typeof displayName !== 'string') {
    res.status(400).json({ error: 'INVALID_REQUEST' });
    return;
  }

  try {
    const result = guestLogin.execute(displayName);
    res.json({ token: result.token, guestId: result.guestId, displayName: result.displayName });
  } catch (err) {
    if (err instanceof Error && err.message === 'DISPLAY_NAME_INVALID') {
      res.status(400).json({ error: 'DISPLAY_NAME_INVALID' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});
