import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMyInvestment,
  getGroupPortfolio,
  getAllGroupsRanking,
  getMyGroupRanking,
} from "../../services";
import { parseCompetitionEndDate } from "../../utils/date";
import type {
  InvestmentData,
  StockHolding,
  CompetitionSummary,
  GroupRankingItem,
  MyGroupRankingResponse,
} from "../../types";

function teamIdToGroupId(teamId: string | null | undefined): number | null {
  if (!teamId || !teamId.startsWith("team-")) return null;
  const n = parseInt(teamId.replace(/^team-/, ""), 10);
  return Number.isNaN(n) ? null : n;
}

/** 백엔드에서 데이터를 못 받아도 레이아웃이 깨지지 않도록 임시 데이터 */
const FALLBACK_DATA: InvestmentData = {
  totalAssets: 0,
  profitLoss: 0,
  profitLossPercentage: 0,
  investmentPrincipal: 0,
  cashBalance: 0,
};

const FALLBACK_COMPETITION: CompetitionSummary = {
  name: "대회",
  endDate: "",
  daysRemaining: 0,
};

export default function Home() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, updateUserAssets } = useAuth();
  const groupId = teamIdToGroupId(user?.teamId ?? null);
  const hasTeam = Boolean(user && "teamId" in user && user.teamId);

  const [data, setData] = useState<InvestmentData>(FALLBACK_DATA);
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [competitionData, setCompetitionData] =
    useState<CompetitionSummary | null>(FALLBACK_COMPETITION);
  const [allGroupsRanking, setAllGroupsRanking] = useState<
    GroupRankingItem[]
  >([]);
  const [myGroupRanking, setMyGroupRanking] =
    useState<MyGroupRankingResponse | null>(null);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    getMyInvestment()
      .then((res) => {
        setCompetitionData(res.competitionData ?? FALLBACK_COMPETITION);
        if (groupId == null) {
          setData(res.investmentData ?? FALLBACK_DATA);
          setStocks(res.stockHoldings ?? []);
          updateUserAssets({
            totalAssets: res.investmentData?.totalAssets ?? 0,
          });
        }
      })
      .catch(() => {
        setData(FALLBACK_DATA);
        setStocks([]);
        setCompetitionData(FALLBACK_COMPETITION);
      });
    if (groupId != null) {
      getGroupPortfolio(groupId)
        .then((portfolio) => {
          if (portfolio) {
            const holdingsValue = portfolio.holdings.reduce(
              (s, h) => s + h.currentValue,
              0
            );
            const cashBalance = portfolio.totalValue - holdingsValue;
            setData({
              totalAssets: portfolio.totalValue,
              profitLoss: portfolio.profitLoss,
              profitLossPercentage: portfolio.profitLossPercentage,
              investmentPrincipal: portfolio.investmentAmount,
              cashBalance,
            });
            setStocks(
              portfolio.holdings.map((h, i) => {
                const cost = h.averagePrice * h.quantity;
                const pl = h.currentValue - cost;
                const plPct = cost !== 0 ? (pl / cost) * 100 : 0;
                return {
                  id: h.id,
                  name: h.stockName,
                  quantity: h.quantity,
                  currentValue: h.currentValue,
                  profitLoss: pl,
                  profitLossPercentage: plPct,
                  logoColor: ["#14B8A6", "#06B6D4", "#8B5CF6", "#EC4899"][i % 4],
                };
              })
            );
            updateUserAssets({ totalAssets: portfolio.totalValue });
          } else {
            setData(FALLBACK_DATA);
            setStocks([]);
          }
        })
        .catch(() => {
          setData(FALLBACK_DATA);
          setStocks([]);
        });
    }
    getAllGroupsRanking().then(setAllGroupsRanking).catch(() => {});
    getMyGroupRanking()
      .then(setMyGroupRanking)
      .catch(() => setMyGroupRanking(null));
  }, [groupId]);

  useEffect(() => {
    if (!competitionData?.endDate) return;
    const endDate = parseCompetitionEndDate(competitionData.endDate);
    const calculateCountdown = () => {
      try {
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setCountdown({ days, hours, minutes, seconds });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } catch {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [competitionData?.endDate]);

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString("ko-KR");
  };

  const formatPercentage = (num: number) => {
    return Math.abs(num).toFixed(2);
  };

  const formatTime = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  const formatCurrency = (value: number) => {
    return `${Math.floor(value).toLocaleString("ko-KR")}원`;
  };

  const formatPercentWithSign = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  /** 대회 종료일: 날짜만 표기 (시간 제외) */
  const formatEndDateOnly = (iso: string | null | undefined) => {
    if (!iso || !iso.trim()) return "-";
    const s = iso.trim();
    const datePart = s.slice(0, 10);
    try {
      return new Date(datePart + "T12:00:00").toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return datePart;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 min-w-0 overflow-x-hidden">
      <main className="pt-4 pb-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full box-border">
        {/* 모바일 전용: 상단 유저 프로필 (데스크톱은 Header에 있음) */}
        <div className="lg:hidden mb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          {isLoggedIn && user ? (
            <div className="flex items-center justify-between gap-3 py-3 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[56px]">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                  aria-hidden
                >
                  {user.nickname.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.nickname}
                  </p>
                  <p className="text-xs text-gray-500" title={hasTeam ? "우리 팀 총 자산" : "팀 참가 후 팀 총 자산이 표시됩니다"}>
                    {hasTeam ? `팀 ${formatNumber(user.totalAssets ?? 0)}원` : "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="shrink-0 py-2 px-4 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-2 min-h-[44px]"
                aria-label="로그아웃"
              >
                <i className="ri-logout-box-r-line text-lg" aria-hidden />
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end py-2">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="py-2.5 px-5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 cursor-pointer transition-colors"
              >
                로그인
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* 왼쪽 컬럼 - 모바일에서 자산 먼저, 데스크톱에서는 대회 → 자산 → 보유 주식 */}
          <div className="md:col-span-8 min-w-0 flex flex-col">
            {/* 진행 중인 대회 - 모바일에서는 자산 아래 */}
            <section className="order-2 md:order-1 mt-6 md:mt-0">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                진행 중인 대회
              </h3>
              <button
                type="button"
                className="w-full text-left bg-gradient-to-br from-[#0088FF] to-[#6155F5] rounded-2xl p-4 sm:p-6 cursor-pointer hover:shadow-xl active:scale-[0.99] transition-all duration-300 min-h-[44px]"
                onClick={() => navigate("/competition")}
                aria-label="진행 중인 대회 보기"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                      {competitionData?.name ?? "대회 이름"}
                    </h2>
                    <p className="text-sm text-white/90 mt-2 sm:mt-3 font-mono tabular-nums">
                      {formatTime(countdown.days)}:{formatTime(countdown.hours)}:
                      {formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                    </p>
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-arrow-right-line text-2xl sm:text-3xl text-white" aria-hidden />
                  </div>
                </div>
              </button>

              {/* 경쟁 팀 실시간 투자금 (랭킹 페이지와 동일 API: /api/ranking/groups) */}
              {allGroupsRanking.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    경쟁 팀 실시간 투자금
                  </h4>
                  <div className="space-y-2">
                    {allGroupsRanking.map((group, index) => {
                      const rank = index + 1;
                      const isMyTeam = group.id === myGroupRanking?.id;
                      const isProfit = group.profitRate >= 0;
                      const profitPercent = group.profitRate * 100;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => navigate("/ranking")}
                          className={`w-full flex items-center justify-between rounded-xl px-4 py-3 min-h-[44px] border cursor-pointer transition-colors hover:shadow-sm text-left ${
                            isMyTeam
                              ? "bg-teal-50 border-teal-200"
                              : "bg-white border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
                              {rank}
                            </span>
                            <span
                              className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                              aria-hidden
                            >
                              {group.groupName.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-gray-900 truncate block flex items-center gap-1.5">
                                {group.groupName}
                                {isMyTeam && (
                                  <span className="text-xs text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    우리 팀
                                  </span>
                                )}
                              </span>
                              <span className="text-sm text-gray-600">
                                {formatCurrency(group.currentAssets)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className={`text-sm font-semibold ${
                                isProfit ? "text-red-500" : "text-blue-500"
                              }`}
                            >
                              {formatPercentWithSign(profitPercent)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* 자산 - 모바일에서 맨 위 */}
            <section className="mt-0 md:mt-6 order-1 md:order-2">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                자산
              </h3>

              {/* 총 자산 (유저는 자산 없음 → 표시되는 값은 우리 팀 자산) */}
              <div className="bg-yellow-50 rounded-2xl p-4 sm:p-6 mb-4 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <i className="ri-wallet-3-line text-2xl text-yellow-600" aria-hidden />
                  </div>
                  <span className="text-base text-gray-700">
                    {groupId != null ? "우리 팀 총 자산" : "나의 총 자산"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 break-all">
                    {formatNumber(data.totalAssets)}원
                  </h2>
                  <div
                    className={`text-base sm:text-lg font-semibold flex-shrink-0 ${
                      data.profitLoss >= 0 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {data.profitLoss >= 0 ? "▲" : "▼"}
                    {formatNumber(Math.abs(data.profitLoss))}
                    <span className="ml-1 sm:ml-2">
                      ({formatPercentage(data.profitLossPercentage)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 투자 원금 & 남은 자산 (팀 기준) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 min-w-0">
                  <p className="text-sm text-gray-500 mb-2">
                    {groupId != null ? "팀 투자 원금" : "투자 원금"}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
                    {formatNumber(data.investmentPrincipal)}원
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 min-w-0">
                  <p className="text-sm text-gray-500 mb-2">남은 자산</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
                    {formatNumber(data.cashBalance)}원
                  </p>
                </div>
              </div>
            </section>

            {/* 보유 주식 (팀 보유 종목) */}
            <section className="mt-6 order-3">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                {groupId != null ? "우리 팀 보유 주식" : "보유 주식"}
              </h3>

              <div className="space-y-4">
                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 min-w-0"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* 종목 로고 */}
                      <div
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                        style={{ backgroundColor: stock.logoColor }}
                        aria-hidden
                      >
                        {stock.name.substring(0, 2)}
                      </div>

                      {/* 종목 정보 */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                          <h4 className="text-base font-semibold text-gray-900 truncate">
                            {stock.name}
                          </h4>
                          <p className="text-sm sm:text-base font-bold text-gray-900 flex-shrink-0 tabular-nums">
                            {formatNumber(stock.currentValue)}원
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm text-gray-500">
                            {stock.quantity}주 보유
                          </p>
                          <p
                            className={`text-sm font-medium tabular-nums ${
                              stock.profitLoss >= 0
                                ? "text-red-500"
                                : "text-blue-500"
                            }`}
                          >
                            {stock.profitLoss >= 0 ? "▲" : "▼"}
                            {formatNumber(Math.abs(stock.profitLoss))}원 (
                            {formatPercentage(stock.profitLossPercentage)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 오른쪽 컬럼 - 대회 내역 */}
          <div className="md:col-span-4 min-w-0">
            <section>
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                대회 내역
              </h3>

              <button
                type="button"
                className="w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all min-h-[44px]"
                onClick={() => navigate("/competition")}
                aria-label="대회 내역 보기"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-trophy-line text-2xl text-purple-600" aria-hidden />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {competitionData?.name ?? "대회 이름"}
                    </h4>
                    <p className="text-sm text-gray-500 mt-2">
                      종료일 {formatEndDateOnly(competitionData?.endDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      D-{competitionData?.daysRemaining ?? 0}
                    </p>
                  </div>
                  <i className="ri-arrow-right-s-line text-2xl text-gray-400 flex-shrink-0" aria-hidden />
                </div>
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
