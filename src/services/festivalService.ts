import { apiGet, apiPost } from "./apiClient";
import { getStockDetail } from "./stockService";

export interface FestivalParticipantInput {
  name: string;
  phoneNumber: string;
  privacyAgreed: boolean;
}

export interface FestivalSessionStartResponse {
  sessionId: number;
  displayName: string;
  startCash: number;
  startedAt: string;
}

export interface FestivalHoldingSnapshot {
  stockCode: string;
  stockName: string;
  quantity: number;
  snapshotPrice: number;
  evaluatedAmount: number;
}

export interface FestivalTradeHistoryItem {
  stockCode: string;
  stockName: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  orderPrice: number;
  executedPrice: number | null;
  status: "EXECUTED" | "PENDING" | "CANCELLED";
  createdAt: string;
  executedAt?: string | null;
}

export interface FestivalSessionCompletePayload {
  endCash: number;
  endPortfolioValue: number;
  endTotalValue: number;
  returnRate: number;
  mainStockName: string | null;
  tradeCount: number;
  unfilledOrderCount: number;
  holdingsSnapshot: FestivalHoldingSnapshot[];
  tradeHistory: FestivalTradeHistoryItem[];
}

export interface FestivalLeaderboardItem {
  sessionId: number;
  rank: number;
  displayName: string;
  mainStockName: string | null;
  endTotalValue: number;
  returnRate: number;
  prize: string;
  endedAt: string;
}

export interface FestivalSessionCompleteResponse {
  sessionId: number;
  displayName: string;
  startCash: number;
  endTotalValue: number;
  returnRate: number;
  basePrize: string;
  finalPrize: string;
  currentRank: number | null;
  leaderboard: FestivalLeaderboardItem[];
}

export interface FestivalAdminSessionItem {
  sessionId: number;
  status: "IN_PROGRESS" | "COMPLETED";
  participantName: string;
  displayName: string;
  department: string;
  studentId: string;
  phoneNumber: string;
  startCash: number;
  endCash: number | null;
  endPortfolioValue: number | null;
  endTotalValue: number | null;
  returnRate: number | null;
  mainStockName: string | null;
  basePrize: string | null;
  finalPrize: string | null;
  tradeCount: number;
  unfilledOrderCount: number;
  startedAt: string;
  endedAt: string | null;
  holdingsSnapshot: FestivalHoldingSnapshot[] | null;
  tradeHistory: FestivalTradeHistoryItem[] | null;
}

export interface FestivalAdminOverview {
  totalParticipants: number;
  completedParticipants: number;
  activeParticipants: number;
  qualifiedParticipants: number;
  averageReturnRate: number;
  bestReturnRate: number | null;
  lastCompletedAt: string | null;
  sessions: FestivalAdminSessionItem[];
}

export interface FestivalStockSearchItem {
  stockId: string;
  name: string;
  symbol: string;
  market: string;
}

interface FestivalStockSearchResponse {
  items: FestivalStockSearchItem[];
}

export interface FestivalMarketIndex {
  id: number;
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export interface FestivalMarketStock {
  id: number;
  name: string;
  code: string;
  currentPrice: number;
  change: number;
  changeRate: number;
}

export function startFestivalSession(body: FestivalParticipantInput) {
  return apiPost<FestivalSessionStartResponse>("/api/festival/sessions/start", body, {
    skipAuth: true,
  });
}

export function completeFestivalSession(sessionId: number, body: FestivalSessionCompletePayload) {
  return apiPost<FestivalSessionCompleteResponse>(
    `/api/festival/sessions/${sessionId}/complete`,
    body,
    { skipAuth: true },
  );
}

export function getFestivalLeaderboard() {
  return apiGet<FestivalLeaderboardItem[]>("/api/festival/leaderboard", {
    skipAuth: true,
  });
}

export function getFestivalAdminOverview() {
  return apiGet<FestivalAdminOverview>("/api/festival-admin/overview");
}

export async function searchFestivalStocks(keyword: string) {
  const query = keyword.trim();
  if (!query) return [];
  const response = await apiGet<FestivalStockSearchResponse>(
    `/api/stocks/search?query=${encodeURIComponent(query)}&limit=12`,
    { skipAuth: true },
  );
  return response.items ?? [];
}

export async function getFestivalStockDetail(stockCode: string) {
  return getStockDetail(Number(stockCode));
}

export function getFestivalMarketIndices() {
  return apiGet<FestivalMarketIndex[]>("/api/market/indices", { skipAuth: true });
}

export function getFestivalMarketTicker() {
  return apiGet<FestivalMarketStock[]>("/api/market/stocks?sort=volume", { skipAuth: true });
}
