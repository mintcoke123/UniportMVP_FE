import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_NAV_LINKS = [
  { to: "/competition", label: "대회" },
  { to: "/ranking", label: "랭킹" },
] as const;

const FESTIVAL_NAV_LINKS = [
  { to: "/festival-stock", label: "투자 화면" },
  { to: "/festival-ranking", label: "축제 리더보드" },
] as const;

function isFestivalPath(pathname: string) {
  return pathname === "/" || pathname === "/festival-stock" || pathname === "/festival-ranking";
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const festivalMode = isFestivalPath(location.pathname);
  const navLinks = festivalMode ? FESTIVAL_NAV_LINKS : DEFAULT_NAV_LINKS;
  const logoTarget = festivalMode ? "/festival-stock" : "/";

  const navLinkClass = (to: string) =>
    `text-base font-medium whitespace-nowrap transition-colors ${
      location.pathname === to
        ? "text-teal-600 font-semibold"
        : "text-gray-700 hover:text-teal-600"
    }`;

  const handleAuthAction = () => {
    navigate(festivalMode ? "/" : "/login");
  };

  return (
    <header className="sticky top-0 z-30 hidden border-b border-gray-200 bg-white lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4 lg:px-8">
        <Link to={logoTarget} className="flex shrink-0 items-center">
          <img src="/asset/logo.png" alt="Uniport Logo" className="h-8 w-auto md:h-10" />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex lg:gap-8">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={navLinkClass(to)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 md:block">
          {isLoggedIn && user && !festivalMode ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-xl px-4 py-2 transition-colors hover:bg-gray-100"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                  {user.nickname.charAt(0)}
                </span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{user.nickname}</p>
                  <p className="text-xs text-gray-500">
                    총 {Math.floor(user.totalAssets).toLocaleString("ko-KR")}원
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
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    <i className="ri-logout-box-r-line" aria-hidden />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleAuthAction}
              className="whitespace-nowrap rounded-lg bg-teal-500 px-6 py-2.5 text-base font-medium text-white transition-colors hover:bg-teal-600"
            >
              {festivalMode ? "참가 등록" : "로그인"}
            </button>
          )}
        </div>

        <div className="relative flex shrink-0 items-center md:hidden">
          {isLoggedIn && user && !festivalMode ? (
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white">
                {user.nickname.charAt(0)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAuthAction}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label={festivalMode ? "참가 등록" : "로그인"}
            >
              <i className="ri-user-line text-xl text-gray-600" aria-hidden />
            </button>
          )}

          {isDropdownOpen && !festivalMode && (
            <>
              <div
                className="fixed inset-0 z-40"
                aria-hidden
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-4 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                <button
                  onClick={() => {
                    logout();
                    setIsDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
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
