/**
 * 시장 지수·종목 목록 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §3
 */
import type { MarketIndex, StockListItem } from '../types';
import {
  marketIndices,
  stocksByVolume,
  stocksByRising,
  stocksByFalling,
} from '../mocks/stockMarketData';

export async function getMarketIndices(): Promise<MarketIndex[]> {
  // TODO: GET /api/market/indices
  return Promise.resolve(marketIndices);
}

export async function getStocksByVolume(): Promise<StockListItem[]> {
  // TODO: GET /api/market/stocks?sort=volume
  return Promise.resolve(stocksByVolume);
}

export async function getStocksByRising(): Promise<StockListItem[]> {
  // TODO: GET /api/market/stocks?sort=rising
  return Promise.resolve(stocksByRising);
}

export async function getStocksByFalling(): Promise<StockListItem[]> {
  // TODO: GET /api/market/stocks?sort=falling
  return Promise.resolve(stocksByFalling);
}
