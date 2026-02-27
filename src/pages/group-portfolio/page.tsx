import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyGroupPortfolio,
  getGroupPortfolio,
  getGroupStockHoldings,
  getGroupMembers,
  getCompetingTeams,
} from "../../services";
import type {
  GroupPortfolioResponse,
  GroupStockHoldingsSummaryItem,
  GroupMemberItem,
  CompetingTeamItem,
} from "../../types";

export default function GroupPortfolioPage() {
  const navigate = useNavigate();
  const [groupPortfolioData, setGroupPortfolioData] =
    useState<GroupPortfolioResponse | null>(null);
  const [groupStockHoldings, setGroupStockHoldings] = useState<
    GroupStockHoldingsSummaryItem[]
  >([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberItem[]>([]);
  const [competingTeams, setCompetingTeams] = useState<CompetingTeamItem[]>([]);

  useEffect(() => {
    getMyGroupPortfolio().then((portfolio) => {
      setGroupPortfolioData(portfolio);
      if (portfolio?.groupId != null) {
        getGroupStockHoldings(portfolio.groupId).then(setGroupStockHoldings);
        getGroupMembers(portfolio.groupId).then(setGroupMembers);
      }
      getCompetingTeams().then(setCompetingTeams);
    });
  }, []);

  const {
    groupName,
    totalValue,
    investmentAmount,
    profitLoss,
    profitLossPercentage,
  } = groupPortfolioData ?? ({} as GroupPortfolioResponse);
  const isProfit = (profitLoss ?? 0) >= 0;

  const handleStockClick = (stockId: number) => {
    navigate(`/stock-detail?id=${stockId}`);
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("ko-KR")}원`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!groupPortfolioData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 그룹 정보 섹션 */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 px-5 pt-8 pb-8">
        <div className="flex flex-col items-center">
          <span
            className="w-20 h-20 rounded-full bg-white text-teal-600 flex items-center justify-center text-2xl font-bold mb-3 shrink-0"
            aria-hidden
          >
            {groupName.charAt(0)}
          </span>
          <h1 className="text-white text-xl font-bold mb-6">{groupName}</h1>

          {/* 그룹 포트폴리오 가치 */}
          <div className="bg-white/95 rounded-2xl p-5 w-full shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-wallet-3-line text-teal-500 text-lg"></i>
              <span className="text-gray-600 text-sm font-medium">
                실시간 투자금
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {formatCurrency(investmentAmount)}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isProfit ? "text-green-500" : "text-red-500"
                }`}
              >
                {formatPercentage(profitLossPercentage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 수익/손실 내역 */}
      <div className="px-5 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">수익/손실</span>
          <div className="text-right">
            <span
              className={`text-lg font-bold ${
                isProfit ? "text-green-500" : "text-red-500"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(profitLoss)}
            </span>
            <span
              className={`text-xs ml-2 ${
                isProfit ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatPercentage(profitLossPercentage)}
            </span>
          </div>
        </div>
      </div>

      {/* 대회 경쟁 팀 실시간 투자금 */}
      {competingTeams.length > 0 && (
        <div className="px-5 py-5 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-trophy-line text-amber-500 text-lg"></i>
            <h2 className="text-base font-bold text-gray-900">
              대회 경쟁 팀 실시간 투자금
            </h2>
          </div>
          <div className="space-y-3">
            {competingTeams.map((team) => {
              const teamProfit = team.profitLoss >= 0;
              return (
                <div
                  key={team.teamId}
                  className={`rounded-xl p-4 border transition-colors ${
                    team.isMyTeam
                      ? "bg-teal-50 border-teal-200 shadow-sm"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                        {team.rank}
                      </span>
                      <span
                        className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                        aria-hidden
                      >
                        {team.groupName.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1.5">
                          {team.groupName}
                          {team.isMyTeam && (
                            <span className="text-xs font-medium text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded">
                              우리 팀
                            </span>
                          )}
                        </div>
                        <div className="text-gray-900 font-medium text-sm">
                          {formatCurrency(team.totalValue)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`font-semibold text-sm ${
                          teamProfit ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {teamProfit ? "+" : ""}
                        {formatCurrency(team.profitLoss)}
                      </div>
                      <div
                        className={`text-xs ${
                          teamProfit ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatPercentage(team.profitLossPercentage)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 모의투자 이동 버튼 */}
      <div className="px-5 py-4">
        <button
          onClick={() => navigate("/stock")}
          className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <i className="ri-stock-line text-xl"></i>
          <span>모의투자 시작하기</span>
        </button>
      </div>

      <main className="max-w-md mx-auto">
        {/* 그룹 포트폴리오 주식 내역 */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-stock-line text-gray-700 text-lg"></i>
            <h2 className="text-base font-bold text-gray-900">보유 주식</h2>
          </div>
          <div className="space-y-3">
            {groupStockHoldings.map((stock) => (
              <div
                key={stock.id}
                onClick={() => handleStockClick(stock.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: stock.logoColor }}
                    >
                      {stock.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {stock.name}
                      </div>
                      <div className="text-gray-900 font-medium text-sm">
                        {formatCurrency(stock.currentValue)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold text-sm ${
                        stock.profitLoss >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {stock.profitLoss >= 0 ? "+" : ""}
                      {formatCurrency(stock.profitLoss)}
                    </div>
                    <div
                      className={`text-xs ${
                        stock.profitLoss >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatPercentage(stock.profitLossPercentage)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 그룹 멤버 내역 */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-team-line text-gray-700 text-lg"></i>
            <h2 className="text-base font-bold text-gray-900">그룹 멤버</h2>
            <span className="text-sm text-gray-500">
              ({groupMembers.length}명)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {groupMembers.map((member) => (
              <div key={member.id} className="flex flex-col items-center">
                <span
                  className="w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center text-lg font-semibold mb-2 shrink-0"
                  aria-hidden
                >
                  {member.nickname.charAt(0)}
                </span>
                <span className="text-xs text-gray-700 text-center truncate w-full">
                  {member.nickname}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
