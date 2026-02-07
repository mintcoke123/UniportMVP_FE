/**
 * 시장 지수·종목 목록. GET /api/market/indices, GET /api/market/stocks
 * @see docs/API_SPEC.md §3
 */
import type { MarketIndex, StockListItem } from "../types";
import { apiGet } from "./apiClient";

export async function getMarketIndices(): Promise<MarketIndex[]> {
  return await apiGet<MarketIndex[]>("/api/market/indices");
}

export async function getStocksByVolume(): Promise<StockListItem[]> {
  return await apiGet<StockListItem[]>("/api/market/stocks?sort=volume");
}

export async function getStocksByRising(): Promise<StockListItem[]> {
  return await apiGet<StockListItem[]>("/api/market/stocks?sort=rising");
}

export async function getStocksByFalling(): Promise<StockListItem[]> {
  return await apiGet<StockListItem[]>("/api/market/stocks?sort=falling");
}
