import { Outlet } from "react-router-dom";
import Header from "../feature/Header";
import BottomNav from "../feature/BottomNav";

/**
 * 공통 레이아웃: 헤더 + 페이지 컨텐츠(Outlet) + 모바일 하단 네비게이션.
 */
export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Header />
      <main className="flex-1 min-h-0 pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
