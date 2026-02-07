/**
 * Backend API 클라이언트
 * - Base URL: VITE_API_BASE_URL (default http://localhost:8080)
 * - 인증: Authorization: Bearer {token} (localStorage "authToken")
 * @see docs/API_SPEC.md
 */

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:8080";
};

/** localStorage 토큰 키. "token"이 아니라 "authToken" 사용. 디버깅 시 getItem("authToken") 확인 */
const AUTH_TOKEN_KEY = "authToken";

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export interface RequestConfig extends RequestInit {
  /** true면 Authorization 헤더 미포함 (로그인/회원가입 등) */
  skipAuth?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  status?: number;
}

async function request<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { skipAuth, ...init } = config;
  const baseUrl = getBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (!skipAuth) {
    const raw = getAuthToken();
    const token = raw?.trim();
    if (token)
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include", // CORS allowCredentials(true)와 맞추기 (쿠키/세션 필요 시)
  });

  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (res.status === 401 && !config.skipAuth) {
    clearAuthToken();
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }

  if (!res.ok) {
    const message =
      isJson && body && typeof body.message === "string"
        ? body.message
        : `Request failed: ${res.status}`;
    const err: ApiError = { success: false, message, status: res.status };
    throw err;
  }

  return body as T;
}

/** GET */
export function apiGet<T>(path: string, config?: RequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: "GET" });
}

/** POST */
export function apiPost<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>(path, {
    ...config,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PATCH */
export function apiPatch<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>(path, {
    ...config,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE */
export function apiDelete<T>(path: string, config?: RequestConfig): Promise<T> {
  return request<T>(path, { ...config, method: "DELETE" });
}
