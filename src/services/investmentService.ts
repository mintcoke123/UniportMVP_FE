/**
 * 홈 자산 데이터: 표시 텍스트는 "나의 총 자산"이지만,
 * 실제 데이터는 해당 사용자가 속한 팀(같은 채팅방·토너먼트 팀)의 자산/보유 종목을 반환.
 * @see docs/API_SPEC.md §2
 */
import type { MyInvestmentResponse, InvestmentData, StockHolding, TournamentSummary } from '../types';
import { getGroupPortfolio, getGroupStockHoldings } from './groupService';
import { tournamentData } from '../mocks/investmentData';

export async function getMyInvestment(): Promise<MyInvestmentResponse> {
  // TODO: replace with GET /api/me/team-investment or GET /api/groups/me/portfolio
  const [group, holdingsSummary] = await Promise.all([
    getGroupPortfolio(),
    getGroupStockHoldings(),
  ]);

  const totalInvestedInStocks = group.holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const cashBalance = group.totalValue - totalInvestedInStocks;

  const investmentData: InvestmentData = {
    totalAssets: group.totalValue,
    profitLoss: group.profitLoss,
    profitLossPercentage: group.profitLossPercentage,
    investmentPrincipal: group.investmentAmount,
    cashBalance,
  };

  const logoById = Object.fromEntries(holdingsSummary.map((s) => [s.id, s.logoColor]));
  const stockHoldings: StockHolding[] = group.holdings.map((h) => {
    const cost = h.averagePrice * h.quantity;
    const profitLoss = h.currentValue - cost;
    const profitLossPercentage = cost > 0 ? (profitLoss / cost) * 100 : 0;
    return {
      id: h.id,
      name: h.stockName,
      quantity: h.quantity,
      currentValue: h.currentValue,
      profitLoss,
      profitLossPercentage,
      logoColor: logoById[h.id] ?? '#6B7280',
    };
  });

  const tournamentDataSummary: TournamentSummary = {
    name: tournamentData.name,
    endDate: tournamentData.endDate,
    daysRemaining: tournamentData.daysRemaining,
  };

  return Promise.resolve({
    investmentData,
    stockHoldings,
    tournamentData: tournamentDataSummary,
  });
}
