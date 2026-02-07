/**
 * 랭킹. GET /api/ranking/groups, /api/ranking/my-group
 * @see docs/API_SPEC.md §5
 */
import type { GroupRankingItem, MyGroupRankingResponse } from "../types";
import { apiGet } from "./apiClient";

export async function getAllGroupsRanking(): Promise<GroupRankingItem[]> {
  return await apiGet<GroupRankingItem[]>("/api/ranking/groups");
}

export async function getMyGroupRanking(): Promise<MyGroupRankingResponse> {
  return await apiGet<MyGroupRankingResponse>("/api/ranking/my-group");
}
