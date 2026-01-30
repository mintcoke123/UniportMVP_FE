/**
 * 종목 상세 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §3-5
 */
import type { StockDetailResponse } from '../types';
import { getStockDetail as getStockDetailMock } from '../mocks/stockDetailData';

export async function getStockDetail(
  id: number
): Promise<StockDetailResponse | null> {
  // TODO: GET /api/stocks/:id
  return Promise.resolve(getStockDetailMock(id));
}
