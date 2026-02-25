/**
 * 주문 체결. POST /api/trades (명세 §3-6)
 * 팀 잔액/보유 기준으로 즉시 매수·매도 체결.
 */
import { apiPost } from "./apiClient";

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

export async function placeTrade(
  body: PlaceTradeRequest
): Promise<PlaceTradeResponse> {
  return apiPost<PlaceTradeResponse>("/api/trades", body);
}
