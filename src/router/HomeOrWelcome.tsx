import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/home/page";
import WelcomePage from "../pages/welcome/page";

/**
 * 루트 "/" 에서:
 * - 비로그인 또는 팀 미참가 → 가입/팀 참가 유도(Welcome)
 * - 로그인 + 팀 있음 → 홈 대시보드
 */
export default function HomeOrWelcome() {
  const { user, isLoggedIn } = useAuth();
  const hasTeam = Boolean(user?.teamId);

  if (!isLoggedIn || !hasTeam) {
    return <WelcomePage />;
  }
  return <Home />;
}
