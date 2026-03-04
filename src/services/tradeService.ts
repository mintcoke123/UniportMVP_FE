/**
 * 주문 체결. POST /api/trades (명세 §3-6)
 * 팀 잔액/보유 기준으로 즉시 매수·매도 체결.
 * 주문 목록·지정가 취소: GET/DELETE /trade/orders (TradeController).
 */
import { apiDelete, apiGet, apiPost } from "./apiClient";

export interface PlaceTradeRequest {
  stockId: number;
  side: "buy" | "sell";
  quantity: number;
  pricePerShare: number;
  reason?: string;
  tags?: string[];
}

export interface PlaceTradeResponse {
  success: boolean;
  message?: string;
  orderId?: string;
  executedAt?: string;
}

/** 백엔드 OrderResponseDTO. status: PENDING | COMPLETED | CANCELLED */
export interface OrderItem {
  orderId: number;
  stockCode: string;
  quantity: number;
  price: number;
  orderType: "MARKET" | "LIMIT";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  orderDate: string;
  externalOrderNo?: string;
  message?: string;
}

/** TradeController 응답: ApiResponse<T> → data 필드 사용 */
interface TradeApiResponse<T> {
  status?: string;
  message?: string | null;
  data: T;
}

export async function placeTrade(
  body: PlaceTradeRequest,
): Promise<PlaceTradeResponse> {
  return apiPost<PlaceTradeResponse>("/api/trades", body);
}

/** 내 주문 목록. GET /trade/orders (인증 필요) */
export async function getOrders(): Promise<OrderItem[]> {
  const res = await apiGet<TradeApiResponse<OrderItem[]>>("/trade/orders");
  return Array.isArray(res?.data) ? res.data : [];
}

/** 지정가 등 미체결 주문 취소. DELETE /trade/orders/{orderId} (본인 주문만) */
export async function cancelOrder(orderId: number): Promise<OrderItem> {
  const res = await apiDelete<TradeApiResponse<OrderItem>>(
    `/trade/orders/${orderId}`,
  );
  if (res?.data == null) throw new Error("Cancel response missing data");
  return res.data;
}
