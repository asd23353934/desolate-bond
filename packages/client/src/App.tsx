import { useAuth } from './application/useAuth';
import { AuthPage } from './presentation/pages/AuthPage';
import { MainMenuPage } from './presentation/pages/MainMenuPage';

function App() {
  const { user, register, login, loginAsGuest, logout } = useAuth();

  if (!user) {
    return <AuthPage register={register} login={login} loginAsGuest={loginAsGuest} />;
  }

  return <MainMenuPage user={user} onLogout={logout} />;
}

export default App;
