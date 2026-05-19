import { useEffect, useMemo, useRef, useState } from "react";
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
type TradeSide = "BUY" | "SELL";

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
  startedAt?: string | null;
  participant?: {
    name?: string;
    phoneNumber?: string;
  };
};

type HoldingState = {
  stockCode: string;
  stockName: string;
  quantity: number;
  averagePrice: number;
  logoColor: string;
};

type TradeHistoryState = {
  stockCode: string;
  stockName: string;
  side: TradeSide;
  orderType: "MARKET";
  quantity: number;
  orderPrice: number;
  executedPrice: number;
  status: "EXECUTED";
  createdAt: string;
  executedAt: string;
};

type FestivalResultModalState = {
  returnRate: number;
};

const FESTIVAL_DURATION_MS = 2 * 60 * 1000;
const INITIAL_CASH = 100_000_000;
const FESTIVAL_PRIZE_THRESHOLD = 2.0;

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
  const [selectedTradeSide, setSelectedTradeSide] = useState<TradeSide>("BUY");
  const [quantityInput, setQuantityInput] = useState("1");
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(FESTIVAL_DURATION_MS);
  const [festivalStartedAt, setFestivalStartedAt] = useState<string | null>(null);
  const [festivalStatus, setFestivalStatus] = useState<"NOT_STARTED" | "IN_PROGRESS" | "COMPLETED">(
    "NOT_STARTED",
  );
  const [loadingSession, setLoadingSession] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [cashBalance, setCashBalance] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState<Record<string, HoldingState>>({});
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryState[]>([]);
  const [festivalResultModal, setFestivalResultModal] = useState<FestivalResultModalState | null>(null);
  const completionRequestedRef = useRef(false);
  const earlyExitKeysRef = useRef<Set<string>>(new Set());
  const earlyExitTimeoutRef = useRef<number | null>(null);

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
  const startDisabled = !festivalSessionId || loadingSession || festivalStatus !== "NOT_STARTED";

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
        syncFestivalSessionStorage(sessionState);
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
      const startedAtMs = parseServerDateTime(festivalStartedAt);
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
    if (!isFestivalPage) return;

    const resetEarlyExit = () => {
      earlyExitKeysRef.current.clear();
      if (earlyExitTimeoutRef.current !== null) {
        window.clearTimeout(earlyExitTimeoutRef.current);
        earlyExitTimeoutRef.current = null;
      }
    };

    const triggerEarlyExit = () => {
      resetEarlyExit();
      setSelectedStock(null);
      setTradeError(null);
      setTimeLeftMs(0);
      setFestivalStatus("COMPLETED");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!festivalStarted || completionRequestedRef.current) return;

      const key = event.key.toLowerCase();
      if (key !== "u" && key !== "n" && key !== "i") return;

      earlyExitKeysRef.current.add(key);
      if (
        earlyExitKeysRef.current.has("u") &&
        earlyExitKeysRef.current.has("n") &&
        earlyExitKeysRef.current.has("i") &&
        earlyExitTimeoutRef.current === null
      ) {
        earlyExitTimeoutRef.current = window.setTimeout(triggerEarlyExit, 3000);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== "u" && key !== "n" && key !== "i") return;

      earlyExitKeysRef.current.delete(key);
      if (
        !earlyExitKeysRef.current.has("u") ||
        !earlyExitKeysRef.current.has("n") ||
        !earlyExitKeysRef.current.has("i")
      ) {
        if (earlyExitTimeoutRef.current !== null) {
          window.clearTimeout(earlyExitTimeoutRef.current);
          earlyExitTimeoutRef.current = null;
        }
      }
    };

    const handleWindowBlur = () => {
      resetEarlyExit();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
      resetEarlyExit();
    };
  }, [festivalStarted, isFestivalPage]);

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

  const subscribeCodes = [
    ...tabStocks.slice(0, 30).map((stock) => stock.code),
    ...Object.keys(holdings),
  ];
  const realtimeUpdates = usePriceWebSocket(subscribeCodes);

  const stockList = useMemo(() => tabStocks, [tabStocks]);

  const priceMap = useMemo(() => {
    const allStocks = [...stocksByVolume, ...stocksByRising, ...stocksByFalling];
    const nextMap = new Map<string, number>();

    allStocks.forEach((stock) => {
      const codeKey = normalizeStockCodeForPrice(stock.code);
      const realtime = realtimeUpdates[codeKey];
      nextMap.set(stock.code, realtime?.currentPrice ?? stock.currentPrice);
    });

    Object.values(holdings).forEach((holding) => {
      const codeKey = normalizeStockCodeForPrice(holding.stockCode);
      const realtime = realtimeUpdates[codeKey];
      nextMap.set(holding.stockCode, realtime?.currentPrice ?? holding.averagePrice);
    });

    return nextMap;
  }, [holdings, realtimeUpdates, stocksByFalling, stocksByRising, stocksByVolume]);

  const holdingList = useMemo(
    () =>
      Object.values(holdings).map((holding) => {
        const currentPrice = priceMap.get(holding.stockCode) ?? holding.averagePrice;
        const evaluatedAmount = currentPrice * holding.quantity;
        const profitRate =
          holding.averagePrice > 0 ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
        return {
          ...holding,
          currentPrice,
          evaluatedAmount,
          profitRate,
        };
      }),
    [holdings, priceMap],
  );

  const portfolioValue = useMemo(
    () =>
      Object.values(holdings).reduce((sum, holding) => {
        const currentPrice = priceMap.get(holding.stockCode) ?? holding.averagePrice;
        return sum + currentPrice * holding.quantity;
      }, 0),
    [holdings, priceMap],
  );

  const totalAssetValue = cashBalance + portfolioValue;
  const returnRate = ((totalAssetValue - INITIAL_CASH) / INITIAL_CASH) * 100;

  const currentHolding = selectedStock ? holdings[selectedStock.code] : undefined;
  const currentPrice = selectedStock?.currentPrice ?? 0;
  const maxBuyQuantity =
    currentPrice > 0 ? Math.max(0, Math.floor(cashBalance / currentPrice)) : 0;
  const maxSellQuantity = currentHolding?.quantity ?? 0;
  const parsedQuantity = parsePositiveInt(quantityInput);
  const canBuy = selectedStock !== null && currentPrice > 0 && parsedQuantity > 0 && parsedQuantity <= maxBuyQuantity;
  const canSell =
    selectedStock !== null && currentPrice > 0 && parsedQuantity > 0 && parsedQuantity <= maxSellQuantity;

  useEffect(() => {
    if (!isFestivalPage || timeLeftMs !== 0 || festivalStatus !== "COMPLETED" || !festivalSessionId) {
      return;
    }
    if (completionRequestedRef.current) return;

    completionRequestedRef.current = true;
    setFestivalResultModal({ returnRate });
    completeFestivalSession(festivalSessionId, {
      endCash: roundToWon(cashBalance),
      endPortfolioValue: roundToWon(portfolioValue),
      endTotalValue: roundToWon(totalAssetValue),
      returnRate,
      mainStockName: resolveMainStockName(tradeHistory),
      tradeCount: tradeHistory.length,
      unfilledOrderCount: 0,
      holdingsSnapshot: Object.values(holdings).map((holding) => {
        const snapshotPrice = priceMap.get(holding.stockCode) ?? holding.averagePrice;
        return {
          stockCode: holding.stockCode,
          stockName: holding.stockName,
          quantity: holding.quantity,
          snapshotPrice: roundToWon(snapshotPrice),
          evaluatedAmount: roundToWon(snapshotPrice * holding.quantity),
        };
      }),
      tradeHistory: tradeHistory.map((trade) => ({
        stockCode: trade.stockCode,
        stockName: trade.stockName,
        side: trade.side,
        orderType: trade.orderType,
        quantity: trade.quantity,
        orderPrice: roundToWon(trade.orderPrice),
        executedPrice: roundToWon(trade.executedPrice),
        status: trade.status,
        createdAt: trade.createdAt,
        executedAt: trade.executedAt,
      })),
    }).catch(() => {
      // Keep the UI in completed state even if the completion request fails.
    });
  }, [
    cashBalance,
    festivalSessionId,
    festivalStatus,
    holdings,
    isFestivalPage,
    portfolioValue,
    priceMap,
    returnRate,
    timeLeftMs,
    totalAssetValue,
    tradeHistory,
  ]);

  const handleFestivalStart = () => {
    if (!isFestivalPage || startDisabled || !festivalSessionId) return;

    setLoadingSession(true);
    setStartError(null);
    beginFestivalSession(festivalSessionId)
      .then((sessionState) => {
        setFestivalStatus(sessionState.status);
        setFestivalStartedAt(sessionState.startedAt);
        syncFestivalSessionStorage(sessionState);
      })
      .catch((err: { message?: string }) => {
        setStartError(err?.message ?? "참가를 시작하지 못했습니다.");
      })
      .finally(() => setLoadingSession(false));
  };

  const openFestivalActions = (stock: SelectedStock) => {
    if (!festivalStarted) return;
    setSelectedStock(stock);
    setSelectedTradeSide("BUY");
    setQuantityInput("1");
    setTradeError(null);
  };

  const openHoldingActions = (holding: HoldingState) => {
    if (!festivalStarted) return;
    const currentPrice = priceMap.get(holding.stockCode) ?? holding.averagePrice;
    const changeRate =
      holding.averagePrice > 0 ? ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
    setSelectedStock({
      id: Number.parseInt(holding.stockCode, 10) || 0,
      code: holding.stockCode,
      name: holding.stockName,
      currentPrice,
      change: currentPrice - holding.averagePrice,
      changeRate,
      logoColor: holding.logoColor,
    });
    setSelectedTradeSide("SELL");
    setQuantityInput(String(holding.quantity));
    setTradeError(null);
  };

  const closeTradeModal = () => {
    setSelectedStock(null);
    setTradeError(null);
    setQuantityInput("1");
  };

  const handleStockClick = (stock: SelectedStock) => {
    if (!isFestivalPage) {
      navigate(`/stock-detail?id=${stock.id}`, { state: { nameFromList: stock.name } });
      return;
    }
    openFestivalActions(stock);
  };

  const handleAllInBuy = () => {
    if (maxBuyQuantity <= 0) return;
    setSelectedTradeSide("BUY");
    setQuantityInput(String(maxBuyQuantity));
    setTradeError(null);
  };

  const handleSellAllSelected = () => {
    if (maxSellQuantity <= 0) return;
    setSelectedTradeSide("SELL");
    setQuantityInput(String(maxSellQuantity));
    setTradeError(null);
  };

  const handleSellHolding = (holding: HoldingState) => {
    if (!festivalStarted || holding.quantity <= 0) return;
    const executedPrice = priceMap.get(holding.stockCode) ?? holding.averagePrice;
    executeSellTrade(holding, holding.quantity, executedPrice);
  };

  const handleSellAllHoldings = () => {
    if (!festivalStarted || holdingList.length === 0) return;
    holdingList.forEach((holding) => {
      executeSellTrade(holding, holding.quantity, holding.currentPrice);
    });
  };

  const handleExecuteTrade = () => {
    if (!selectedStock) return;

    const quantity = parsePositiveInt(quantityInput);
    if (quantity <= 0) {
      setTradeError("거래 수량은 1주 이상이어야 합니다.");
      return;
    }
    if (selectedTradeSide === "BUY" && quantity > maxBuyQuantity) {
      setTradeError("보유 현금을 초과하는 수량입니다.");
      return;
    }
    if (selectedTradeSide === "SELL" && quantity > maxSellQuantity) {
      setTradeError("보유 수량을 초과하는 매도입니다.");
      return;
    }

    const now = new Date().toISOString();
    const executedPrice = selectedStock.currentPrice;

    if (selectedTradeSide === "BUY") {
      const orderAmount = executedPrice * quantity;
      setCashBalance((prev) => prev - orderAmount);
      setHoldings((prev) => {
        const existing = prev[selectedStock.code];
        const nextQuantity = (existing?.quantity ?? 0) + quantity;
        const nextAveragePrice =
          nextQuantity === 0
            ? executedPrice
            : (((existing?.averagePrice ?? 0) * (existing?.quantity ?? 0)) + orderAmount) /
              nextQuantity;
        return {
          ...prev,
          [selectedStock.code]: {
            stockCode: selectedStock.code,
            stockName: selectedStock.name,
            quantity: nextQuantity,
            averagePrice: nextAveragePrice,
            logoColor: selectedStock.logoColor,
          },
        };
      });
    } else {
      const orderAmount = executedPrice * quantity;
      setCashBalance((prev) => prev + orderAmount);
      setHoldings((prev) => {
        const existing = prev[selectedStock.code];
        if (!existing) return prev;
        const remainingQuantity = existing.quantity - quantity;
        if (remainingQuantity <= 0) {
          const next = { ...prev };
          delete next[selectedStock.code];
          return next;
        }
        return {
          ...prev,
          [selectedStock.code]: {
            ...existing,
            quantity: remainingQuantity,
          },
        };
      });
    }

    setTradeHistory((prev) => [
      {
        stockCode: selectedStock.code,
        stockName: selectedStock.name,
        side: selectedTradeSide,
        orderType: "MARKET",
        quantity,
        orderPrice: executedPrice,
        executedPrice,
        status: "EXECUTED",
        createdAt: now,
        executedAt: now,
      },
      ...prev,
    ]);

    closeTradeModal();
  };

  const executeSellTrade = (holding: HoldingState, quantity: number, executedPrice: number) => {
    const now = new Date().toISOString();
    const orderAmount = executedPrice * quantity;

    setCashBalance((prev) => prev + orderAmount);
    setHoldings((prev) => {
      const existing = prev[holding.stockCode];
      if (!existing) return prev;
      const remainingQuantity = existing.quantity - quantity;
      if (remainingQuantity <= 0) {
        const next = { ...prev };
        delete next[holding.stockCode];
        return next;
      }
      return {
        ...prev,
        [holding.stockCode]: {
          ...existing,
          quantity: remainingQuantity,
        },
      };
    });
    setTradeHistory((prev) => [
      {
        stockCode: holding.stockCode,
        stockName: holding.stockName,
        side: "SELL",
        orderType: "MARKET",
        quantity,
        orderPrice: executedPrice,
        executedPrice,
        status: "EXECUTED",
        createdAt: now,
        executedAt: now,
      },
      ...prev,
    ]);
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
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="보유 현금" value={`${formatNumber(cashBalance)}원`} />
                  <MetricTile label="총 평가금" value={`${formatNumber(totalAssetValue)}원`} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="보유 종목 수" value={`${Object.keys(holdings).length}개`} />
                  <MetricTile label="진행 상태" value={festivalStarted ? "투자 진행 중" : festivalEnded ? "참여 종료" : "시작 대기"} />
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
                ) : festivalEnded ? (
                  <button
                    type="button"
                    onClick={() => navigate("/", { replace: true })}
                    className="mt-3 w-full rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    다음 참가자 등록하기
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {isFestivalPage ? (
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 lg:px-5">
              <div>
                <h2 className="text-base font-black text-slate-950">내 보유 종목</h2>
                <p className="mt-1 text-xs text-slate-500">
                  현재 보유 수량과 평가금을 바로 확인하고 매도할 수 있습니다.
                </p>
              </div>
              {holdingList.length > 0 ? (
                <button
                  type="button"
                  onClick={handleSellAllHoldings}
                  disabled={!festivalStarted}
                  className="min-h-[40px] rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  전체 매도
                </button>
              ) : null}
            </div>

            {holdingList.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {holdingList.map((holding) => (
                  <div
                    key={`summary-${holding.stockCode}`}
                    className="grid min-h-[64px] grid-cols-12 items-center gap-2 px-4 py-3 lg:gap-4 lg:px-5"
                  >
                    <button
                      type="button"
                      onClick={() => openHoldingActions(holding)}
                      disabled={!festivalStarted}
                      className="col-span-12 flex min-w-0 items-center gap-3 text-left transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-4"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: holding.logoColor }}
                      >
                        {holding.stockName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 lg:text-base">
                          {holding.stockName}
                        </p>
                        <p className="text-xs text-slate-500">{holding.stockCode}</p>
                      </div>
                    </button>

                    <div className="col-span-4 text-right lg:col-span-2">
                      <p className="text-xs text-slate-500 lg:hidden">수량</p>
                      <p className="font-bold tabular-nums text-slate-950">{formatNumber(holding.quantity)}주</p>
                    </div>
                    <div className="col-span-4 text-right lg:col-span-2">
                      <p className="text-xs text-slate-500 lg:hidden">현재가</p>
                      <p className="font-bold tabular-nums text-slate-950">{formatNumber(holding.currentPrice)}원</p>
                      <p className={`text-xs font-semibold ${holding.profitRate >= 0 ? "text-red-600" : "text-blue-600"}`}>
                        {formatSignedPercent(holding.profitRate)}
                      </p>
                    </div>
                    <div className="col-span-4 text-right lg:col-span-2">
                      <p className="text-xs text-slate-500 lg:hidden">평가금</p>
                      <p className="font-bold tabular-nums text-slate-950">{formatNumber(holding.evaluatedAmount)}원</p>
                    </div>
                    <div className="col-span-12 flex justify-end gap-2 lg:col-span-2">
                      <button
                        type="button"
                        onClick={() => openHoldingActions(holding)}
                        disabled={!festivalStarted}
                        className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        매도
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSellHolding(holding)}
                        disabled={!festivalStarted}
                        className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        전량 매도
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                아직 보유 중인 종목이 없습니다.
              </div>
            )}
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
            onClick={closeTradeModal}
            aria-hidden
          />

          <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <button
              type="button"
              onClick={closeTradeModal}
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

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedTradeSide("BUY")}
                className={`rounded-2xl px-4 py-3 text-base font-bold transition ${
                  selectedTradeSide === "BUY"
                    ? "bg-rose-500 text-white"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                }`}
              >
                매수
              </button>
              <button
                type="button"
                onClick={() => setSelectedTradeSide("SELL")}
                className={`rounded-2xl px-4 py-3 text-base font-bold transition ${
                  selectedTradeSide === "SELL"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                매도
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile label="보유 현금" value={`${formatNumber(cashBalance)}원`} />
                <MetricTile
                  label="보유 수량"
                  value={`${formatNumber(currentHolding?.quantity ?? 0)}주`}
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">거래 수량</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={quantityInput}
                  onChange={(event) => {
                    setQuantityInput(event.target.value);
                    setTradeError(null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="최대 매수 가능"
                  value={`${formatNumber(maxBuyQuantity)}주`}
                />
                <MetricTile
                  label="최대 매도 가능"
                  value={`${formatNumber(maxSellQuantity)}주`}
                />
              </div>

              <button
                type="button"
                onClick={handleAllInBuy}
                disabled={maxBuyQuantity <= 0}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                전량 매수
              </button>
              <button
                type="button"
                onClick={handleSellAllSelected}
                disabled={maxSellQuantity <= 0}
                className="rounded-2xl border border-blue-200 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                전량 매도
              </button>

              {tradeError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {tradeError}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {selectedTradeSide === "BUY"
                    ? `현재 현금으로 최대 ${formatNumber(maxBuyQuantity)}주까지 매수할 수 있습니다.`
                    : `현재 보유 수량 기준으로 최대 ${formatNumber(maxSellQuantity)}주까지 매도할 수 있습니다.`}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleExecuteTrade}
                disabled={selectedTradeSide === "BUY" ? !canBuy : !canSell}
                className={`rounded-[24px] px-4 py-5 text-lg font-black text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                  selectedTradeSide === "BUY"
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {selectedTradeSide === "BUY" ? "매수 실행" : "매도 실행"}
              </button>
              <button
                type="button"
                onClick={closeTradeModal}
                className="rounded-[24px] border border-slate-200 px-4 py-5 text-lg font-black text-slate-700 transition hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {isFestivalPage && festivalResultModal && (
        <FestivalResultModal
          returnRate={festivalResultModal.returnRate}
          onClose={() => setFestivalResultModal(null)}
        />
      )}
    </div>
  );

  function syncFestivalSessionStorage(sessionState: {
    sessionId: number;
    displayName: string;
    startCash: number;
    startedAt: string | null;
  }) {
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
  }
}

