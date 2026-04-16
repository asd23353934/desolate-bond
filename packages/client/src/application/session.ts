// 會話狀態儲存工具。抽離出來以避免 useAuth.ts 與 api.ts 相互依賴。
// 未來若要更動儲存機制（例如改為 httpOnly cookie），只需改動此檔。

const SESSION_KEY = 'db_auth';

export interface AuthSession {
  id: string;
  displayName: string;
  isGuest: boolean;
  token: string;
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!));
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthSession;
    if (isTokenExpired(user.token)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function saveSession(user: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAuthToken(): string | null {
  return loadSession()?.token ?? null;
}
