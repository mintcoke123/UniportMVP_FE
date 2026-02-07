/**
 * 종목 상세. GET /api/stocks/:id (인증 선택)
 * @see docs/API_SPEC.md §3-5
 */
import type { StockDetailResponse } from "../types";
import { apiGet } from "./apiClient";

export async function getStockDetail(
  id: number
): Promise<StockDetailResponse | null> {
  return await apiGet<StockDetailResponse>(`/api/stocks/${id}`);
}