function FestivalResultModal({
  returnRate,
  onClose,
}: {
  returnRate: number;
  onClose: () => void;
}) {
  const qualified = returnRate >= FESTIVAL_PRIZE_THRESHOLD;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/55" aria-hidden />
      <div className="relative w-full max-w-md rounded-3xl bg-white px-8 py-9 text-center shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="결과 모달 닫기"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-lg font-black text-red-500 transition hover:bg-red-50 hover:text-red-600"
        >
          ×
        </button>

        <div className={`text-4xl font-black ${qualified ? "text-rose-600" : "text-slate-900"}`}>
          수익률 {formatSignedPercent(returnRate)}
        </div>
        <p className="mt-5 text-xl font-bold text-slate-950">
          {qualified ? "축하합니다! 키링이 지급됩니다." : "참여 감사합니다! 간식이 지급됩니다."}
        </p>
        <p className="mt-4 text-sm font-medium text-slate-500">
          해당 페이지를 스테프에게 보여주세요
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  accent = "text-slate-950",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}

function parsePositiveInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function roundToWon(value: number) {
  return Math.round(value);
}

function resolveMainStockName(trades: TradeHistoryState[]) {
  if (!trades.length) return null;
  const counts = new Map<string, { name: string; count: number }>();
  trades.forEach((trade) => {
    const current = counts.get(trade.stockCode);
    counts.set(trade.stockCode, {
      name: trade.stockName,
      count: (current?.count ?? 0) + 1,
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.name ?? null;
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

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function parseServerDateTime(value: string) {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`).getTime();
}
