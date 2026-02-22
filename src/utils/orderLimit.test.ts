/**
 * 매수 최대 수량 계산 테스트.
 * Run: npx vitest run src/utils/orderLimit.test.ts
 */
import { describe, it, expect } from "vitest";
import {
  computeMaxBuyQuantity,
  type ComputeMaxBuyQuantityParams,
} from "./orderLimit";

describe("computeMaxBuyQuantity", () => {
  it("availableCash=100, price=10 -> maxQty=10", () => {
    expect(computeMaxBuyQuantity({ availableCash: 100, price: 10 })).toBe(10);
  });

  it("availableCash=95, price=10 -> maxQty=9", () => {
    expect(computeMaxBuyQuantity({ availableCash: 95, price: 10 })).toBe(9);
  });

  it("availableCash=0 -> maxQty=0", () => {
    expect(computeMaxBuyQuantity({ availableCash: 0, price: 10 })).toBe(0);
  });

  it("price=0 -> maxQty=0", () => {
    expect(computeMaxBuyQuantity({ availableCash: 100, price: 0 })).toBe(0);
  });

  it("price negative or NaN -> maxQty=0", () => {
    expect(computeMaxBuyQuantity({ availableCash: 100, price: -1 })).toBe(0);
    expect(computeMaxBuyQuantity({ availableCash: 100, price: NaN })).toBe(0);
  });

  it("availableCash=100, price=10, feeRate=0.1 -> floor(100/11)=9", () => {
    expect(
      computeMaxBuyQuantity({ availableCash: 100, price: 10, feeRate: 0.1 })
    ).toBe(9);
  });

  it("large numbers: 10M cash, 50k price -> 200", () => {
    expect(
      computeMaxBuyQuantity({ availableCash: 10_000_000, price: 50_000 })
    ).toBe(200);
  });

  it("fractional result floors down", () => {
    expect(computeMaxBuyQuantity({ availableCash: 99, price: 10 })).toBe(9);
    expect(computeMaxBuyQuantity({ availableCash: 100, price: 3 })).toBe(33);
  });
});
