/**
 * API 응답·요청 타입 (API_SPEC.md 기준)
 * 백엔드 연동 시 동일 스펙으로 맞추면 됨.
 */

// ---- Auth / User ----
export interface User {
  id: string;
  email: string;
  nickname: string;
  totalAssets: number;
  investmentAmount: number;
  profitLoss: number;
  profitLossRate: number;
  /** 팀 소속 여부. null이면 팀 미소속(백엔드에서 제공) */
  teamId?: string | null;
  /** 역할. 'admin'이면 어드민 페이지 접근 가능(백엔드에서 제공) */
  role?: "user" | "admin";
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  user?: User;
}

// ---- My Investment / Home ----
export interface InvestmentData {
  totalAssets: number;
  profitLoss: number;
  profitLossPercentage: number;
  investmentPrincipal: number;
  cashBalance: number;
}

export interface StockHolding {
  id: number;
  name: string;
  quantity: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  logoColor: string;
}

export interface CompetitionSummary {
  name: string;
  endDate: string;
  daysRemaining: number;
}

export interface MyInvestmentResponse {
  investmentData: InvestmentData;
  stockHoldings: StockHolding[];
  competitionData: CompetitionSummary;
}

// ---- Market / Stock ----
export interface MarketIndex {
  id: number;
  name: string;
  value: number;
  change: number;
  changeRate: number;
}

export interface StockListItem {
  id: number;
  name: string;
  code: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  logoColor: string;
}

export interface MyHoldingItem {
  quantity: number;
  avgPrice: number;
  totalValue: number;
  totalProfit: number;
  profitRate: number;
}

export interface MarketDataItem {
  openPrice: number;
  closePrice: number;
  volume: number;
  lowPrice: number;
  highPrice: number;
}

export interface FinancialQuarter {
  quarter: string;
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
}

export interface StockNewsItem {
  id: number;
  title: string;
  source: string;
  date: string;
  summary: string;
}

/** 실시간 시세 WebSocket 수신 메시지 (백엔드 /prices 푸시) */
export interface RealtimePriceUpdate {
  stockCode: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  volume: number;
  updatedAtMillis: number;
}

export interface StockDetailResponse {
  id: number;
  name: string;
  code: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  logoColor: string;
  myHolding: MyHoldingItem | null;
  marketData: MarketDataItem;
  financialData: FinancialQuarter[];
  companyInfo: string;
  news: StockNewsItem[];
}

// ---- Competition (대회 — 랭킹 방식) ----
export interface CompetitionItem {
  id: number;
  name: string;
  endDate?: string;
  startDate?: string;
}

/** 관리자용 대회 (시작일·종료일 관리) */
export interface AdminCompetition {
  id: number;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: "upcoming" | "ongoing" | "ended";
}

// ---- Ranking ----
export interface GroupRankingItem {
  id: number;
  groupName: string;
  currentAssets: number;
  profitRate: number;
}

export interface MyGroupRankingResponse {
  id: number;
  rank: number;
  groupName: string;
  currentAssets: number;
  profitRate: number;
}

// ---- Group ----
export interface GroupHoldingItem {
  id: number;
  stockName: string;
  stockCode: string;
  currentPrice: number;
  quantity: number;
  averagePrice: number;
  currentValue: number;
}

export interface GroupPortfolioResponse {
  groupId: number;
  groupName: string;
  totalValue: number;
  investmentAmount: number;
  profitLoss: number;
  profitLossPercentage: number;
  holdings: GroupHoldingItem[];
}

export interface GroupStockHoldingsSummaryItem {
  id: number;
  name: string;
  logoColor: string;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface GroupMemberItem {
  id: number;
  nickname: string;
}

/** 대회에서 경쟁 중인 팀 한 건 (실시간 투자금·수익률·순위 표시용) */
export interface CompetingTeamItem {
  teamId: string;
  groupName: string;
  totalValue: number;
  investmentAmount: number;
  profitLoss: number;
  profitLossPercentage: number;
  rank: number;
  isMyTeam?: boolean;
}

// ---- Chat ----
export interface ChatTradeData {
  action: "매수" | "매도";
  stockName: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  reason: string;
  tags: string[];
  /** 중복 제거용 (투표 공유 시 voteId 등) */
  clientMessageId?: string | number;
}

/** 매수/매도 체결 완료 알림 메시지 데이터 */
export interface ChatExecutionData {
  action: "매수" | "매도";
  stockName: string;
  quantity: number;
  executionPrice: number;
}

export interface ChatMessageItem {
  id: number;
  type: "user" | "trade" | "execution";
  userId: number;
  userNickname: string;
  message?: string | null;
  timestamp: string;
  tradeData?: ChatTradeData | null;
  executionData?: ChatExecutionData | null;
}

// ---- Vote ----
export interface VoteParticipant {
  orderId: number;
  userId: number;
  userName: string;
  vote: "찬성" | "반대" | "보류";
}

export interface VoteItem {
  id: number;
  type: "매수" | "매도";
  stockName: string;
  /** 종목 코드 (같은 종목 중복 투표 방지용) */
  stockCode?: string;
  proposerId: number;
  proposerName: string;
  quantity: number;
  proposedPrice: number;
  /** 체결 시 실제 체결가 (체결된 경우에만 있음) */
  executionPrice?: number | null;
  reason: string;
  createdAt: string;
  expiresAt: string;
  votes: VoteParticipant[];
  totalMembers: number;
  status:
    | "ongoing"
    | "passed"
    | "rejected"
    | "expired"
    | "pending"
    | "executing"
    | "executed"
    | "cancelled";
  orderStrategy?: "MARKET" | "LIMIT" | "CONDITIONAL";
  limitPrice?: number;
  triggerPrice?: number;
  triggerDirection?: "ABOVE" | "BELOW";
  executionExpiresAt?: string;
  executedAt?: string;
}

// ---- Matching Room (매칭방) ----
export interface MatchingRoomMember {
  userId: string;
  nickname: string;
  joinedAt: string;
}

export interface MatchingRoom {
  id: string;
  name: string;
  capacity: number;
  memberCount: number;
  members: MatchingRoomMember[];
  status: "waiting" | "full" | "started";
  createdAt: string;
  /** 로그인 후 GET /api/matching-rooms 응답에 포함. 현재 사용자가 해당 방에 참가 중이면 true */
  isJoined?: boolean;
}
