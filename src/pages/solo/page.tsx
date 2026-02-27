/**
 * 개인(1인) 방 전용 주식 관리 페이지. 채팅 대체.
 * 팀의 채팅 화면과 동일하게 투자 현황·보유 종목을 보여주고, 매수/매도는 모의투자(종목 선택)로 진행.
 * 채팅/투표/계획 공유 없음.
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/feature/Header";
import {
  getGroupPortfolio,
  getVotes,
  usePriceWebSocket,
  normalizeStockCodeForPrice,
} from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import { getPieSlicePathD } from "../../utils/portfolioPiePath";
import type { GroupPortfolioResponse, VoteItem } from "../../types";

function teamIdToGroupId(teamId: string | null | undefined): number | null {
  if (!teamId || !teamId.startsWith("team-")) return null;
  const n = parseInt(teamId.slice(5), 10);
  return Number.isNaN(n) || n < 1 ? null : n;
}

function formatCurrency(value: number) {
  return `${Math.floor(value).toLocaleString("ko-KR")}원`;
}

function formatPercentage(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function SoloPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const groupId = teamIdToGroupId(user?.teamId ?? null);

  const [groupPortfolioData, setGroupPortfolioData] =
    useState<GroupPortfolioResponse | null>(null);
  const [portfolioLoadError, setPortfolioLoadError] = useState(false);
  const [votes, setVotes] = useState<VoteItem[]>([]);

  const currentUserId = user?.id != null ? Number(user.id) || 0 : 0;
  const myPendingLimitOrders = votes.filter(
    (v) =>
      v.status === "pending" &&
      v.orderStrategy === "LIMIT" &&
      v.proposerId === currentUserId,
  );

  const fetchPortfolio = (gid: number) => {
    getGroupPortfolio(gid)
      .then((data) => {
        setGroupPortfolioData(data);
        setPortfolioLoadError(false);
      })
      .catch(() => {
        setGroupPortfolioData(null);
        setPortfolioLoadError(true);
      });
  };

  useEffect(() => {
    if (groupId != null) {
      fetchPortfolio(groupId);
      getVotes(groupId).then(setVotes);
    } else {
      setGroupPortfolioData(null);
      setVotes([]);
    }
  }, [groupId]);

  const subscribeCodes = useMemo(
    () =>
      (groupPortfolioData?.holdings ?? []).map((h) =>
        normalizeStockCodeForPrice(h.stockCode),
      ).filter(Boolean),
    [groupPortfolioData?.holdings],
  );
  const realtimePrices = usePriceWebSocket(subscribeCodes);

  const isProfit = (groupPortfolioData?.profitLoss ?? 0) >= 0;
  const availableCash =
    groupPortfolioData != null
      ? Math.max(
          0,
          Math.floor(
            (groupPortfolioData.totalValue ?? 0) -
              (groupPortfolioData.holdings ?? []).reduce(
                (s, h) => s + (h.currentValue ?? 0),
                0,
              ),
          ),
        )
      : null;

  if (groupId == null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              개인 모의투자
            </h1>
            <p className="text-gray-600 mb-2">
              방에 참여하지 않으면 모의투자를 시작할 수 없습니다.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              개인방을 만들고 모의투자를 시작한 후, 여기서 주식을 관리할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate("/matching-rooms")}
              className="py-2.5 px-6 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer"
            >
              매칭방으로 이동
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (groupPortfolioData == null && !portfolioLoadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">투자 현황 불러오는 중…</p>
      </div>
    );
  }

  if (portfolioLoadError && groupPortfolioData == null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-amber-600 mb-4">투자 현황을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => groupId != null && fetchPortfolio(groupId)}
            className="py-2.5 px-6 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            재시도
          </button>
        </main>
      </div>
    );
  }

  const holdings = groupPortfolioData?.holdings ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">내 투자 현황</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            개인방 · 채팅/투표 없이 주식 매수·매도만 진행합니다
          </p>
        </div>

        <div className="space-y-4">
          {/* 내 지정가 주문 */}
          {myPendingLimitOrders.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-price-tag-3-line text-amber-600" aria-hidden />
                내 지정가 주문
              </h3>
              <ul className="space-y-2">
                {myPendingLimitOrders.map((vote) => {
                  const stockId = vote.stockCode
                    ? parseInt(vote.stockCode, 10)
                    : 0;
                  return (
                    <li key={vote.id}>
                      <button
                        type="button"
                        onClick={() =>
                          stockId > 0 &&
                          navigate(`/stock-detail?id=${stockId}`)
                        }
                        className="w-full text-left bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {vote.stockName || vote.stockCode || "—"}
                          </span>
                          <span
                            className={`text-xs font-medium shrink-0 ${
                              vote.type === "매수"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {vote.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          희망가 {vote.limitPrice?.toLocaleString("ko-KR") ?? "—"}원
                          · {vote.quantity}주
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 거래 가능 현금 */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <span className="text-gray-600 text-sm font-medium">
                거래 가능 현금
              </span>
              <span className="text-lg font-bold text-gray-900">
                {availableCash != null ? formatCurrency(availableCash) : "—"}
              </span>
            </div>
          </div>

          {/* 투자 요약 — 클릭 시 상세 포트폴리오 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/group-portfolio")}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate("/group-portfolio")
            }
            className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white cursor-pointer hover:from-teal-600 hover:to-teal-700 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-wallet-3-line text-xl" aria-hidden />
              <h2 className="text-sm font-bold">투자 요약</h2>
              <i
                className="ri-arrow-right-s-line text-teal-200 ml-auto text-xl"
                aria-hidden
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-teal-100">투자 원금</span>
                <span className="font-bold">
                  {formatCurrency(
                    groupPortfolioData?.investmentAmount ?? 0,
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-100">현재 평가액</span>
                <span className="font-bold">
                  {formatCurrency(groupPortfolioData?.totalValue ?? 0)}
                </span>
              </div>
              <div className="border-t border-teal-400 pt-2 flex justify-between items-center">
                <span className="text-teal-100">총 손익</span>
                <span
                  className={
                    isProfit ? "text-yellow-200 font-bold" : "text-red-200 font-bold"
                  }
                >
                  {isProfit ? "+" : ""}
                  {formatCurrency(groupPortfolioData?.profitLoss ?? 0)}{" "}
                  {formatPercentage(
                    groupPortfolioData?.profitLossPercentage ?? 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 포트폴리오 구성 (파이) */}
          {holdings.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                포트폴리오 구성
              </h3>
              <div className="flex justify-center mb-3">
                <svg viewBox="0 0 200 200" className="w-28 h-28">
                  {holdings.map((holding, index) => {
                    const code = normalizeStockCodeForPrice(holding.stockCode);
                    const rt = code ? realtimePrices[code] : undefined;
                    const price = rt?.currentPrice ?? holding.currentPrice;
                    const value = price * (holding.quantity ?? 0);
                    const total = holdings.reduce((sum, h) => {
                      const c = normalizeStockCodeForPrice(h.stockCode);
                      const p = c ? realtimePrices[c]?.currentPrice ?? h.currentPrice : h.currentPrice;
                      return sum + p * (h.quantity ?? 0);
                    }, 0);
                    if (total <= 0) return null;
                    let startAngle = 0;
                    for (let i = 0; i < index; i++) {
                      const c = normalizeStockCodeForPrice(holdings[i].stockCode);
                      const p = c ? realtimePrices[c]?.currentPrice ?? holdings[i].currentPrice : holdings[i].currentPrice;
                      startAngle += (p * (holdings[i].quantity ?? 0) / total) * 360;
                    }
                    const angle = (value / total) * 360;
                    const pathD = getPieSlicePathD(100, 100, 80, startAngle, angle);
                    const colors = [
                      "#14B8A6",
                      "#06B6D4",
                      "#8B5CF6",
                      "#EC4899",
                      "#F59E0B",
                      "#10B981",
                    ];
                    return (
                      <path
                        key={holding.id}
                        d={pathD}
                        fill={colors[index % colors.length]}
                        opacity="0.9"
                      />
                    );
                  })}
                  <circle cx="100" cy="100" r="50" fill="white" />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {holdings.map((holding, index) => {
                  const total = holdings.reduce(
                    (sum, h) => sum + (h.currentValue ?? 0),
                    0,
                  );
                  const pct =
                    total > 0
                      ? ((holding.currentValue ?? 0) / total * 100).toFixed(1)
                      : "0";
                  const colors = [
                    "bg-teal-500",
                    "bg-cyan-500",
                    "bg-purple-500",
                    "bg-pink-500",
                    "bg-amber-500",
                    "bg-green-500",
                  ];
                  return (
                    <div
                      key={holding.id}
                      className="flex items-center gap-1.5"
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          colors[index % colors.length]
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {holding.stockName}
                        </p>
                        <p className="text-xs text-gray-500">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 보유 종목 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900">보유 종목</h3>
            {holdings.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center bg-white rounded-xl border border-gray-200">
                보유 종목이 없습니다. 종목을 매수해 보세요.
              </p>
            ) : (
              holdings.map((holding) => {
                const code = normalizeStockCodeForPrice(holding.stockCode);
                const rt = code ? realtimePrices[code] : undefined;
                const currentPrice = rt?.currentPrice ?? holding.currentPrice;
                const currentValue = currentPrice * (holding.quantity ?? 0);
                const cost =
                  (holding.averagePrice ?? 0) * (holding.quantity ?? 0);
                const profitLoss = cost > 0 ? currentValue - cost : 0;
                const profitLossPct = cost > 0 ? (profitLoss / cost) * 100 : 0;
                const isProfit = profitLoss >= 0;
                return (
                  <div
                    key={holding.id}
                    className="bg-white rounded-xl p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {holding.stockName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {holding.quantity}주 · {formatCurrency(currentPrice)}
                          {rt && (
                            <span className="text-teal-600 ml-0.5">
                              (실시간)
                            </span>
                          )}
                        </p>
                      </div>
                      <p
                        className={`text-xs font-semibold shrink-0 ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        매수대비 {formatPercentage(profitLossPct)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 매수·매도 CTA */}
          <div className="pt-4">
            <button
              type="button"
              onClick={() => navigate("/mock-investment", { state: { fromSolo: true } })}
              className="w-full py-3 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-line-chart-line text-lg" aria-hidden />
              종목 매수·매도하기
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              모의투자 화면에서 종목을 선택해 매수·매도할 수 있습니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
