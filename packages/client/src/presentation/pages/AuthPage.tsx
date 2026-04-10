import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { PixelPanel, PixelButton, PixelInput, PixelTabs, FloatingParticles } from '@/components/pixel-ui';

interface AuthPageProps {
  register: (u: string, p: string) => Promise<void>;
  login: (u: string, p: string) => Promise<void>;
  loginAsGuest: (name: string) => Promise<void>;
}

function errorMessage(code: string): string {
  const map: Record<string, string> = {
    USERNAME_TAKEN:    '此帳號名稱已被使用',
    USERNAME_INVALID:  '帳號名稱需 2–32 字元',
    PASSWORD_TOO_SHORT:'密碼至少 6 個字元',
    INVALID_CREDENTIALS: '帳號或密碼錯誤',
    DISPLAY_NAME_INVALID: '顯示名稱需 1–32 字元',
  };
  return map[code] ?? '發生錯誤，請再試一次';
}

export function AuthPage({ register, login, loginAsGuest }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState(0);
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
    <div className="relative flex min-h-screen items-center justify-center p-4 scanlines">
      <FloatingParticles />

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(244,168,52,0.07) 0%, transparent 55%)' }} />

      {/* Card entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[400px] z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.h1
            className="font-heading text-2xl text-pixel-amber inline-block"
            style={{ textShadow: '4px 4px 0 #000', animation: 'flicker 6s ease-in-out infinite' }}
          >
            絕境同盟
          </motion.h1>

          <motion.div
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-pixel-amber text-3xl my-2"
          >
            ⚔
          </motion.div>

          <p
            className="font-heading text-[10px] text-pixel-teal tracking-widest"
            style={{ textShadow: '2px 2px 0 #000' }}
          >
            DESOLATE BOND
          </p>
        </div>

        <PixelPanel>
          {/* Crown ornament */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-pixel-amber/50" />
            <Crown className="w-4 h-4 text-pixel-amber" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-pixel-amber/50" />
          </div>

          <PixelTabs
            tabs={['LOGIN', 'REGISTER', 'GUEST']}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {activeTab === 0 && (
                <LoginForm key="login" loading={loading}
                  onSubmit={(u, p) => handle(() => login(u, p))} />
              )}
              {activeTab === 1 && (
                <RegisterForm key="register" loading={loading}
                  onSubmit={(u, p) => handle(() => register(u, p))} />
              )}
              {activeTab === 2 && (
                <GuestForm key="guest" loading={loading}
                  onSubmit={name => handle(() => loginAsGuest(name))} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-center gap-2 font-body text-lg text-pixel-red"
                >
                  <span className="font-heading text-xs">!</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PixelPanel>
      </motion.div>
    </div>
  );
}

// ── Sub-forms ──────────────────────────────────────────────────────────────

const formAnim = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: 16 },
  transition: { duration: 0.2 },
};

function LoginForm({ loading, onSubmit }: { loading: boolean; onSubmit: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <motion.form {...formAnim} className="space-y-4"
      onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit(username, password); }}>
      <PixelInput label="帳號" placeholder="輸入帳號..." value={username} onChange={e => setUsername(e.target.value)} required />
      <PixelInput label="密碼" type="password" placeholder="輸入密碼..." value={password} onChange={e => setPassword(e.target.value)} required />
      <PixelButton type="submit" fullWidth disabled={loading}>LOGIN</PixelButton>
    </motion.form>
  );
}

function RegisterForm({ loading, onSubmit }: { loading: boolean; onSubmit: (u: string, p: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <motion.form {...formAnim} className="space-y-4"
      onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit(username, password); }}>
      <PixelInput label="帳號" placeholder="輸入帳號..." value={username} onChange={e => setUsername(e.target.value)} required />
      <div>
        <PixelInput label="密碼" type="password" placeholder="輸入密碼..." value={password} onChange={e => setPassword(e.target.value)} required />
        <p className="font-body text-sm text-pixel-muted mt-1">※ 密碼至少需要 6 個字元</p>
      </div>
      <PixelButton type="submit" fullWidth disabled={loading}>CREATE ACCOUNT</PixelButton>
    </motion.form>
  );
}

function GuestForm({ loading, onSubmit }: { loading: boolean; onSubmit: (name: string) => void }) {
  const [displayName, setDisplayName] = useState('');
  return (
    <motion.form {...formAnim} className="space-y-4"
      onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit(displayName); }}>
      <PixelInput label="顯示名稱" placeholder="輸入暱稱..." value={displayName} onChange={e => setDisplayName(e.target.value)} required />
      <PixelButton type="submit" variant="secondary" fullWidth disabled={loading}>PLAY AS GUEST</PixelButton>
      <p className="font-body text-center text-pixel-muted">無需註冊帳號</p>
    </motion.form>
  );
}
