import { useState, useEffect } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMockInvestmentPage = location.pathname === "/mock-investment";

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString("ko-KR");
  };

  // 모바일 메뉴 열림 시 배경 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinkClass = (active?: boolean) =>
    `text-base font-medium whitespace-nowrap cursor-pointer transition-colors ${
      active ? "text-teal-600 font-semibold" : "text-gray-700 hover:text-teal-600"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
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
                  모의투자
                </span>
              ) : (
                <Link
                  to="/mock-investment"
                  className={navLinkClass(isMockInvestmentPage)}
                >
                  모의투자
                </Link>
              )}
              <Link to="/chat" className={navLinkClass()}>
                채팅
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

        {/* 모바일: 햄버거 버튼 */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          {isLoggedIn && user && (
            <span
              className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold"
              aria-hidden
            >
              {user.nickname.charAt(0)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
          >
            <i
              className={
                isMobileMenuOpen
                  ? "ri-close-line text-2xl text-gray-700"
                  : "ri-menu-line text-2xl text-gray-700"
              }
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* 모바일: 네비게이션 드로어 */}
      <div
        className={`fixed inset-0 z-40 md:hidden ${
          isMobileMenuOpen ? "visible" : "invisible"
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* 배경 딤 */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMobileMenu}
        />
        {/* 드로어 패널 (오른쪽에서 슬라이드) */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform duration-200 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900">메뉴</span>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="메뉴 닫기"
            >
              <i className="ri-close-line text-2xl text-gray-700" aria-hidden />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-4">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3 rounded-xl ${navLinkClass(
                      location.pathname === to
                    )}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && (
                <>
                  <li>
                    <Link
                      to="/matching-rooms"
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-xl ${navLinkClass(
                        location.pathname === "/matching-rooms"
                      )}`}
                    >
                      팀 참가방
                    </Link>
                  </li>
                  <li>
                    {!hasTeam ? (
                      <span className="block px-4 py-3 rounded-xl text-base font-medium text-gray-400 cursor-not-allowed">
                        모의투자
                      </span>
                    ) : (
                      <Link
                        to="/mock-investment"
                        onClick={closeMobileMenu}
                        className={`block px-4 py-3 rounded-xl ${navLinkClass(
                          isMockInvestmentPage
                        )}`}
                      >
                        모의투자
                      </Link>
                    )}
                  </li>
                  <li>
                    <Link
                      to="/chat"
                      onClick={closeMobileMenu}
                      className={`block px-4 py-3 rounded-xl ${navLinkClass(
                        location.pathname === "/chat"
                      )}`}
                    >
                      채팅
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200">
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <span className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {user.nickname.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.nickname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {hasTeam ? `팀 ${formatNumber(user.totalAssets)}원` : "—"}
                  </p>
                </div>
              </div>
            ) : null}
            <button
              onClick={() => {
                if (isLoggedIn && user) {
                  logout();
                  closeMobileMenu();
                } else {
                  navigate("/login");
                  closeMobileMenu();
                }
              }}
              className="mt-3 w-full px-4 py-3 text-center text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              {isLoggedIn && user ? (
                <>
                  <i className="ri-logout-box-r-line" aria-hidden />
                  로그아웃
                </>
              ) : (
                "로그인"
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
