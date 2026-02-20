/**
 * 그룹 채팅. GET/POST /api/groups/:groupId/chat/messages
 * - Authorization 헤더 필수. 로그인 안 되면 401, 해당 그룹(매칭방) 멤버가 아니면 403.
 * @see docs/API_SPEC.md §7
 */
import type { ChatMessageItem } from "../types";
import { apiGet, apiPost, getAuthToken, type ApiError } from "./apiClient";

const getWsBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  const base = url ? url.replace(/\/$/, "") : "http://localhost:8080";
  return base.replace(/^http/, "ws");
};

/** WebSocket 채팅 연결 URL. token 쿼리 필수 — 서버에서 검증·멤버 여부 확인 후 비멤버는 POLICY_VIOLATION으로 종료 */
export function getChatWebSocketUrl(groupId: number): string | null {
  const token = getAuthToken()?.trim();
  if (!token) return null;
  const base = getWsBaseUrl();
  return `${base}/groups/${groupId}/chat?token=${encodeURIComponent(token)}`;
}

const FORBIDDEN_MESSAGE =
  "이 그룹의 멤버가 아닙니다. 해당 채팅방에 참가한 멤버만 읽고 쓸 수 있습니다.";

/** GET 응답: { roomId, messages }. groupId 없거나 API 실패 시 빈 배열. 403 시 throw */
export async function getChatMessages(
  groupId?: number,
): Promise<ChatMessageItem[]> {
  if (groupId == null) return [];
  try {
    const body = await apiGet<
      { roomId: number; messages: ChatMessageItem[] } | ChatMessageItem[]
    >(`/api/groups/${groupId}/chat/messages`);
    if (Array.isArray(body)) return body;
    return body.messages ?? [];
  } catch (e) {
    const err = e as ApiError;
    if (err.status === 403) throw new Error(err.message || FORBIDDEN_MESSAGE);
    return [];
  }
}

/** 메시지 전송. POST /api/groups/:groupId/chat/messages (로그인 필수, 멤버 아니면 403) */
export async function sendChatMessage(
  groupId: number,
  message: string,
): Promise<{ success: boolean; messageId?: number; message?: string }> {
  try {
    const res = await apiPost<{ success: boolean; messageId?: number }>(
      `/api/groups/${groupId}/chat/messages`,
      { message },
    );
    return res;
  } catch (e) {
    const err = e as ApiError;
    const messageText =
      err.status === 403
        ? err.message || FORBIDDEN_MESSAGE
        : (err.message ?? "메시지 전송에 실패했습니다.");
    return { success: false, message: messageText };
  }
}

/** 투자계획 공유 메시지 전송 (채팅에 trade 카드 + 투표 생성은 별도 createVote 호출) */
export async function sendTradeMessage(
  groupId: number,
  tradeData: {
    action: "매수" | "매도";
    stockName: string;
    quantity: number;
    pricePerShare: number;
    totalAmount: number;
    reason: string;
    tags: string[];
  },
): Promise<{ success: boolean; messageId?: number; message?: string }> {
  try {
    const res = await apiPost<{ success: boolean; messageId?: number }>(
      `/api/groups/${groupId}/chat/messages`,
      { type: "trade", tradeData },
    );
    return res;
  } catch (e) {
    const err = e as ApiError;
    const messageText =
      err.status === 403
        ? err.message || FORBIDDEN_MESSAGE
        : (err.message ?? "공유에 실패했습니다.");
    return { success: false, message: messageText };
  }
}
