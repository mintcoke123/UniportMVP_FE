import { Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 비로그인 시 /login 으로 리다이렉트. 로그인 후 원래 가려던 경로로 돌아갈 수 있도록 state.from 전달.
 * 새로고침 직후 /me 검증이 끝나기 전에는 리다이렉트하지 않고 로딩만 표시.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, authInitialized } = useAuth();
  const location = useLocation();

  if (!authInitialized) {
    return <div className="flex justify-center items-center min-h-[40vh] text-gray-500">로딩 중...</div>;
  }
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Suspense fallback={<div className="flex justify-center items-center min-h-[40vh] text-gray-500">로딩 중...</div>}>{children}</Suspense>;
}
