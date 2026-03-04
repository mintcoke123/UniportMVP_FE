import { Outlet } from "react-router-dom";
import Header from "../feature/Header";
import BottomNav from "../feature/BottomNav";

/**
 * 공통 레이아웃: 헤더(lg 이상만 표시) + 페이지 컨텐츠(Outlet) + 모바일 하단 네비게이션.
 */
export default function Layout() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
