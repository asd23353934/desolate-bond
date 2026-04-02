import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AuthPageProps {
  register: (u: string, p: string) => Promise<void>;
  login: (u: string, p: string) => Promise<void>;
  loginAsGuest: (name: string) => Promise<void>;
}

function errorMessage(code: string): string {
  const map: Record<string, string> = {
    USERNAME_TAKEN: '此帳號名稱已被使用',
    USERNAME_INVALID: '帳號名稱需 2–32 字元',
    PASSWORD_TOO_SHORT: '密碼至少 6 個字元',
    INVALID_CREDENTIALS: '帳號或密碼錯誤',
    DISPLAY_NAME_INVALID: '顯示名稱需 1–32 字元',
  };
  return map[code] ?? '發生錯誤，請再試一次';
}

export function AuthPage({ register, login, loginAsGuest }: AuthPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handle(action: () => Promise<void>) {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl">絕境同盟</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">登入</TabsTrigger>
              <TabsTrigger value="register">註冊</TabsTrigger>
              <TabsTrigger value="guest">訪客</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm loading={loading} onSubmit={(u, p) => handle(() => login(u, p))} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm loading={loading} onSubmit={(u, p) => handle(() => register(u, p))} />
            </TabsContent>
            <TabsContent value="guest">
              <GuestForm loading={loading} onSubmit={(name) => handle(() => loginAsGuest(name))} />
            </TabsContent>
          </Tabs>

          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm({ loading, onSubmit }: { loading: boolean; onSubmit: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(username, password); }}>
      <div className="space-y-1">
        <Label htmlFor="login-username">帳號</Label>
        <Input id="login-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="login-password">密碼</Label>
        <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button className="w-full" type="submit" disabled={loading}>登入</Button>
    </form>
  );
}

function RegisterForm({ loading, onSubmit }: { loading: boolean; onSubmit: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(username, password); }}>
      <div className="space-y-1">
        <Label htmlFor="reg-username">帳號</Label>
        <Input id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reg-password">密碼（至少 6 字元）</Label>
        <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button className="w-full" type="submit" disabled={loading}>建立帳號</Button>
    </form>
  );
}

function GuestForm({ loading, onSubmit }: { loading: boolean; onSubmit: (name: string) => void }) {
  const [displayName, setDisplayName] = useState('');
  return (
    <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(displayName); }}>
      <div className="space-y-1">
        <Label htmlFor="guest-name">顯示名稱</Label>
        <Input id="guest-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="輸入名稱即可進入" />
      </div>
      <Button className="w-full" type="submit" disabled={loading}>以訪客身份遊玩</Button>
    </form>
  );
}
