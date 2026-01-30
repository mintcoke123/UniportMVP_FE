/**
 * 그룹 포트폴리오·멤버 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §6
 */
import type {
  GroupPortfolioResponse,
  GroupStockHoldingsSummaryItem,
  GroupMemberItem,
} from '../types';
import {
  groupPortfolioData,
  groupStockHoldings,
  groupMembers,
} from '../mocks/groupPortfolioData';

export async function getGroupPortfolio(
  _groupId?: number
): Promise<GroupPortfolioResponse> {
  // TODO: GET /api/groups/:groupId (or /api/groups/me)
  return Promise.resolve(groupPortfolioData);
}

export async function getGroupStockHoldings(
  _groupId?: number
): Promise<GroupStockHoldingsSummaryItem[]> {
  // TODO: GET /api/groups/:groupId/holdings-summary
  return Promise.resolve(groupStockHoldings);
}

export async function getGroupMembers(
  _groupId?: number
): Promise<GroupMemberItem[]> {
  // TODO: GET /api/groups/:groupId/members
  return Promise.resolve(groupMembers);
}
