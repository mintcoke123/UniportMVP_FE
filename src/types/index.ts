/**
 * API 응답·요청 타입 (API_SPEC.md 기준)
 * 백엔드 연동 시 동일 스펙으로 맞추면 됨.
 */

// ---- Auth / User ----
export interface User {
  id: string;
  email: string;
  nickname: string;
  profileImage: string;
  totalAssets: number;
  investmentAmount: number;
  profitLoss: number;
  profitLossRate: number;
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

export interface TournamentSummary {
  name: string;
  endDate: string;
  daysRemaining: number;
}

export interface MyInvestmentResponse {
  investmentData: InvestmentData;
  stockHoldings: StockHolding[];
  tournamentData: TournamentSummary;
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

// ---- Tournament ----
export interface TournamentItem {
  id: number;
  name: string;
  endDate?: string;
  startDate?: string;
}

// ---- Ranking ----
export interface GroupRankingItem {
  id: number;
  groupName: string;
  profileImage: string;
  currentAssets: number;
  profitRate: number;
}

export interface MyGroupRankingResponse {
  id: number;
  rank: number;
  groupName: string;
  profileImage: string;
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
  profileImage: string;
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
  profileImage: string;
}

// ---- Chat ----
export interface ChatTradeData {
  action: '매수' | '매도';
  stockName: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  reason: string;
  tags: string[];
}

export interface ChatMessageItem {
  id: number;
  type: 'user' | 'trade';
  userId: number;
  userNickname: string;
  userProfileImage: string;
  message?: string | null;
  timestamp: string;
  tradeData?: ChatTradeData | null;
}

// ---- Vote ----
export interface VoteParticipant {
  oderId: number; // API 명세에서는 orderId 권장
  userId: number;
  userName: string;
  userImage: string;
  vote: '찬성' | '반대';
}

export interface VoteItem {
  id: number;
  type: '매수' | '매도';
  stockName: string;
  proposerId: number;
  proposerName: string;
  proposerImage: string;
  quantity: number;
  proposedPrice: number;
  reason: string;
  createdAt: string;
  expiresAt: string;
  votes: VoteParticipant[];
  totalMembers: number;
  status: 'ongoing' | 'passed' | 'rejected' | 'expired';
}
