/**
 * 그룹 포트폴리오·멤버·경쟁 팀. GET /api/groups/:groupId, /api/me/competition/competing-teams 등
 * @see docs/API_SPEC.md §6
 */
import type {
  GroupPortfolioResponse,
  GroupStockHoldingsSummaryItem,
  GroupMemberItem,
  CompetingTeamItem,
} from "../types";
import { apiGet } from "./apiClient";

export async function getGroupPortfolio(
  groupId?: number,
): Promise<GroupPortfolioResponse | null> {
  if (groupId == null) return null;
  return await apiGet<GroupPortfolioResponse>(`/api/groups/${groupId}`);
}

/** 내 그룹(팀) 포트폴리오. GET /api/groups/me — user.teamId 없을 때 채팅용 groupId 조회 */
export async function getMyGroupPortfolio(): Promise<GroupPortfolioResponse | null> {
  try {
    const data = await apiGet<GroupPortfolioResponse>("/api/groups/me");
    if (data && process.env.NODE_ENV !== "production") {
      const holdings = (data.holdings ?? []).map((h) => ({
        stockCode: h.stockCode,
        currentPrice: h.currentPrice,
        quantity: h.quantity,
        currentValue: h.currentValue,
        averagePrice: h.averagePrice,
      }));
      console.debug("[portfolio]", {
        source: "me",
        totalValue: data.totalValue,
        profitLoss: data.profitLoss,
        profitLossPercentage: data.profitLossPercentage,
        holdings,
      });
    }
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getGroupStockHoldings(
  groupId?: number,
): Promise<GroupStockHoldingsSummaryItem[]> {
  if (groupId == null) return [];
  return await apiGet<GroupStockHoldingsSummaryItem[]>(
    `/api/groups/${groupId}/holdings-summary`,
  );
}

export async function getGroupMembers(
  groupId?: number,
): Promise<GroupMemberItem[]> {
  if (groupId == null) return [];
  return await apiGet<GroupMemberItem[]>(`/api/groups/${groupId}/members`);
}

/** 대회에 참가 중인 경쟁 팀 목록. GET /api/me/competition/competing-teams (인증) 또는 GET /api/competitions/:id/teams */
export async function getCompetingTeams(
  competitionId?: number,
): Promise<CompetingTeamItem[]> {
  if (competitionId != null) {
    return await apiGet<CompetingTeamItem[]>(
      `/api/competitions/${competitionId}/teams`,
    );
  }
  return await apiGet<CompetingTeamItem[]>(
    "/api/me/competition/competing-teams",
  );
}
