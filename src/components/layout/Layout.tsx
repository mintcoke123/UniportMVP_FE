import { Outlet } from "react-router-dom";
import Header from "../feature/Header";

/**
 * 공통 레이아웃: 헤더 + 페이지 컨텐츠(Outlet).
 * 라우터에서 헤더가 필요한 경로는 이 레이아웃의 자식으로 등록한다.
 */
export default function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
