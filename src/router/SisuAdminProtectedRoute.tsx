import { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface SisuAdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 비로그인 또는 SISU-admin 페이지 접근 권한 없을 때 /login 리다이렉트.
 * admin, sisu_admin 둘 다 /SISU-admin 접근 가능.
 */
export default function SisuAdminProtectedRoute({
  children,
}: SisuAdminProtectedRouteProps) {
  const { isLoggedIn, canAccessSisuAdmin, authInitialized } = useAuth();

  if (!authInitialized) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-gray-500">
        로딩 중...
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: "/SISU-admin", requireSisuAdmin: true }}
      />
    );
  }

  if (!canAccessSisuAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: "/SISU-admin", requireSisuAdmin: true }}
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
