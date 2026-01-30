/**
 * 그룹 투표 목록 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §8
 */
import type { VoteItem } from '../types';
import { voteData } from '../mocks/voteData';

export async function getVotes(_groupId?: number): Promise<VoteItem[]> {
  // TODO: GET /api/groups/:groupId/votes
  return Promise.resolve(voteData);
}
