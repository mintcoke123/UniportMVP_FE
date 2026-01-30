/**
 * 랭킹 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §5
 */
import type { GroupRankingItem, MyGroupRankingResponse } from '../types';
import { allGroupsRanking, myGroupRanking } from '../mocks/rankingData';

export async function getAllGroupsRanking(): Promise<GroupRankingItem[]> {
  // TODO: GET /api/ranking/groups
  return Promise.resolve(allGroupsRanking);
}

export async function getMyGroupRanking(): Promise<MyGroupRankingResponse> {
  // TODO: GET /api/ranking/my-group
  return Promise.resolve(myGroupRanking);
}
