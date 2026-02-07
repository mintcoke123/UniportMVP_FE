/**
 * 홈 자산 데이터: GET /api/me/investment (인증 필요).
 * @see docs/API_SPEC.md §2
 */
import type {
  MyInvestmentResponse,
  InvestmentData,
  StockHolding,
  CompetitionSummary,
} from "../types";
import { apiGet } from "./apiClient";

interface ApiMeInvestment {
  investmentData: {
    totalAssets: number;
    profitLoss: number;
    profitLossPercentage: number;
    investmentPrincipal: number;
    cashBalance: number;
  };
  stockHoldings: Array<{
    id: number;
    name: string;
    quantity: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    logoColor: string;
  }>;
  competitionData: {
    name: string;
    endDate: string;
    daysRemaining: number;
  };
}

export async function getMyInvestment(): Promise<MyInvestmentResponse> {
  const res = await apiGet<ApiMeInvestment>("/api/me/investment");
  const inv = res.investmentData;
  const investmentData: InvestmentData = {
    totalAssets: inv.totalAssets,
    profitLoss: inv.profitLoss,
    profitLossPercentage: inv.profitLossPercentage,
    investmentPrincipal: inv.investmentPrincipal,
    cashBalance: inv.cashBalance,
  };
  const stockHoldings: StockHolding[] = res.stockHoldings.map((h) => ({
    id: h.id,
    name: h.name,
    quantity: h.quantity,
    currentValue: h.currentValue,
    profitLoss: h.profitLoss,
    profitLossPercentage: h.profitLossPercentage,
    logoColor: h.logoColor ?? "#6B7280",
  }));
  const competitionData: CompetitionSummary = {
    name: res.competitionData.name,
    endDate: res.competitionData.endDate,
    daysRemaining: res.competitionData.daysRemaining,
  };
  return { investmentData, stockHoldings, competitionData };
}
