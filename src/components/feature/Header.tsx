import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const hasTeam = Boolean(user && "teamId" in user && user.teamId);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isMockInvestmentPage = location.pathname === "/mock-investment";

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString("ko-KR");
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="https://static.readdy.ai/image/acf8fc365223a7d2bd60db95c29d6240/ea3b02d7dfa7aa2392d9ab077f231aca.webp"
            alt="Uniport Logo"
            className="h-10 w-auto"
          />
          <span className="text-2xl font-bold text-gray-900">Uniport</span>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
          <Link
            to="/competition"
            className="text-base font-medium text-gray-700 hover:text-teal-600 whitespace-nowrap cursor-pointer transition-colors"
          >
            대회
          </Link>
          <Link
            to="/ranking"
            className="text-base font-medium text-gray-700 hover:text-teal-600 whitespace-nowrap cursor-pointer transition-colors"
          >
            랭킹
          </Link>
          {isLoggedIn && (
            <>
              <Link
                to="/matching-rooms"
                className="text-base font-medium text-gray-700 hover:text-teal-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                팀 참가방
              </Link>
              {!hasTeam ? (
                <span
                  className="text-base font-medium text-gray-400 whitespace-nowrap cursor-not-allowed"
                  title="매칭방에서 팀(3명)을 만든 후 이용할 수 있습니다"
                >
                  모의투자
                </span>
              ) : (
                <Link
                  to="/mock-investment"
                  className={`text-base font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    isMockInvestmentPage
                      ? "text-teal-600 font-semibold"
                      : "text-gray-700 hover:text-teal-600"
                  }`}
                >
                  모의투자
                </Link>
              )}
              <Link
                to="/chat"
                className="text-base font-medium text-gray-700 hover:text-teal-600 whitespace-nowrap cursor-pointer transition-colors"
              >
                채팅
              </Link>
            </>
          )}
        </nav>

        {isLoggedIn && user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <span
                className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                aria-hidden
              >
                {user.nickname.charAt(0)}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {user.nickname}
                </p>
                <p className="text-xs text-gray-500" title={hasTeam ? "우리 팀 총 자산" : "팀 참가 후 팀 총 자산이 표시됩니다"}>
                  {hasTeam ? `팀 ${formatNumber(user.totalAssets)}원` : "—"}
                </p>
              </div>
              <i
                className={`ri-arrow-down-s-line text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              ></i>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <i className="ri-logout-box-r-line"></i>
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 text-base font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 whitespace-nowrap cursor-pointer transition-colors"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
