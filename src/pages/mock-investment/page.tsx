import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  beginFestivalSession,
  completeFestivalSession,
  getFestivalSession,
  getStocksByFalling,
  getStocksByRising,
  getStocksByVolume,
  normalizeStockCodeForPrice,
  usePriceWebSocket,
} from "../../services";
import type { StockListItem } from "../../types";

type TabType = "volume" | "rising" | "falling";

type SelectedStock = {
  id: number;
  code: string;
  name: string;
  currentPrice: number;
  change: number;
  changeRate: number;
  logoColor: string;
};

type FestivalSessionState = {
  sessionId?: number;
  displayName?: string;
  startedAt?: string;
  participant?: {
    name?: string;
    phoneNumber?: string;
  };
};

const FESTIVAL_DURATION_MS = 2 * 60 * 1000;

export default function MockInvestmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isFestivalPage = location.pathname === "/festival-stock";

  const [stocksByVolume, setStocksByVolume] = useState<StockListItem[]>([]);
  const [stocksByRising, setStocksByRising] = useState<StockListItem[]>([]);
  const [stocksByFalling, setStocksByFalling] = useState<StockListItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("volume");
  const [marketError, setMarketError] = useState<string | null>(null);
  const [routeOk, setRouteOk] = useState(false);
  const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(FESTIVAL_DURATION_MS);
  const [festivalStartedAt, setFestivalStartedAt] = useState<string | null>(null);
  const [festivalStatus, setFestivalStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">("NOT_STARTED");
  const [loadingSession, setLoadingSession] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const festivalSession = useMemo(() => {
    if (!isFestivalPage) return null;
    try {
      const raw = sessionStorage.getItem("festivalSession");
      return raw ? (JSON.parse(raw) as FestivalSessionState) : null;
    } catch {
      return null;
    }
  }, [isFestivalPage]);
  const festivalSessionId = festivalSession?.sessionId ?? null;

  const festivalStarted = isFestivalPage && festivalStatus === "IN_PROGRESS" && timeLeftMs > 0;
  const festivalEnded = isFestivalPage && festivalStatus === "COMPLETED";
  const startDisabled =
    !festivalSessionId || loadingSession || festivalStatus !== "NOT_STARTED";

  useEffect(() => {
    if (isFestivalPage || user) {
      setRouteOk(true);
    }
  }, [isFestivalPage, user]);

  useEffect(() => {
    if (!isFestivalPage) return;

    const storedStart = festivalSession?.startedAt ?? null;
    setFestivalStartedAt(storedStart);

    if (!festivalSessionId) {
      setFestivalStatus("NOT_STARTED");
      return;
    }

    setLoadingSession(true);
    getFestivalSession(festivalSessionId)
      .then((sessionState) => {
        setFestivalStatus(sessionState.status);
        setFestivalStartedAt(sessionState.startedAt);
        try {
          const current = sessionStorage.getItem("festivalSession");
          const parsed = current ? (JSON.parse(current) as FestivalSessionState) : {};
          sessionStorage.setItem(
            "festivalSession",
            JSON.stringify({
              ...parsed,
              sessionId: sessionState.sessionId,
              displayName: sessionState.displayName,
              startCash: sessionState.startCash,
              startedAt: sessionState.startedAt,
            }),
          );
        } catch {
          // ignore session storage sync failure
        }
      })
      .catch((err: { message?: string }) => {
        setStartError(err?.message ?? "참가 상태를 불러오지 못했습니다.");
      })
      .finally(() => setLoadingSession(false));
  }, [festivalSession?.startedAt, festivalSessionId, isFestivalPage]);

  useEffect(() => {
    if (!isFestivalPage || !festivalStartedAt) {
      setTimeLeftMs(FESTIVAL_DURATION_MS);
      return;
    }

    const updateTimer = () => {
      const startedAtMs = new Date(festivalStartedAt).getTime();
      if (Number.isNaN(startedAtMs)) {
        setTimeLeftMs(FESTIVAL_DURATION_MS);
        return;
      }

      const remaining = Math.max(0, FESTIVAL_DURATION_MS - (Date.now() - startedAtMs));
      setTimeLeftMs(remaining);

      if (remaining === 0) {
        setFestivalStatus("COMPLETED");
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [festivalStartedAt, isFestivalPage]);

  useEffect(() => {
    if (!isFestivalPage || timeLeftMs !== 0 || festivalStatus !== "IN_PROGRESS" || !festivalSessionId) {
      return;
    }

    completeFestivalSession(festivalSessionId, {
      endCash: 100000000,
      endPortfolioValue: 0,
      endTotalValue: 100000000,
      returnRate: 0,
      mainStockName: null,
      tradeCount: 0,
      unfilledOrderCount: 0,
      holdingsSnapshot: [],
      tradeHistory: [],
    })
      .then(() => {
        setFestivalStatus("COMPLETED");
      })
      .catch(() => {
        setFestivalStatus("COMPLETED");
      });
  }, [festivalSessionId, festivalStatus, isFestivalPage, timeLeftMs]);

  useEffect(() => {
    setMarketError(null);
    const requests = [getStocksByVolume(), getStocksByRising(), getStocksByFalling()] as const;

    Promise.allSettled(requests).then(([volumeResult, risingResult, fallingResult]) => {
      setStocksByVolume(volumeResult.status === "fulfilled" ? volumeResult.value : []);
      setStocksByRising(risingResult.status === "fulfilled" ? risingResult.value : []);
      setStocksByFalling(fallingResult.status === "fulfilled" ? fallingResult.value : []);

      const failed: string[] = [];
      if (volumeResult.status === "rejected") failed.push("거래량 순위");
      if (risingResult.status === "rejected") failed.push("상승률 순위");
      if (fallingResult.status === "rejected") failed.push("하락률 순위");
      if (failed.length > 0) {
        setMarketError(`${failed.join(", ")}를 불러오지 못했습니다.`);
      }
    });
  }, []);

  const tabStocks =
    activeTab === "volume"
      ? stocksByVolume
      : activeTab === "rising"
        ? stocksByRising
        : stocksByFalling;

  const subscribeCodes = tabStocks.slice(0, 30).map((stock) => stock.code);
  const realtimeUpdates = usePriceWebSocket(subscribeCodes);

  const stockList = useMemo(() => tabStocks, [tabStocks]);

  const handleFestivalStart = () => {
    if (!isFestivalPage || startDisabled) return;

    setLoadingSession(true);
    setStartError(null);
    beginFestivalSession(festivalSessionId)
      .then((sessionState) => {
        setFestivalStatus(sessionState.status);
        setFestivalStartedAt(sessionState.startedAt);
        try {
          const current = sessionStorage.getItem("festivalSession");
          const parsed = current ? (JSON.parse(current) as FestivalSessionState) : {};
          sessionStorage.setItem(
            "festivalSession",
            JSON.stringify({
              ...parsed,
              sessionId: sessionState.sessionId,
              displayName: sessionState.displayName,
              startCash: sessionState.startCash,
              startedAt: sessionState.startedAt,
            }),
          );
        } catch {
          // ignore session storage sync failure
        }
      })
      .catch((err: { message?: string }) => {
        setStartError(err?.message ?? "참가를 시작하지 못했습니다.");
      })
      .finally(() => setLoadingSession(false));
  };

  const openFestivalActions = (stock: SelectedStock) => {
    if (!festivalStarted) return;
    setSelectedStock(stock);
  };

  const handleStockClick = (stock: SelectedStock) => {
    if (!isFestivalPage) {
      navigate(`/stock-detail?id=${stock.id}`, { state: { nameFromList: stock.name } });
      return;
    }
    openFestivalActions(stock);
  };

  if (user && !routeOk) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-500">이동 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-gray-50">
      <main className="mx-auto box-border w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">
            {isFestivalPage ? "축제 모의투자" : "모의투자"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isFestivalPage
              ? "계정당 1회만 참여할 수 있고, 시작하기를 눌러야 2분 타이머가 시작됩니다."
              : "종목을 선택하고 기존 투자 UI를 기준으로 화면을 확장해나가겠습니다."}
          </p>
        </div>

        {marketError && (
          <div className="mb-4 flex min-w-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:mb-6">
            <i className="ri-error-warning-line flex-shrink-0" aria-hidden />
            <span className="min-w-0">{marketError}</span>
          </div>
        )}

        {isFestivalPage ? (
          <section className="mb-6 lg:mb-8">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Participant
                </div>
                <div className="mt-2 text-2xl font-black text-slate-950">
                  {festivalSession?.displayName ?? "축제 참가자"}
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  한 계정당 한 번만 참여할 수 있습니다. 시작 후 2분 동안만 매매가 가능합니다.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-orange-200">
                  Timer
                </div>
                <div className="mt-3 text-5xl font-black tracking-tight">
                  {formatTime(timeLeftMs)}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {festivalEnded
                    ? "참여가 종료되었습니다."
                    : festivalStarted
                      ? "타이머가 진행 중입니다."
                      : "시작하기를 누르면 2분 타이머가 시작됩니다."}
                </div>
                <button
                  type="button"
                  onClick={handleFestivalStart}
                  disabled={startDisabled}
                  className="mt-5 w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {festivalStatus === "COMPLETED"
                    ? "이미 참여 완료"
                    : loadingSession
                      ? "확인 중"
                      : festivalStarted
                      ? "진행 중"
                      : "시작하기"}
                </button>
                {startError ? (
                  <p className="mt-3 text-xs text-rose-300">{startError}</p>
                ) : !festivalSessionId ? (
                  <p className="mt-3 text-xs text-slate-300">
                    참가 세션이 없어 시작할 수 없습니다. 등록 페이지에서 먼저 참가 등록을 해주세요.
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 lg:gap-4 lg:p-5">
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("volume")}
                className={`min-h-[44px] whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all lg:px-5 ${
                  activeTab === "volume"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                거래량
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("rising")}
                className={`min-h-[44px] whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all lg:px-5 ${
                  activeTab === "rising"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                급상승
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("falling")}
                className={`min-h-[44px] whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all lg:px-5 ${
                  activeTab === "falling"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                급하락
              </button>
            </div>
          </div>

          <div className="hidden grid-cols-12 gap-4 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:px-6">
            <div className="col-span-1">순위</div>
            <div className="col-span-4">종목</div>
            <div className="col-span-2 text-right">현재가</div>
            <div className="col-span-2 text-right">등락</div>
            <div className="col-span-3 text-right">등락률</div>
          </div>

          <div className="divide-y divide-gray-100">
            {stockList.length > 0 ? (
              stockList.map((stock, index) => {
                const codeKey = normalizeStockCodeForPrice(stock.code);
                const realtime = realtimeUpdates[codeKey];
                const price = realtime?.currentPrice ?? stock.currentPrice;
                const change = realtime?.change ?? stock.change;
                const changeRate = realtime?.changeRate ?? stock.changeRate;
                const clickableStock: SelectedStock = {
                  id: stock.id,
                  code: stock.code,
                  name: stock.name,
                  currentPrice: price,
                  change,
                  changeRate,
                  logoColor: stock.logoColor,
                };

                return (
                  <button
                    key={`${activeTab}-${stock.code}-${index}`}
                    type="button"
                    onClick={() => handleStockClick(clickableStock)}
                    disabled={isFestivalPage && !festivalStarted}
                    className={`grid min-h-[44px] w-full min-w-0 grid-cols-12 items-center gap-2 px-4 py-2.5 text-left transition-colors lg:gap-4 lg:px-6 lg:py-4 ${
                      isFestivalPage && !festivalStarted
                        ? "cursor-not-allowed bg-gray-50/60 opacity-60"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="col-span-1 hidden text-sm font-medium text-gray-500 lg:block">
                      {index + 1}
                    </span>

                    <div className="col-span-7 flex min-w-0 items-center gap-2 lg:col-span-4 lg:gap-3">
                      <span className="w-6 flex-shrink-0 text-sm font-medium text-gray-500 lg:hidden">
                        {index + 1}
                      </span>
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white lg:h-11 lg:w-11"
                        style={{ backgroundColor: stock.logoColor }}
                      >
                        {stock.name.charAt(0)}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-gray-900 lg:text-base">
                          {stock.name}
                        </p>
                        <p className="text-xs text-gray-500">{stock.code}</p>
                      </div>
                    </div>

                    <div className="col-span-5 flex min-w-0 flex-col items-end gap-0.5 lg:hidden">
                      <p className="text-sm font-bold tabular-nums text-gray-900">
                        {formatNumber(price)}원
                      </p>
                      <p
                        className={`text-xs font-semibold tabular-nums ${
                          changeRate >= 0 ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {formatNumber(change)} ({changeRate >= 0 ? "+" : ""}
                        {changeRate.toFixed(2)}%)
                      </p>
                    </div>

                    <div className="hidden text-right lg:col-span-2 lg:block">
                      <p className="font-bold tabular-nums text-gray-900">{formatNumber(price)}원</p>
                    </div>
                    <div className="hidden text-right lg:col-span-2 lg:block">
                      <p
                        className={`font-semibold tabular-nums ${
                          change >= 0 ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {formatNumber(change)}
                      </p>
                    </div>
                    <div className="hidden text-right lg:col-span-3 lg:block">
                      <p
                        className={`font-semibold ${
                          changeRate >= 0 ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {changeRate >= 0 ? "+" : ""}
                        {changeRate.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <i className="ri-bar-chart-box-line mb-4 text-5xl text-gray-300" />
                <p className="text-gray-500">표시할 종목이 없습니다</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {isFestivalPage && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
            onClick={() => setSelectedStock(null)}
            aria-hidden
          />

          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <button
              type="button"
              onClick={() => setSelectedStock(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              <i className="ri-close-line text-xl" />
            </button>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white"
                style={{ backgroundColor: selectedStock.logoColor }}
              >
                {selectedStock.name.charAt(0)}
              </div>
              <div>
                <div className="text-2xl font-black text-slate-950">{selectedStock.name}</div>
                <div className="mt-1 text-sm text-slate-500">{selectedStock.code}</div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Current Price
              </div>
              <div className="mt-2 text-3xl font-black text-slate-950">
                {selectedStock.currentPrice > 0
                  ? `${formatNumber(selectedStock.currentPrice)}원`
                  : "시세 확인 중"}
              </div>
              <div
                className={`mt-2 text-sm font-semibold ${
                  selectedStock.changeRate >= 0 ? "text-rose-600" : "text-blue-600"
                }`}
              >
                {selectedStock.change >= 0 ? "+" : ""}
                {formatNumber(selectedStock.change)} ({selectedStock.changeRate >= 0 ? "+" : ""}
                {selectedStock.changeRate.toFixed(2)}%)
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="rounded-[24px] bg-rose-500 px-4 py-5 text-lg font-black text-white transition hover:bg-rose-600"
              >
                매수
              </button>
              <button
                type="button"
                className="rounded-[24px] bg-blue-500 px-4 py-5 text-lg font-black text-white transition hover:bg-blue-600"
              >
                매도
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number) {
  return Math.round(num).toLocaleString("ko-KR");
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
