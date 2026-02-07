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
  ApiError,
} from "../services/apiClient";
import { getMe } from "../services/meService";
import { getGroupPortfolio } from "../services/groupService";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  /** 어드민 계정 여부(role === 'admin'). 어드민 페이지 접근 시 사용 */
  isAdmin: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; isAdmin?: boolean }>;
  signup: (
    email: string,
    password: string,
    nickname: string
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
  const isLoggedIn = user !== null;
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const token = getAuthToken();
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        getMe()
          .then((data) => {
            if (data?.id) {
              const synced: User = {
                id: data.id,
                email: data.email ?? "",
                nickname: data.nickname ?? "",
                password: "",
                totalAssets: data.totalAssets ?? 0,
                investmentAmount: data.investmentAmount ?? 0,
                profitLoss: data.profitLoss ?? 0,
                profitLossRate: data.profitLossRate ?? 0,
                teamId: data.teamId ?? null,
                role: (data.role as "user" | "admin") ?? "user",
              };
              setUser(synced);
              localStorage.setItem("currentUser", JSON.stringify(synced));
              const teamId = data.teamId ?? null;
              if (teamId && String(teamId).startsWith("team-")) {
                const gid = parseInt(String(teamId).replace(/^team-/, ""), 10);
                if (!Number.isNaN(gid))
                  getGroupPortfolio(gid).then((portfolio) => {
                    if (portfolio) {
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
                      localStorage.setItem(
                        "currentUser",
                        JSON.stringify(updated)
                      );
                    }
                  });
              }
            }
          })
          .catch(() => {});
      } catch {
        localStorage.removeItem("currentUser");
        clearAuthToken();
      }
    } else if (savedUser && !token) {
      localStorage.removeItem("currentUser");
    }
  }, []);

  useEffect(() => {
    const onSessionExpired = () => setUser(null);
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", onSessionExpired);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; isAdmin?: boolean }> => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        user?: {
          id: string;
          email: string;
          nickname: string;
          totalAssets: number;
          investmentAmount: number;
          profitLoss: number;
          profitLossRate: number;
          teamId?: string | null;
          role?: "user" | "admin";
        };
        token?: string;
      }>("/api/auth/login", { email, password }, { skipAuth: true });

      if (res.success && res.user && res.token) {
        const u = res.user;
        const userToSet: User = {
          id: u.id,
          email: u.email,
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
        localStorage.setItem("currentUser", JSON.stringify(userToSet));
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
                  "currentUser",
                  JSON.stringify(withTeamAssets)
                );
              }
            });
        }
        return {
          success: true,
          message: res.message ?? "로그인 성공!",
          isAdmin: userToSet.role === "admin",
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
          err.message ?? "이메일 또는 비밀번호가 올바르지 않습니다.",
      };
    }
    return {
      success: false,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    };
  };

  const signup = async (
    email: string,
    password: string,
    nickname: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        user?: {
          id: string;
          email: string;
          nickname: string;
          totalAssets?: number;
          investmentAmount?: number;
          profitLoss?: number;
          profitLossRate?: number;
          teamId?: string | null;
          role?: string;
        };
      }>("/api/auth/signup", { email, password, nickname }, { skipAuth: true });

      if (res.success) {
        // 회원가입만 완료. 로그인은 하지 않고 로그인 페이지로 보냄.
        return {
          success: true,
          message: res.message ?? "회원가입이 완료되었습니다. 로그인해 주세요.",
        };
      }
      return {
        success: false,
        message:
          (res as { message?: string }).message ?? "회원가입에 실패했습니다.",
      };
    } catch (e) {
      const err = e as ApiError;
      return {
        success: false,
        message: err.message ?? "가입 정보를 확인해 주세요.",
      };
    }
    return {
      success: false,
      message: "회원가입에 실패했습니다.",
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
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
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const updateUserTeam = (teamId: string | null) => {
    if (!user) return;
    const updatedUser = { ...user, teamId };
    setUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isAdmin,
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
