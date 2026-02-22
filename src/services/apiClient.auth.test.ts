/**
 * 인증 스토리지 동작 검증 (새로고침 시 로그아웃/엉뚱한 유저 방지).
 * 실행: npx vitest run src/services/apiClient.auth.test.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getCurrentUserStorageKey,
} from "./apiClient";

describe("auth storage", () => {
  const storage: Record<string, string> = {};
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
      length: 0,
      key: () => null,
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses namespaced keys", () => {
    expect(getCurrentUserStorageKey()).toBe("uniport_currentUser");
  });

  it("persists and reads token", () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken("jwt.here");
    expect(getAuthToken()).toBe("jwt.here");
  });

  it("clearAuthToken removes both token and currentUser key", () => {
    setAuthToken("jwt");
    (globalThis.localStorage as Storage).setItem(
      getCurrentUserStorageKey(),
      JSON.stringify({ id: "1", email: "a@b.com" })
    );
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect((globalThis.localStorage as Storage).getItem(getCurrentUserStorageKey())).toBeNull();
  });
});
