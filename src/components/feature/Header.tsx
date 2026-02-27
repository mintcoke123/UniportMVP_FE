import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const NAV_LINKS = [
  { to: "/competition", label: "대회" },
  { to: "/ranking", label: "랭킹" },
] as const;

export default function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const hasTeam = Boolean(user && "teamId" in user && user.teamId);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isStockPage = location.pathname === "/stock";
  const isMockInvestmentPage = location.pathname === "/mock-investment";

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString("ko-KR");
  };

  const navLinkClass = (active?: boolean) =>
    `text-base font-medium whitespace-nowrap cursor-pointer transition-colors ${
      active ? "text-teal-600 font-semibold" : "text-gray-700 hover:text-teal-600"
    }`;

  return (
    <header className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 shrink-0">
          <img
            src="https://static.readdy.ai/image/acf8fc365223a7d2bd60db95c29d6240/ea3b02d7dfa7aa2392d9ab077f231aca.webp"
            alt="Uniport Logo"
            className="h-8 md:h-10 w-auto"
          />
          <span className="text-xl md:text-2xl font-bold text-gray-900">Uniport</span>
        </Link>

        {/* 데스크톱: 중앙 네비 */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6 lg:gap-8">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={navLinkClass()}>
              {label}
            </Link>
          ))}
          {isLoggedIn && (
            <>
              <Link to="/matching-rooms" className={navLinkClass()}>
                팀 참가방
              </Link>
              {!hasTeam ? (
                <span
                  className="text-base font-medium text-gray-400 whitespace-nowrap cursor-not-allowed"
                  title="매칭방에서 팀(3명)을 만든 후 이용할 수 있습니다"
                >
                  종목
                </span>
              ) : (
                <Link
                  to="/stock"
                  className={navLinkClass(isStockPage)}
                >
                  종목
                </Link>
              )}
              <Link to="/mock-investment" className={navLinkClass(isMockInvestmentPage)}>
                모의투자
              </Link>
            </>
          )}
        </nav>

        {/* 데스크톱: 우측 유저/로그인 */}
        <div className="hidden md:block shrink-0">
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
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
                  <p
                    className="text-xs text-gray-500"
                    title={
                      hasTeam
                        ? "우리 팀 총 자산"
                        : "팀 참가 후 팀 총 자산이 표시됩니다"
                    }
                  >
                    {hasTeam ? `팀 ${formatNumber(user.totalAssets)}원` : "—"}
                  </p>
                </div>
                <i
                  className={`ri-arrow-down-s-line text-gray-400 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
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
                    <i className="ri-logout-box-r-line" aria-hidden />
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

        {/* 모바일: 로그인/프로필 아이콘 (하단 네비와 함께 사용) */}
        <div className="relative flex md:hidden items-center shrink-0">
          {isLoggedIn && user ? (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
              aria-label="내 메뉴"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <span className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold">
                {user.nickname.charAt(0)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              aria-label="로그인"
            >
              <i className="ri-user-line text-xl text-gray-600" aria-hidden />
            </button>
          )}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-4 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <i className="ri-logout-box-r-line" aria-hidden />
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
