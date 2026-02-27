import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../../components/feature/Header";
import StockSearchSection from "../../components/feature/StockSearchSection";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMarketIndices,
  getStocksByVolume,
  getStocksByRising,
  getStocksByFalling,
  getMyMatchingRooms,
  usePriceWebSocket,
  normalizeStockCodeForPrice,
} from "../../services";
import type { MarketIndex, StockListItem } from "../../types";

type TabType = "volume" | "rising" | "falling";

export default function MockInvestmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fromSolo = (location.state as { fromSolo?: boolean } | null)?.fromSolo === true;
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [stocksByVolume, setStocksByVolume] = useState<StockListItem[]>([]);
  const [stocksByRising, setStocksByRising] = useState<StockListItem[]>([]);
  const [stocksByFalling, setStocksByFalling] = useState<StockListItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("volume");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  /** 팀 없음 → 매칭방, 개인방 → /solo 판별이 끝난 후에만 본문 표시 */
  const [routeOk, setRouteOk] = useState(false);

  /** 방에 참여하지 않았으면 모의투자 불가 → 매칭방으로. 개인방(1인)도 이 페이지에서 종목 선택·매수/매도 가능(헤더 모의투자 클릭 시 이동). */
  useEffect(() => {
    if (!user) return;
    if (fromSolo && user.teamId) setRouteOk(true);
    if (!user.teamId) {
      navigate("/matching-rooms", { replace: true });
      return;
    }
    const teamNum = user.teamId.startsWith("team-")
      ? user.teamId.replace(/^team-/, "")
      : "";
    if (!teamNum) {
      setRouteOk(true);
      return;
    }
    getMyMatchingRooms()
      .then(() => setRouteOk(true))
      .catch(() => setRouteOk(true));
  }, [user, navigate, fromSolo]);

  useEffect(() => {
    setMarketError(null);
    const requests = [
      getMarketIndices(),
      getStocksByVolume(),
      getStocksByRising(),
      getStocksByFalling(),
    ] as const;
    Promise.allSettled(requests).then(([r0, r1, r2, r3]) => {
      const indices = r0.status === "fulfilled" ? r0.value : [];
      const vol = r1.status === "fulfilled" ? r1.value : [];
      const rising = r2.status === "fulfilled" ? r2.value : [];
      const falling = r3.status === "fulfilled" ? r3.value : [];
      setMarketIndices(indices);
      setStocksByVolume(vol);
      setStocksByRising(rising);
      setStocksByFalling(falling);
      const errors: string[] = [];
      if (r0.status === "rejected") errors.push("시장 지수");
      if (r1.status === "rejected") errors.push("거래량 순위");
      if (r2.status === "rejected") errors.push("상승률 순위");
      if (r3.status === "rejected") errors.push("하락률 순위");
      if (errors.length > 0) {
        const base = `${errors.join(", ")}를 불러오지 못했습니다.`;
        const kisHint =
          [r2, r3].some(
            (r) =>
              r.status === "rejected" &&
              (r.reason?.message?.includes("KIS") ||
                r.reason?.status === 503)
          )
            ? " (한국투자증권 KIS API 미설정 시 상승/하락 순위는 불가. 백엔드에 KIS_API_APPKEY, KIS_API_APPSECRET 설정 필요)"
            : "";
        setMarketError(base + kisHint);
      }
    });
  }, []);

  /** 현재 탭의 상위 30종목 코드로 실시간 시세 구독 */
  const tabStocks =
    activeTab === "volume"
      ? stocksByVolume
      : activeTab === "rising"
        ? stocksByRising
        : stocksByFalling;
  const subscribeCodes = tabStocks.slice(0, 30).map((s) => s.code);
  const realtimeUpdates = usePriceWebSocket(subscribeCodes);

  const getStockList = (): StockListItem[] => {
    let stocks: StockListItem[];
    switch (activeTab) {
      case "volume":
        stocks = stocksByVolume;
        break;
      case "rising":
        stocks = stocksByRising;
        break;
      case "falling":
        stocks = stocksByFalling;
        break;
      default:
        stocks = stocksByVolume;
    }

    if (searchQuery.trim()) {
      return stocks.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.code.includes(searchQuery)
      );
    }
    return stocks;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("ko-KR");
  };

  const handleStockClick = (stock: StockListItem) => {
    navigate(`/stock-detail?id=${stock.id}`, { state: { nameFromList: stock.name } });
  };

  if (user && !routeOk) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">이동 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-8 pb-12 px-8 max-w-7xl mx-auto">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">모의투자</h1>
          <p className="text-sm text-gray-500 mt-1">
            종목을 선택해 매수·매도 체험을 해보세요
          </p>
        </div>

        {marketError && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <i className="ri-error-warning-line"></i>
            {marketError}
          </div>
        )}

        {/* 시장 지수 카드 */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              시장 지수
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {marketIndices.map((index) => (
                <div
                  key={index.id}
                  className="text-center py-3 px-4 rounded-xl bg-gray-50"
                >
                  <p className="text-sm text-gray-600 mb-1">{index.name}</p>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {formatNumber(index.value)}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      index.change >= 0 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {index.change >= 0 ? "+" : ""}
                    {formatNumber(index.change)} ({index.change >= 0 ? "+" : ""}
                    {index.changeRate}%)
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <StockSearchSection />

        {/* 탭 + 검색 + 종목 리스트 */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 탭 & 검색 한 줄 */}
          <div className="flex flex-wrap items-center gap-4 p-5 border-b border-gray-100">
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("volume")}
                className={`py-2 px-5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "volume"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                거래량
              </button>
              <button
                onClick={() => setActiveTab("rising")}
                className={`py-2 px-5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "rising"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                급상승
              </button>
              <button
                onClick={() => setActiveTab("falling")}
                className={`py-2 px-5 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "falling"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                급하락
              </button>
            </div>
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="종목명 또는 종목코드 검색"
                className="w-full py-2.5 pl-10 pr-4 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white border border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  <i className="ri-close-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          {/* 리스트 헤더 (웹용 테이블 스타일) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-1">순위</div>
            <div className="col-span-4">종목</div>
            <div className="col-span-2 text-right">현재가</div>
            <div className="col-span-2 text-right">등락</div>
            <div className="col-span-3 text-right">등락률</div>
          </div>

          {/* 종목 리스트 */}
          <div className="divide-y divide-gray-100">
            {getStockList().length > 0 ? (
              getStockList().map((stock, index) => {
                const codeKey = normalizeStockCodeForPrice(stock.code);
                const rt = realtimeUpdates[codeKey];
                const price = rt?.currentPrice ?? stock.currentPrice;
                const change = rt?.change ?? stock.change;
                const changeRate = rt?.changeRate ?? stock.changeRate;
                return (
                  <div
                    key={`${activeTab}-${stock.code}-${index}`}
                    onClick={() => handleStockClick(stock)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors items-center"
                  >
                    <span className="hidden md:block text-sm font-medium text-gray-500 col-span-1">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-3 md:col-span-4 col-span-1">
                      <span className="md:hidden text-sm font-medium text-gray-500 w-6">
                        {index + 1}
                      </span>
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: stock.logoColor }}
                      >
                        {stock.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          {stock.name}
                        </p>
                        <p className="text-xs text-gray-500">{stock.code}</p>
                      </div>
                    </div>
                    <div className="md:text-right md:col-span-2">
                      <p className="md:hidden text-xs text-gray-500 mb-0.5">
                        현재가
                      </p>
                      <p className="font-bold text-gray-900">
                        {formatNumber(price)}원
                      </p>
                    </div>
                    <div className="md:text-right md:col-span-2">
                      <p className="md:hidden text-xs text-gray-500 mb-0.5">
                        등락
                      </p>
                      <p
                        className={`font-semibold ${
                          change >= 0 ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {formatNumber(change)}
                      </p>
                    </div>
                    <div className="md:text-right md:col-span-3">
                      <p className="md:hidden text-xs text-gray-500 mb-0.5">
                        등락률
                      </p>
                      <p
                        className={`font-semibold ${
                          changeRate >= 0 ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        {changeRate >= 0 ? "+" : ""}
                        {changeRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <i className="ri-search-line text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">검색 결과가 없습니다</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-teal-600 font-medium hover:text-teal-700 cursor-pointer"
                >
                  검색어 지우기
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
