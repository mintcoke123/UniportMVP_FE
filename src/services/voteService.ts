/**
 * 그룹 투표 목록. GET /api/groups/:groupId/votes
 * 투표 생성. POST /api/groups/:groupId/votes
 * @see docs/API_SPEC.md §8
 */
import type { VoteItem } from "../types";
import { apiGet, apiPost } from "./apiClient";

export async function getVotes(groupId?: number): Promise<VoteItem[]> {
  if (groupId == null) return [];
  return await apiGet<VoteItem[]>(`/api/groups/${groupId}/votes`);
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
