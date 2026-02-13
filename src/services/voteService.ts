/**
 * 그룹 투표 목록. GET /api/groups/:groupId/votes
 * 투표 생성. POST /api/groups/:groupId/votes
 * @see docs/API_SPEC.md §8
 */
import type { VoteItem, VoteParticipant } from "../types";
import { apiGet, apiPost } from "./apiClient";

/** 백엔드가 snake_case로 오면 camelCase로 맞춤 (total_members → totalMembers 등) */
function normalizeVoteItem(raw: Record<string, unknown>): VoteItem {
  const votes = (raw.votes as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: Number(raw.id ?? raw.voteId ?? 0),
    type: (raw.type as VoteItem["type"]) ?? "매도",
    stockName: String(raw.stockName ?? raw.stock_name ?? ""),
    stockCode: raw.stockCode != null ? String(raw.stockCode) : raw.stock_code != null ? String(raw.stock_code) : undefined,
    proposerId: Number(raw.proposerId ?? raw.proposer_id ?? 0),
    proposerName: String(raw.proposerName ?? raw.proposer_name ?? ""),
    quantity: Number(raw.quantity ?? 0),
    proposedPrice: Number(raw.proposedPrice ?? raw.proposed_price ?? 0),
    executionPrice:
      raw.executionPrice != null
        ? Number(raw.executionPrice)
        : raw.execution_price != null
          ? Number(raw.execution_price)
          : null,
    reason: String(raw.reason ?? ""),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    expiresAt: String(raw.expiresAt ?? raw.expires_at ?? ""),
    votes: votes.map((p) => ({
      orderId: Number(p.orderId ?? p.order_id ?? 0),
      userId: Number(p.userId ?? p.user_id ?? 0),
      userName: String(p.userName ?? p.user_name ?? ""),
      vote: (p.vote as VoteParticipant["vote"]) ?? "보류",
    })),
    totalMembers: Number(raw.totalMembers ?? raw.total_members ?? 0),
    status: (raw.status as VoteItem["status"]) ?? "ongoing",
  };
}

export async function getVotes(groupId?: number): Promise<VoteItem[]> {
  if (groupId == null) return [];
  const rawList = await apiGet<unknown>(`/api/groups/${groupId}/votes`);
  if (!Array.isArray(rawList)) return [];
  return rawList.map((raw) =>
    normalizeVoteItem(raw as Record<string, unknown>)
  );
}

export interface CreateVotePayload {
  type: "매수" | "매도";
  stockName: string;
  stockCode?: string;
  quantity: number;
  proposedPrice: number;
  reason: string;
}

export async function createVote(
  groupId: number,
  payload: CreateVotePayload
): Promise<{ success: boolean; voteId?: number; message?: string }> {
  const res = await apiPost<{ success: boolean; voteId?: number; message?: string }>(
    `/api/groups/${groupId}/votes`,
    payload
  );
  return res;
}

/** 투표 제출 (찬성/반대/보류). POST /api/groups/:groupId/votes/:voteId */
export async function submitVote(
  groupId: number,
  voteId: number,
  vote: "찬성" | "반대" | "보류"
): Promise<{ success: boolean; message?: string }> {
  const res = await apiPost<{ success: boolean; message?: string }>(
    `/api/groups/${groupId}/votes/${voteId}`,
    { vote }
  );
  return res;
}
