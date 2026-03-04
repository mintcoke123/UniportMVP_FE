import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { User } from "../types";
import { DEFAULT_ASSETS } from "../constants/auth";
import {
  apiPost,
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  getCurrentUserStorageKey,
  ApiError,
} from "../services/apiClient";
import { getMe } from "../services/meService";
import { getGroupPortfolio } from "../services/groupService";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  /** 새로고침 후 /me 검증이 끝났는지. false면 ProtectedRoute에서 로그인 리다이렉트 보류 */
  authInitialized: boolean;
  /** 어드민 계정 여부(role === 'admin'). /admin 접근 시 사용 */
  isAdmin: boolean;
  /** SISU-admin(준관리자) 여부. /SISU-admin 전용. */
  isSisuAdmin: boolean;
  /** /SISU-admin 페이지 접근 가능 (admin 또는 sisu_admin) */
  canAccessSisuAdmin: boolean;
  login: (
    studentId: string,
    password: string
  ) => Promise<{ success: boolean; message: string; isAdmin?: boolean; isSisuAdmin?: boolean }>;
  signup: (
    studentId: string,
    password: string,
    nickname: string,
    phoneNumber: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUserAssets: (
    assets: Partial<
      Pick<
        User,
        "totalAssets" | "investmentAmount" | "profitLoss" | "profitLossRate"
      >
    >
  ) => void;
  /** 매칭방에서 3명 모여 모의투자 시작 시 팀 확정 → teamId 설정 */
  updateUserTeam: (teamId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const isLoggedIn = user !== null;
  const isAdmin = user?.role === "admin";
  const isSisuAdmin = user?.role === "sisu_admin";
  const canAccessSisuAdmin = isAdmin || isSisuAdmin;

  // 새로고침 시: 캐시를 믿지 않고 반드시 /me로 검증. 실패/빈 응답이면 로그아웃 처리해 엉뚱한 유저 표시 방지.
  useEffect(() => {
    const storageKey = getCurrentUserStorageKey();
    const token = getAuthToken();
    if (!token) {
      if (typeof localStorage !== "undefined") localStorage.removeItem(storageKey);
      setAuthInitialized(true);
      return;
    }
    let cancelled = false;
    getMe()
      .then((data) => {
        if (cancelled) return;
        if (data?.id) {
          const synced: User = {
            id: data.id,
            studentId: data.studentId ?? "",
            nickname: data.nickname ?? "",
            totalAssets: data.totalAssets ?? 0,
            investmentAmount: data.investmentAmount ?? 0,
            profitLoss: data.profitLoss ?? 0,
            profitLossRate: data.profitLossRate ?? 0,
            teamId: data.teamId ?? null,
            role: (data.role as "user" | "admin" | "sisu_admin") ?? "user",
          };
          setUser(synced);
          localStorage.setItem(storageKey, JSON.stringify(synced));
          const teamId = data.teamId ?? null;
          if (teamId && String(teamId).startsWith("team-")) {
            const gid = parseInt(String(teamId).replace(/^team-/, ""), 10);
            if (!Number.isNaN(gid))
              getGroupPortfolio(gid).then((portfolio) => {
                if (cancelled || !portfolio) return;
                setUser((prev) =>
                  prev
                    ? {
                        ...prev,
                        totalAssets: portfolio.totalValue,
                        investmentAmount: portfolio.investmentAmount,
                        profitLoss: portfolio.profitLoss,
                        profitLossRate: portfolio.profitLossPercentage,
                      }
                    : null
                );
                const updated = {
                  ...synced,
                  totalAssets: portfolio.totalValue,
                  investmentAmount: portfolio.investmentAmount,
                  profitLoss: portfolio.profitLoss,
                  profitLossRate: portfolio.profitLossPercentage,
                };
                localStorage.setItem(storageKey, JSON.stringify(updated));
              });
          }
        } else {
          clearAuthToken();
          setUser(null);
        }
        setAuthInitialized(true);
      })
      .catch(() => {
        if (!cancelled) {
          clearAuthToken();
          setUser(null);
        }
        setAuthInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onSessionExpired = () => setUser(null);
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", onSessionExpired);
  }, []);

  const login = async (
    studentId: string,
    password: string
  ): Promise<{ success: boolean; message: string; isAdmin?: boolean; isSisuAdmin?: boolean }> => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        user?: {
          id: string;
          studentId: string;
          nickname: string;
          totalAssets: number;
          investmentAmount: number;
          profitLoss: number;
          profitLossRate: number;
          teamId?: string | null;
          role?: "user" | "admin" | "sisu_admin";
        };
        token?: string;
      }>("/api/auth/login", { studentId, password }, { skipAuth: true });

      if (res.success && res.user && res.token) {
        const u = res.user;
        const userToSet: User = {
          id: u.id,
          studentId: u.studentId,
          nickname: u.nickname,
          totalAssets: u.totalAssets ?? 0,
          investmentAmount: u.investmentAmount ?? 0,
          profitLoss: u.profitLoss ?? 0,
          profitLossRate: u.profitLossRate ?? 0,
          teamId: u.teamId ?? null,
          role: u.role ?? "user",
        };
        setAuthToken(String(res.token).trim());
        setUser(userToSet);
        localStorage.setItem(getCurrentUserStorageKey(), JSON.stringify(userToSet));
        const teamId = u.teamId ?? null;
        if (teamId && String(teamId).startsWith("team-")) {
          const gid = parseInt(String(teamId).replace(/^team-/, ""), 10);
          if (!Number.isNaN(gid))
            getGroupPortfolio(gid).then((portfolio) => {
              if (portfolio) {
                const withTeamAssets: User = {
                  ...userToSet,
                  totalAssets: portfolio.totalValue,
                  investmentAmount: portfolio.investmentAmount,
                  profitLoss: portfolio.profitLoss,
                  profitLossRate: portfolio.profitLossPercentage,
                };
                setUser(withTeamAssets);
                localStorage.setItem(
                  getCurrentUserStorageKey(),
                  JSON.stringify(withTeamAssets)
                );
              }
            });
        }
        return {
          success: true,
          message: res.message ?? "로그인 성공!",
          isAdmin: userToSet.role === "admin",
          isSisuAdmin: userToSet.role === "sisu_admin",
        };
      }
      return {
        success: false,
        message:
          (res as { message?: string }).message ?? "로그인에 실패했습니다.",
      };
    } catch (e) {
      const err = e as ApiError;
      return {
        success: false,
        message:
          err.message ?? "학번 또는 비밀번호가 올바르지 않습니다.",
      };
    }
    return {
      success: false,
      message: "학번 또는 비밀번호가 올바르지 않습니다.",
    };
  };

  /** 네트워크/영문 기술 메시지를 사용자용 한글 메시지로 치환 (회원가입 시 '포스틱' 등 오표기 방지) */
  const normalizeSignupErrorMessage = (msg: string | undefined): string => {
    if (!msg || !msg.trim()) return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    const lower = msg.toLowerCase();
    if (
      lower.startsWith("request failed") ||
      lower.startsWith("failed to fetch") ||
      lower === "network error" ||
      lower.includes("network request failed") ||
      /^\s*error\s*:\s*/i.test(msg.trim())
    ) {
      return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }
    return msg.trim();
  };

  const signup = async (
    studentId: string,
    password: string,
    nickname: string,
    phoneNumber: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        user?: {
          id: string;
          studentId: string;
          nickname: string;
          totalAssets?: number;
          investmentAmount?: number;
          profitLoss?: number;
          profitLossRate?: number;
          teamId?: string | null;
          role?: string;
        };
      }>("/api/auth/signup", { studentId, password, nickname, phoneNumber }, { skipAuth: true });

      if (res.success) {
        return {
          success: true,
          message: res.message ?? "회원가입이 완료되었습니다. 로그인해 주세요.",
        };
      }
      const rawMessage = (res as { message?: string }).message ?? "회원가입에 실패했습니다.";
      return {
        success: false,
        message: normalizeSignupErrorMessage(rawMessage),
      };
    } catch (e) {
      const err = e as ApiError;
      return {
        success: false,
        message: normalizeSignupErrorMessage(err?.message),
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(getCurrentUserStorageKey());
    clearAuthToken();
  };

  const updateUserAssets = (
    assets: Partial<
      Pick<
        User,
        "totalAssets" | "investmentAmount" | "profitLoss" | "profitLossRate"
      >
    >
  ) => {
    if (!user) return;
    const updatedUser = { ...user, ...assets };
    setUser(updatedUser);
    localStorage.setItem(getCurrentUserStorageKey(), JSON.stringify(updatedUser));
  };

  const updateUserTeam = (teamId: string | null) => {
    if (!user) return;
    const updatedUser = { ...user, teamId };
    setUser(updatedUser);
    localStorage.setItem(getCurrentUserStorageKey(), JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        authInitialized,
        isAdmin,
        isSisuAdmin,
        canAccessSisuAdmin,
        login,
        signup,
        logout,
        updateUserAssets,
        updateUserTeam,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
