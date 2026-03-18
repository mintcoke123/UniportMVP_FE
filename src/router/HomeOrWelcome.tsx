import { useAuth } from "../contexts/AuthContext";
import Home from "../pages/home/page";
import WelcomePage from "../pages/welcome/page";

const INSTAGRAM_URL = "https://www.instagram.com/uniport_official_?igsh=YWw4cWw2cmQ0ZnFj&utm_source=ig_contact_invite";
const SURVEY_URL =
  "https://docs.google.com/forms/d/1nvWJjVSmeMY6Ev2s-etKNf6teg8HF-haVaTBj5PSeKM/viewform?hl=ko&hl=ko&edit_requested=true";

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
          <div className="flex flex-col items-center gap-3">
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              대회 피드백 설문조사 참여하기
            </a>
            <p className="text-xs text-gray-500">
              설문조사를 진행하면 소정의 상품(추첨을 통해 스타벅스 기프티콘 3명)을
              드립니다.
            </p>
          </div>
          <div className="h-px bg-gray-100 my-4" />
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
