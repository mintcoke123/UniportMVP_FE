/**
 * 매수 최대 수량 계산. 정수(주) 단위, 소수 미지원.
 * 수수료/세금/호가단위: 현재 백엔드에 없음 → feeRate 미사용(0).
 */
export interface ComputeMaxBuyQuantityParams {
  /** 주문 가능 현금 (원). 팀 잔액 또는 계좌 현금 */
  availableCash: number;
  /** 1주 가격 (원). 시장가면 현재가, 지정가면 희망가 */
  price: number;
  /** 수수료율 (0~1). 없으면 0 → maxQty = floor(availableCash / price) */
  feeRate?: number;
}

/**
 * 매수 시 최대 주문 수량(정수 주).
 * - 수수료 없음: maxQty = floor(availableCash / price)
 * - 수수료 있음: maxQty = floor(availableCash / (price * (1 + feeRate)))
 * - price <= 0 또는 availableCash < 0 → 0
 */
export function computeMaxBuyQuantity(params: ComputeMaxBuyQuantityParams): number {
  const { availableCash, price, feeRate = 0 } = params;
  if (availableCash <= 0 || price <= 0 || !Number.isFinite(price)) return 0;
  const costPerShare = price * (1 + (feeRate ?? 0));
  if (costPerShare <= 0 || !Number.isFinite(costPerShare)) return 0;
  const qty = availableCash / costPerShare;
  return Math.floor(qty);
}
