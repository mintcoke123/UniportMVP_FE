import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  iconActive?: string;
  loginRequired?: boolean;
  fallbackWhenNoTeam?: string;
};

const FESTIVAL_ITEMS: NavItem[] = [
  { to: "/festival-stock", label: "투자 화면", icon: "ri-line-chart-line", iconActive: "ri-line-chart-fill" },
  { to: "/festival-ranking", label: "리더보드", icon: "ri-trophy-line", iconActive: "ri-trophy-fill" },
];

function isFestivalPath(pathname: string) {
  return pathname === "/" || pathname === "/festival-stock" || pathname === "/festival-ranking";
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const hasTeam = Boolean(user && "teamId" in user && user.teamId);
  const festivalMode = isFestivalPath(location.pathname);

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
    {
      to: "/mock-investment",
      label: "모의투자",
      icon: "ri-chat-3-line",
      iconActive: "ri-chat-3-fill",
      loginRequired: true,
    },
  ];

  const items = festivalMode ? FESTIVAL_ITEMS : isLoggedIn ? [...baseItems, ...authItems] : baseItems;

  const getHref = (item: NavItem) => {
    if (festivalMode) return item.to;
    if (item.loginRequired && !isLoggedIn) return "/login";
    if (item.fallbackWhenNoTeam && !hasTeam) return item.fallbackWhenNoTeam;
    return item.to;
  };

  const isActive = (item: NavItem) => {
    const path = location.pathname;
    if (item.to === "/") return path === "/";
    return path === item.to || path.startsWith(item.to + "/");
  };

  const handleClick = (e: React.MouseEvent, item: NavItem) => {
    if (festivalMode) return;
    const href = getHref(item);
    if (item.loginRequired && !isLoggedIn) {
      e.preventDefault();
      navigate("/login");
    } else if (item.fallbackWhenNoTeam && !hasTeam) {
      e.preventDefault();
      navigate(item.fallbackWhenNoTeam);
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      role="navigation"
      aria-label="하단 메뉴"
    >
      <div className={`mx-auto flex items-stretch ${festivalMode ? "h-16 max-w-md px-3" : "h-14 max-w-lg"}`}>
        {items.map((item) => {
          const active = isActive(item);
          const href = getHref(item);
          const iconClass = active ? (item.iconActive ?? item.icon) : item.icon;

          return (
            <Link
              key={item.to + item.label}
              to={href}
              onClick={(e) => handleClick(e, item)}
              className={`flex min-w-0 flex-1 cursor-pointer items-center justify-center transition-colors ${
                festivalMode
                  ? active
                    ? "rounded-2xl bg-teal-50 text-teal-600"
                    : "text-gray-500 active:bg-gray-100"
                  : active
                    ? "flex-col py-1.5 text-teal-600"
                    : "flex-col py-1.5 text-gray-500 active:bg-gray-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <i className={`${iconClass} ${festivalMode ? "mr-2 text-lg" : "mb-0.5 text-xl"}`} aria-hidden />
              <span className={`${festivalMode ? "text-sm font-semibold" : "w-full truncate text-center text-[10px] font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
