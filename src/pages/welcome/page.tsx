import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/**
 * 비로그인 또는 팀 미참가 유저용 랜딩.
 * - 비로그인: 가입·로그인 유도
 * - 로그인 + 팀 없음: 팀 참가(매칭방) 유도
 */
export default function WelcomePage() {
  const { isLoggedIn, user } = useAuth();
  const hasTeam = Boolean(user?.teamId);

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-12 sm:px-12 sm:py-16">
            {!isLoggedIn ? (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-teal-100 flex items-center justify-center">
                  <i className="ri-user-add-line text-3xl text-teal-600" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  Uniport에 오신 것을 환영합니다
                </h1>
                <p className="text-gray-600 mb-8">
                  회원가입 후 대회에 참가하고, 팀을 이루어 모의투자를 경험해 보세요.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors"
                  >
                    <i className="ri-user-add-line" aria-hidden />
                    회원가입
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-login-box-line" aria-hidden />
                    로그인
                  </Link>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  이미 계정이 있으시면 로그인 후 팀 참가방에서 팀을 만드실 수 있습니다.
                </p>
              </>
            ) : !hasTeam ? (
              <>
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <i className="ri-team-line text-3xl text-amber-600" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  팀에 참가해 보세요
                </h1>
                <p className="text-gray-600 mb-8">
                  팀(3명)을 만들거나 참가한 뒤, 대회와 모의투자를 이용할 수 있습니다.
                  <br />
                  팀 참가방에서 대기 중인 방에 들어가거나 새 방을 만들어 팀원을 모으세요.
                </p>
                <Link
                  to="/matching-rooms"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors"
                >
                  <i className="ri-team-line" aria-hidden />
                  팀 참가방으로 이동
                </Link>
                <p className="mt-6 text-sm text-gray-500">
                  대회·랭킹은 팀 참가 없이도 둘러볼 수 있습니다.
                </p>
                <div className="mt-6 flex gap-4 justify-center">
                  <Link
                    to="/competition"
                    className="text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    대회 보기
                  </Link>
                  <Link
                    to="/ranking"
                    className="text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    랭킹 보기
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
