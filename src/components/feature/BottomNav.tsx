import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  iconActive?: string;
  /** 로그인 필요 시 이동할 경로 (없으면 to 사용) */
  loginRequired?: boolean;
  /** 팀 필요 시 대체 경로 (팀 없을 때) */
  fallbackWhenNoTeam?: string;
};

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const hasTeam = Boolean(user && "teamId" in user && user.teamId);

  const baseItems: NavItem[] = [
    { to: "/", label: "홈", icon: "ri-home-5-line", iconActive: "ri-home-5-fill" },
    { to: "/matching-rooms", label: "팀 참가방", icon: "ri-team-line", iconActive: "ri-team-fill" },
    { to: "/ranking", label: "랭킹", icon: "ri-bar-chart-box-line", iconActive: "ri-bar-chart-box-fill" },
  ];

  const authItems: NavItem[] = [
    {
      to: "/stock",
      label: "종목",
      icon: "ri-stock-line",
      iconActive: "ri-stock-fill",
      fallbackWhenNoTeam: "/matching-rooms",
    },
    { to: "/mock-investment", label: "모의투자", icon: "ri-chat-3-line", iconActive: "ri-chat-3-fill", loginRequired: true },
  ];

  const items = isLoggedIn ? [...baseItems, ...authItems] : baseItems;

  const getHref = (item: NavItem) => {
    if (item.loginRequired && !isLoggedIn) return "/login";
    if (item.fallbackWhenNoTeam && !hasTeam) return item.fallbackWhenNoTeam;
    return item.to;
  };

  const isActive = (item: NavItem) => {
    const path = location.pathname;
    const href = getHref(item);
    if (item.to === "/") return path === "/";
    return path === item.to || path.startsWith(item.to + "/");
  };

  const handleClick = (e: React.MouseEvent, item: NavItem) => {
    const href = getHref(item);
    if (item.loginRequired && !isLoggedIn) {
      e.preventDefault();
      navigate("/login");
    } else if (item.fallbackWhenNoTeam && !hasTeam) {
      e.preventDefault();
      navigate(item.fallbackWhenNoTeam!);
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="하단 메뉴"
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const active = isActive(item);
          const href = getHref(item);
          const iconClass = active ? (item.iconActive ?? item.icon) : item.icon;
          return (
            <Link
              key={item.to + item.label}
              to={href}
              onClick={(e) => handleClick(e, item)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 cursor-pointer transition-colors ${
                active ? "text-teal-600" : "text-gray-500 active:bg-gray-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <i className={`${iconClass} text-xl mb-0.5`} aria-hidden />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
