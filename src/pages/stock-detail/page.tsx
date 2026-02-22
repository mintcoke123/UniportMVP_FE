import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  getStockDetail,
  sendTradeMessage,
  createVote,
  getVotes,
  getMyMatchingRooms,
  getGroupPortfolio,
  getMyGroupPortfolio,
  usePriceWebSocket,
  normalizeStockCodeForPrice,
} from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/feature/Header";
import StockChart from "./components/StockChart";
import MyHolding from "./components/MyHolding";
import type { StockDetailResponse, VoteItem } from "../../types";
import { computeMaxBuyQuantity } from "../../utils/orderLimit";

type OrderType = "buy" | "sell" | null;

const investmentReasons = ["#실적발표", "#저평가", "#장기투자", "#급등기대"];

/** user.teamId (예: "team-123") → 채팅/투표 API용 groupId 123 */
function teamIdToGroupId(teamId: string | null | undefined): number | null {
  if (!teamId || !teamId.startsWith("team-")) return null;
  const n = parseInt(teamId.slice(5), 10);
  return Number.isNaN(n) || n < 1 ? null : n;
}
/** room.id (예: "room-66") → 채팅/투표 API용 groupId 66. teamId 없을 때 내 방 목록에서 사용 */
function roomIdToGroupId(roomId: string | undefined): number | null {
  if (!roomId || !roomId.startsWith("room-")) return null;
  const n = parseInt(roomId.slice(5), 10);
  return Number.isNaN(n) || n < 1 ? null : n;
}
const STORAGE_KEY_SELECTED_ROOM = "uniport_selected_room_id";

const StockDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const stockId = parseInt(searchParams.get("id") || "1");
  const [stock, setStock] = useState<StockDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const nameFromList = (location.state as { nameFromList?: string } | null)
    ?.nameFromList;
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getStockDetail(stockId)
      .then(setStock)
      .catch(() => setStock(null))
      .finally(() => setLoading(false));
  }, [stockId]);

  /** 실시간 시세 (백엔드 /prices WebSocket). 있으면 표시값으로 사용 */
  const realtimeUpdates = usePriceWebSocket(stock ? [stock.code] : []);
  const rt = stock?.code ? realtimeUpdates[normalizeStockCodeForPrice(stock.code)] : null;
  const displayCurrentPrice = rt?.currentPrice ?? stock?.currentPrice ?? 0;
  const displayChange = rt?.change ?? stock?.change ?? 0;
  const displayChangeRate = rt?.changeRate ?? stock?.changeRate ?? 0;

  /** API가 '종목_코드'만 주거나 상품유형(ETF/ELW/ETN)만 줄 때는 리스트에서 넘긴 종목명 사용 */
  const expectedFallback = stock ? `종목_${stock.code}` : "";
  const isFallbackName =
    stock &&
    (stock.name === expectedFallback || stock.name.startsWith("종목_"));
  const isGenericProductType =
    stock && /^(ETF|ELW|ETN)$/i.test(String(stock?.name ?? "").trim());
  const displayName =
    stock && nameFromList && (isFallbackName || isGenericProductType)
      ? nameFromList
      : (stock?.name ?? "");

  const [orderType, setOrderType] = useState<OrderType>(null);
  const [quantity, setQuantity] = useState(1);
  const [pricePerShare, setPricePerShare] = useState(stock?.currentPrice || 0);
  const [investmentLogic, setInvestmentLogic] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [orderStrategy, setOrderStrategy] = useState<
    "MARKET" | "LIMIT" | "CONDITIONAL"
  >("MARKET");
  const [limitPrice, setLimitPrice] = useState(0);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [triggerDirection, setTriggerDirection] = useState<"ABOVE" | "BELOW">(
    "ABOVE",
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  /** 중복 제출 방지: 동기 가드 (setState는 배치되어 두 번째 클릭이 통과할 수 있음) */
  const submittingRef = useRef(false);
  /** 팀 보유 수량 (종목 상세 API에 없을 때 그룹 포트폴리오로 보충) */
  const [teamHoldQuantityFallback, setTeamHoldQuantityFallback] = useState<
    number | null
  >(null);
  /** 그룹 투표 목록 (같은 종목 중복 매수/매도 투표 방지용) */
  const [groupVotes, setGroupVotes] = useState<VoteItem[]>([]);
  /** 매수 시 주문 가능 현금(팀 잔액). null=미로드, 0=로드됨/잔액없음 */
  const [availableCash, setAvailableCash] = useState<number | null>(null);
  const [cashLoadError, setCashLoadError] = useState(false);

  useEffect(() => {
    if (!stock || stock.myHolding != null) {
      setTeamHoldQuantityFallback(null);
      return;
    }
    const gid = teamIdToGroupId(user?.teamId ?? null);
    if (gid == null) return;
    const fetchPortfolio =
      gid > 0 ? () => getGroupPortfolio(gid) : getMyGroupPortfolio;
    fetchPortfolio()
      .then((res) => {
        if (!res?.holdings?.length) return;
        const code = (stock.code || "").trim();
        const match = res.holdings.find(
          (h) => (h.stockCode || "").trim() === code,
        );
        if (match) setTeamHoldQuantityFallback(match.quantity ?? 0);
        else setTeamHoldQuantityFallback(null);
      })
      .catch(() => setTeamHoldQuantityFallback(null));
  }, [stock?.id, stock?.code, stock?.myHolding, user?.teamId]);

  /** 그룹 투표 목록 로드 (매수/매도 버튼 비활성 판단용) */
  useEffect(() => {
    if (!stock) return;
    let gid = teamIdToGroupId(user?.teamId ?? null);
    if (gid == null && typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_ROOM);
      if (saved) gid = roomIdToGroupId(saved);
    }
    if (gid == null) return;
    getVotes(gid)
      .then(setGroupVotes)
      .catch(() => setGroupVotes([]));
  }, [stock?.id, user?.teamId]);

  /** 매수 시 주문 가능 현금(팀 잔액) 로드. totalValue - 보유 종목 평가합 */
  useEffect(() => {
    if (!stock) return;
    setCashLoadError(false);
    const gid = teamIdToGroupId(user?.teamId ?? null);
    const fetchPortfolio =
      gid != null ? () => getGroupPortfolio(gid) : () => getMyGroupPortfolio();
    fetchPortfolio()
      .then((res) => {
        if (!res) {
          setAvailableCash(0);
          return;
        }
        const holdingsValue = (res.holdings ?? []).reduce(
          (s, h) => s + (h.currentValue ?? 0),
          0,
        );
        const cash = Math.max(0, (res.totalValue ?? 0) - holdingsValue);
        setAvailableCash(cash);
      })
      .catch(() => {
        setCashLoadError(true);
        setAvailableCash(0);
      });
  }, [stock?.id, user?.teamId]);

  /** 종목코드 6자리 통일 (비교용). 빈 값은 그대로. */
  const normalizeCode = (s: string | undefined) => {
    const t = String(s ?? "").trim();
    if (!t) return "";
    return t.length >= 6 ? t : t.padStart(6, "0");
  };

  /** 진행 중(투표/대기/주문중) 상태: ongoing, pending, executing, passed */
  const isVoteActive = (s: VoteItem["status"]) =>
    s === "ongoing" || s === "pending" || s === "executing" || s === "passed";

  /** 해당 종목에 동일 유형(매수/매도) 진행 중인 투표가 있으면 true. stockCode 비어 있는 투표는 제외. */
  const hasOngoingVoteForStock = (type: "매수" | "매도") => {
    const code = normalizeCode(stock?.code);
    if (!code) return false;
    return groupVotes.some(
      (v) =>
        isVoteActive(v.status) &&
        normalizeCode(v.stockCode) === code &&
        v.type === type,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">데이터를 가져오고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">종목을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isPositive = displayChange >= 0;
  const unitPrice =
    orderStrategy === "LIMIT"
      ? limitPrice
      : orderStrategy === "MARKET"
        ? displayCurrentPrice
        : null;
  const totalAmount =
    orderStrategy === "LIMIT"
      ? limitPrice * quantity
      : orderStrategy === "MARKET"
        ? displayCurrentPrice * quantity
        : null;

  /** 현재 팀의 해당 주식 보유 수량 (매도 시 최대값). API myHolding 우선, 없으면 그룹 포트폴리오 보충 */
  const maxQuantityByHolding =
    stock.myHolding?.quantity ?? teamHoldQuantityFallback ?? 0;

  /** 매수 시 사용 가격 (시장가=현재가, 지정가=희망가, 조건부=감시가) */
  const buyUnitPrice =
    orderStrategy === "LIMIT"
      ? limitPrice
      : orderStrategy === "CONDITIONAL"
        ? triggerPrice
        : displayCurrentPrice;
  /** 매수 최대 수량 (주문 가능 현금 기준, 정수 주) */
  const maxBuyQuantity = computeMaxBuyQuantity({
    availableCash: availableCash ?? 0,
    price: buyUnitPrice,
  });

  const handleOpenModal = (type: OrderType) => {
    setOrderType(type);
    setPricePerShare(displayCurrentPrice);
    if (type === "sell") {
      const maxQty = maxQuantityByHolding;
      setQuantity(maxQty > 0 ? Math.min(1, maxQty) : 1);
    } else {
      const cash = availableCash ?? 0;
      const price = displayCurrentPrice || 1;
      const maxQ = computeMaxBuyQuantity({ availableCash: cash, price });
      setQuantity(maxQ > 0 ? Math.min(1, maxQ) : 1);
    }
    setInvestmentLogic("");
    setSelectedTags([]);
    setOrderStrategy("MARKET");
    setLimitPrice(displayCurrentPrice);
    setTriggerPrice(displayCurrentPrice);
    setTriggerDirection("ABOVE");
  };

  const handleCloseModal = () => {
    setOrderType(null);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSharePlan = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (isConfirming) {
      submittingRef.current = false;
      return;
    }
    setShareError(null);
    if (quantity <= 0) {
      setShareError("1주 이상만 매수/매도할 수 있습니다.");
      submittingRef.current = false;
      return;
    }
    if (
      orderStrategy === "LIMIT" &&
      (limitPrice <= 0 || !Number.isFinite(limitPrice))
    ) {
      setShareError("지정가 주문은 희망가를 0보다 크게 입력해주세요.");
      submittingRef.current = false;
      return;
    }
    if (
      orderStrategy === "CONDITIONAL" &&
      (triggerPrice <= 0 || !Number.isFinite(triggerPrice))
    ) {
      setShareError("조건부 주문은 조건가를 0보다 크게 입력해주세요.");
      submittingRef.current = false;
      return;
    }
    if (orderType === "sell") {
      if (maxQuantityByHolding <= 0) {
        setShareError("팀 보유 수량이 없어 매도할 수 없습니다.");
        submittingRef.current = false;
        return;
      }
      if (quantity > maxQuantityByHolding) {
        setShareError(
          `보유 수량(${maxQuantityByHolding.toLocaleString()}주)을 초과해 매도할 수 없습니다.`,
        );
        submittingRef.current = false;
        return;
      }
    }
    if (orderType === "buy") {
      const priceForSubmit =
        orderStrategy === "LIMIT"
          ? limitPrice
          : orderStrategy === "MARKET"
            ? displayCurrentPrice
            : triggerPrice;
      const maxQtySubmit = computeMaxBuyQuantity({
        availableCash: availableCash ?? 0,
        price: priceForSubmit,
      });
      if (priceForSubmit <= 0 || !Number.isFinite(priceForSubmit)) {
        setShareError("가격을 입력해 주세요.");
        submittingRef.current = false;
        return;
      }
      if (quantity > maxQtySubmit) {
        setShareError(
          maxQtySubmit === 0
            ? "주문 가능 잔액이 부족합니다."
            : `최대 ${maxQtySubmit.toLocaleString()}주까지 가능합니다.`,
        );
        submittingRef.current = false;
        return;
      }
    }

    let groupId = teamIdToGroupId(user?.teamId ?? null);
    if (groupId == null && typeof localStorage !== "undefined") {
      const savedRoomId = localStorage.getItem(STORAGE_KEY_SELECTED_ROOM);
      if (savedRoomId) groupId = roomIdToGroupId(savedRoomId);
    }
    if (groupId == null) {
      const rooms = await getMyMatchingRooms().catch(() => []);
      const room =
        rooms.find((r) => r.status === "started") ??
        rooms.find((r) => r.status === "full") ??
        rooms[0];
      groupId = room ? (roomIdToGroupId(room.id) ?? null) : null;
    }

    if (groupId != null) {
      const voteType = orderType === "buy" ? "매수" : "매도";
      const norm = (s: string | undefined) => String(s ?? "").trim();
      const existingVotes = await getVotes(groupId);
      const hasOngoing = existingVotes.some(
        (v) =>
          isVoteActive(v.status) &&
          norm(v.stockCode) === norm(stock.code) &&
          v.type === voteType,
      );
      if (hasOngoing) {
        setShareError(
          `이미 해당 종목에 대한 ${voteType} 투표가 진행 중입니다.`,
        );
        submittingRef.current = false;
        return;
      }
    }

    setIsConfirming(true);

    try {
      if (groupId != null) {
        const action = orderType === "buy" ? "매수" : "매도";
        const payload: Parameters<typeof createVote>[1] = {
          type: action as "매수" | "매도",
          stockName: displayName,
          stockCode: stock.code,
          quantity,
          proposedPrice:
            orderStrategy === "LIMIT"
              ? limitPrice
              : orderStrategy === "MARKET"
                ? displayCurrentPrice
                : triggerPrice,
          reason: investmentLogic.trim() || `${displayName} ${action} 계획`,
          orderStrategy,
        };
        if (orderStrategy === "LIMIT" && limitPrice > 0) {
          payload.limitPrice = limitPrice;
        }
        if (orderStrategy === "CONDITIONAL" && triggerPrice > 0) {
          payload.triggerPrice = triggerPrice;
          payload.triggerDirection = triggerDirection;
        }
        const createRes = await createVote(groupId, payload);
        const voteId = createRes.voteId;
        const clientMessageId =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const tradeData = {
          action: action as "매수" | "매도",
          stockName: displayName,
          quantity,
          pricePerShare:
            orderStrategy === "LIMIT"
              ? limitPrice
              : orderStrategy === "MARKET"
                ? displayCurrentPrice
                : triggerPrice,
          totalAmount: totalAmount ?? 0,
          reason: payload.reason,
          tags: selectedTags,
          clientMessageId,
          ...(voteId != null && Number.isFinite(voteId) ? { voteId } : {}),
        };
        await sendTradeMessage(groupId, tradeData);
      }

      setShowConfirmDialog(false);
      setOrderType(null);
      setShowSuccessMessage(true);
      setTimeout(() => navigate("/chat"), 1000);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "공유에 실패했습니다.");
    } finally {
      setIsConfirming(false);
      submittingRef.current = false;
    }
  };

  const handleCancelConfirm = () => {
    if (isConfirming) return;
    setShowConfirmDialog(false);
    setShareError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header />
      {/* 페이지 상단: 뒤로가기 */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-1 py-2 -ml-1 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl"></i>
            <span className="text-lg font-semibold">뒤로가기</span>
          </button>
        </div>
      </div>

      {/* Stock Info */}
      <div className="bg-white px-5 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: stock.logoColor }}
          >
            {displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold">{displayName}</h2>
            <p className="text-sm text-gray-500">{stock.code}</p>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold">
            {displayCurrentPrice.toLocaleString()}원
          </p>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-lg font-semibold ${
                isPositive ? "text-red-500" : "text-blue-500"
              }`}
            >
              {isPositive ? "+" : ""}
              {displayChange.toLocaleString()}원
            </span>
            <span
              className={`text-lg font-semibold ${
                isPositive ? "text-red-500" : "text-blue-500"
              }`}
            >
              {isPositive ? "+" : ""}
              {displayChangeRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <StockChart stockName={displayName} stockCode={stock.code} />

      {/* 팀 보유 수량 표기 */}
      <div className="bg-white mt-2 px-5 py-4 border-b border-gray-100">
        <p className="text-sm text-gray-500 mb-1">팀 보유 수량</p>
        <p className="text-lg font-bold text-gray-900">
          {maxQuantityByHolding.toLocaleString()}주
        </p>
      </div>

      {/* My Holding (상세: 평단가·평가금액 등) */}
      {stock.myHolding && <MyHolding holding={stock.myHolding} />}

      {/* 팀 보유만 있고 상세 없을 때 */}
      {!stock.myHolding && maxQuantityByHolding > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm text-gray-500">팀 보유내역</p>
          <p className="text-base font-semibold mt-1">
            {maxQuantityByHolding.toLocaleString()}주 보유
          </p>
        </div>
      )}

      {/* Buy/Sell Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-50">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleOpenModal("sell")}
            disabled={
              maxQuantityByHolding <= 0 || hasOngoingVoteForStock("매도")
            }
            className="flex-1 py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              maxQuantityByHolding <= 0
                ? "팀 보유 수량이 없어 매도할 수 없습니다."
                : hasOngoingVoteForStock("매도")
                  ? "이미 해당 종목에 대한 매도 투표가 진행 중입니다."
                  : undefined
            }
          >
            매도
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal("buy")}
            disabled={hasOngoingVoteForStock("매수")}
            className="flex-1 py-3.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              hasOngoingVoteForStock("매수")
                ? "이미 해당 종목에 대한 매수 투표가 진행 중입니다."
                : undefined
            }
          >
            매수
          </button>
        </div>
        {hasOngoingVoteForStock("매수") && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            이 종목에 대한 매수 투표가 진행 중이라 매수할 수 없습니다. 채팅방
            투표에서 찬성/반대 후 진행해 주세요.
          </p>
        )}
      </div>

      {/* Order Modal */}
      {orderType && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold">
                {orderType === "buy" ? "매수" : "매도"} 계획 공유
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-500"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
              {/* 매수 시: 주문 가능 현금 */}
              {orderType === "buy" && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-gray-600 text-sm">주문 가능 현금</span>
                  {availableCash === null && !cashLoadError && (
                    <p className="text-sm text-gray-500 mt-0.5">불러오는 중...</p>
                  )}
                  {cashLoadError && (
                    <p className="text-sm text-amber-600 mt-0.5">
                      현금 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
                    </p>
                  )}
                  {availableCash !== null && !cashLoadError && (
                    <p className="text-lg font-semibold text-gray-900 mt-0.5">
                      {availableCash.toLocaleString("ko-KR")}원
                    </p>
                  )}
                </div>
              )}

              {/* Stock Name & Quantity */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">종목 이름</span>
                  <span className="font-semibold">{displayName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">거래 수량</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <input
                      type="number"
                      min={orderType === "buy" && maxBuyQuantity === 0 ? undefined : 1}
                      max={
                        orderType === "sell"
                          ? maxQuantityByHolding
                          : orderType === "buy"
                            ? (maxBuyQuantity > 0 ? maxBuyQuantity : undefined)
                            : maxQuantityByHolding > 0
                              ? maxQuantityByHolding
                              : undefined
                      }
                      value={quantity}
                      disabled={orderType === "buy" && maxBuyQuantity === 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (e.target.value === "") {
                          setQuantity(1);
                          return;
                        }
                        if (Number.isNaN(val)) return;
                        const minQ = 1;
                        const maxQ =
                          orderType === "sell"
                            ? maxQuantityByHolding
                            : orderType === "buy"
                              ? maxBuyQuantity
                              : maxQuantityByHolding > 0
                                ? maxQuantityByHolding
                                : undefined;
                        const clamped =
                          maxQ != null
                            ? Math.min(Math.max(val, minQ), maxQ)
                            : Math.max(val, minQ);
                        setQuantity(clamped);
                      }}
                      onBlur={() => {
                        const minQ = 1;
                        const maxQ =
                          orderType === "sell"
                            ? maxQuantityByHolding
                            : orderType === "buy"
                              ? maxBuyQuantity
                              : maxQuantityByHolding > 0
                                ? maxQuantityByHolding
                                : undefined;
                        if (quantity < minQ) setQuantity(minQ);
                        else if (maxQ != null && quantity > maxQ)
                          setQuantity(maxQ);
                      }}
                      className="w-20 py-2 px-3 text-right font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <span className="text-gray-600">주</span>
                    {orderType === "sell" && maxQuantityByHolding > 0 && (
                      <span className="text-xs text-gray-400">
                        (최대 {maxQuantityByHolding.toLocaleString()}주)
                      </span>
                    )}
                    {orderType === "buy" && maxBuyQuantity > 0 && (
                      <>
                        <span className="text-xs text-gray-400">
                          (최대 {maxBuyQuantity.toLocaleString()}주)
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(maxBuyQuantity)}
                          className="text-xs font-medium text-teal-600 hover:text-teal-700 cursor-pointer"
                        >
                          최대
                        </button>
                      </>
                    )}
                    {orderType === "buy" && maxBuyQuantity === 0 && availableCash !== null && !cashLoadError && (
                      <span className="text-xs text-amber-600">잔액 부족</span>
                    )}
                  </div>
                </div>
                {orderType === "buy" && quantity > maxBuyQuantity && maxBuyQuantity > 0 && (
                  <p className="text-xs text-amber-600">
                    최대 {maxBuyQuantity.toLocaleString()}주까지 가능합니다.
                  </p>
                )}
              </div>

              {/* 주문 방식 */}
              <div className="mb-6">
                <span className="block text-gray-600 mb-2">주문 방식</span>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      { value: "MARKET" as const, label: "시장가" },
                      { value: "LIMIT" as const, label: "지정가" },
                      { value: "CONDITIONAL" as const, label: "조건부" },
                    ] as const
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrderStrategy(value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                        orderStrategy === value
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {orderStrategy === "LIMIT" && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-gray-600 text-sm whitespace-nowrap">
                      희망가
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={limitPrice || ""}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (e.target.value === "") setLimitPrice(0);
                        else if (Number.isFinite(v) && v >= 0) setLimitPrice(v);
                      }}
                      className="flex-1 py-2 px-3 text-right font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-gray-600 text-sm">원</span>
                  </div>
                )}
                {orderStrategy === "CONDITIONAL" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm whitespace-nowrap">
                        조건
                      </span>
                      <select
                        value={triggerDirection}
                        onChange={(e) =>
                          setTriggerDirection(
                            e.target.value as "ABOVE" | "BELOW",
                          )
                        }
                        className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="ABOVE">이상</option>
                        <option value="BELOW">이하</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={triggerPrice || ""}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (e.target.value === "") setTriggerPrice(0);
                          else if (Number.isFinite(v) && v >= 0)
                            setTriggerPrice(v);
                        }}
                        className="flex-1 py-2 px-3 text-right font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-gray-600 text-sm">원</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mb-6">
                {orderType === "buy" ? "매수" : "매도"} 계획을 공유합니다
              </p>

              {/* Price & Total (전략별) */}
              <div className="space-y-4 mb-6">
                {orderStrategy === "MARKET" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">1주 가격</span>
                      <span className="font-semibold">
                        {displayCurrentPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">전체 주문 금액</span>
                      <span className="font-semibold">
                        {(displayCurrentPrice * quantity).toLocaleString()}원
                      </span>
                    </div>
                  </>
                )}
                {orderStrategy === "LIMIT" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">1주 가격</span>
                      <span className="font-semibold">
                        {limitPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">전체 주문 금액</span>
                      <span className="font-semibold">
                        {(limitPrice * quantity).toLocaleString()}원
                      </span>
                    </div>
                  </>
                )}
                {orderStrategy === "CONDITIONAL" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">감시 가격</span>
                      <span className="font-semibold">
                        {triggerPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">주문 가격</span>
                      <span className="font-semibold">시장가(체결 시점)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">예상 금액</span>
                      <span className="font-semibold">체결 시점에 결정</span>
                    </div>
                  </>
                )}
              </div>

              {/* Investment Logic */}
              <div className="mb-4">
                <label className="block text-gray-600 mb-2">투자 논리</label>
                <textarea
                  value={investmentLogic}
                  onChange={(e) =>
                    setInvestmentLogic(e.target.value.slice(0, 500))
                  }
                  placeholder="투자를 계획하시는 이유를 작성해주세요"
                  className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  maxLength={500}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {investmentReasons.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors whitespace-nowrap ${
                      selectedTags.includes(tag)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Share Button */}
              <button
                onClick={handleSharePlan}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-colors cursor-pointer whitespace-nowrap ${
                  orderType === "buy"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {orderType === "buy" ? "매수" : "매도"} 계획 공유하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelConfirm}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl overflow-hidden animate-scale-up">
            {/* Dialog Header */}
            <div className="px-5 pt-6 pb-4 text-center">
              <h4 className="text-lg font-bold mb-1">
                {orderType === "buy" ? "매수" : "매도"} 확인
              </h4>
              <p className="text-sm text-gray-500">
                아래 내용으로 {orderType === "buy" ? "매수" : "매도"} 계획을
                공유합니다
              </p>
            </div>

            {/* Dialog Content */}
            <div className="px-5 pb-5">
              {shareError && (
                <p className="text-sm text-red-600 mb-3">{shareError}</p>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">종목명</span>
                  <span className="font-semibold">{displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">수량</span>
                  <span className="font-semibold">{quantity}주</span>
                </div>
                {orderStrategy === "MARKET" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">1주 가격</span>
                      <span className="font-semibold">
                        {displayCurrentPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">주문 금액</span>
                      <span className="font-semibold">
                        {(displayCurrentPrice * quantity).toLocaleString()}원
                      </span>
                    </div>
                  </>
                )}
                {orderStrategy === "LIMIT" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">1주 가격</span>
                      <span className="font-semibold">
                        {limitPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">주문 금액</span>
                      <span className="font-semibold">
                        {(limitPrice * quantity).toLocaleString()}원
                      </span>
                    </div>
                  </>
                )}
                {orderStrategy === "CONDITIONAL" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">감시 가격</span>
                      <span className="font-semibold">
                        {triggerPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">주문 가격</span>
                      <span className="font-semibold">시장가(체결 시점)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">예상 금액</span>
                      <span className="font-semibold">체결 시점에 결정</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dialog Buttons */}
            <div className="flex border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={isConfirming}
                className="flex-1 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <div className="w-px bg-gray-100"></div>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isConfirming || quantity <= 0}
                className={`flex-1 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                  orderType === "buy"
                    ? "text-red-500 hover:bg-red-50"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                {isConfirming ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative bg-white rounded-2xl px-8 py-6 shadow-xl animate-scale-up">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                <i className="ri-check-line text-white text-3xl"></i>
              </div>
              <p className="text-lg font-bold text-gray-900">공유 완료!</p>
              <p className="text-sm text-gray-500">채팅방으로 이동합니다</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes scale-up {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StockDetailPage;
