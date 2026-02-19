/**
 * 실시간 시세 WebSocket. 백엔드 /prices 에 연결 후 subscribe 메시지로 종목코드 전송.
 * 수신: { stockCode, currentPrice, change, changeRate, volume, updatedAtMillis }
 */
import { useEffect, useState } from "react";
import type { RealtimePriceUpdate } from "../types";

const getWsBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  const base = url ? url.replace(/\/$/, "") : "http://localhost:8080";
  return base.replace(/^http/, "ws");
};

/** 실시간 시세 WebSocket URL (쿼리 없이 연결, 연결 후 subscribe 메시지 전송) */
export function getPriceWebSocketUrl(): string {
  return `${getWsBaseUrl()}/prices`;
}

/** 6자리 종목코드로 정규화 */
function normalizeCode(code: string): string {
  const t = (code || "").trim();
  if (t.length >= 6) return t;
  return t.padStart(6, "0");
}

export interface UsePriceWebSocketOptions {
  /** 구독할 종목코드 목록 (변경 시 재구독) */
  stockCodes: string[];
  /** 수신 시 호출 */
  onUpdate?: (data: RealtimePriceUpdate) => void;
}

/**
 * 실시간 시세 WebSocket 연결 및 구독.
 * stockCodes가 비어 있으면 연결하지 않음. 연결 후 subscribe 메시지 전송.
 */
export function connectPriceWebSocket(
  options: UsePriceWebSocketOptions
): () => void {
  const { stockCodes, onUpdate } = options;
  const codes = stockCodes
    .map((c) => normalizeCode(c))
    .filter((c) => c.length === 6);
  if (codes.length === 0) return () => {};

  const url = getPriceWebSocketUrl();
  const ws = new WebSocket(url);

  const close = (): void => {
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    } catch {
      // ignore
    }
  };

  ws.onopen = () => {
    ws.send(JSON.stringify({ subscribe: codes }));
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string) as RealtimePriceUpdate;
      if (data && typeof data.stockCode === "string" && typeof data.currentPrice === "number") {
        onUpdate?.(data);
      }
    } catch {
      // ignore parse error
    }
  };

  ws.onerror = () => {
    // connection failed or dropped; caller can rely on onclose
  };

  ws.onclose = () => {
    // already closed
  };

  return close;
}

/** React 훅: 실시간 시세 구독. 반환값 updates[stockCode] 로 해당 종목 최신 푸시 데이터 사용 */
export function usePriceWebSocket(stockCodes: string[]): Record<string, RealtimePriceUpdate> {
  const [updates, setUpdates] = useState<Record<string, RealtimePriceUpdate>>({});

  useEffect(() => {
    const codes = stockCodes.map((c) => normalizeCode(c)).filter((c) => c.length === 6);
    if (codes.length === 0) {
      setUpdates({});
      return;
    }
    const close = connectPriceWebSocket({
      stockCodes: codes,
      onUpdate: (data) => {
        setUpdates((prev) => ({ ...prev, [data.stockCode]: data }));
      },
    });
    return close;
  }, [stockCodes.join(",")]);

  return updates;
}
