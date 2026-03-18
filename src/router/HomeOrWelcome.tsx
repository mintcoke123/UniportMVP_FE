import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/home/page";
import WelcomePage from "../pages/welcome/page";

const INSTAGRAM_URL = "https://www.instagram.com/uniport_official_?igsh=YWw4cWw2cmQ0ZnFj&utm_source=ig_contact_invite";

/**
 * 루트 "/" 에서:
 * - 비로그인 또는 팀 미참가 → 가입/팀 참가 유도(Welcome)
 * - 로그인 + 팀 있음 → 홈 대시보드
 * - 루트 페이지에만 인스타그램 푸터 표시
 */
export default function HomeOrWelcome() {
  const { user, isLoggedIn } = useAuth();
  const hasTeam = Boolean(user?.teamId);

  return (
    <>
      {!isLoggedIn || !hasTeam ? <WelcomePage /> : <Home />}
      <footer className="mt-auto border-t border-gray-200 bg-white py-6 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-teal-600 transition-colors"
            aria-label="Uniport 인스타그램"
          >
            <i className="ri-instagram-line text-2xl" aria-hidden />
            <span className="text-sm font-medium">@uniport_official_</span>
          </a>
        </div>
      </footer>
    </>
  );
}
