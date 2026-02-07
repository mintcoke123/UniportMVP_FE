import { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 비로그인 또는 비어드민 시 /login 으로 리다이렉트.
 * 어드민 페이지 접근 시에만 사용. state.requireAdmin 으로 로그인 페이지에서 안내 메시지 표시.
 */
export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const { isLoggedIn, isAdmin } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: "/admin", requireAdmin: true }}
      />
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: "/admin", requireAdmin: true }}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[40vh] text-gray-500">
          로딩 중...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
