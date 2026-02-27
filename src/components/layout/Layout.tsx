import { Outlet } from "react-router-dom";
import Header from "../feature/Header";
import BottomNav from "../feature/BottomNav";

/**
 * 공통 레이아웃: 헤더 + 페이지 컨텐츠(Outlet) + 모바일 하단 네비게이션.
 */
export default function Layout() {
  return (
    <>
      <Header />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}
