/**
 * OHLCV 차트 데이터. GET /api/ohlcv?code=...&tf=1D&count=200
 * 응답 형태에 무관하게 표준 포맷으로 정규화하여 반환.
 */
import { apiGet } from "./apiClient";

/** lightweight-charts CandlestickData 시간: 일봉은 BusinessDay, 분봉 등은 UTCTimestamp */
export type OhlcvTime = { year: number; month: number; day: number } | number;

export interface OhlcvCandlestick {
  time: OhlcvTime;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** yyyymmdd 문자열을 BusinessDay로 변환 */
function yyyymmddToBusinessDay(yyyymmdd: string): { year: number; month: number; day: number } {
  const s = String(yyyymmdd).trim();
  let y = 0,
    m = 0,
    d = 0;
  if (s.length >= 8) {
    y = Number(s.slice(0, 4));
    m = Number(s.slice(4, 6));
    d = Number(s.slice(6, 8));
  }
  if (!Number.isFinite(y)) y = 2000;
  if (!Number.isFinite(m) || m < 1) m = 1;
  if (!Number.isFinite(d) || d < 1) d = 1;
  return { year: y, month: m, day: d };
}

/** "YYYY-MM-DD" 또는 "yyyymmdd" → BusinessDay */
function dateStringToBusinessDay(str: string): { year: number; month: number; day: number } {
  const s = String(str).trim();
  if (/^\d{8}$/.test(s)) return yyyymmddToBusinessDay(s);
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match)
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  return yyyymmddToBusinessDay(s.replace(/-/g, ""));
}

/** API 응답 한 행을 표준 캔들로 변환 (일봉 가정: time → BusinessDay) */
function rowToCandlestick(
  row: Record<string, unknown>,
  isDaily: boolean
): OhlcvCandlestick | null {
  const open = Number(row.open ?? row.openPrice ?? row.o ?? 0);
  const high = Number(row.high ?? row.highPrice ?? row.h ?? 0);
  const low = Number(row.low ?? row.lowPrice ?? row.l ?? 0);
  const close = Number(row.close ?? row.closePrice ?? row.c ?? row.stck_prpr ?? 0);
  if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close))
    return null;

  let time: OhlcvTime;
  const rawTime = row.time ?? row.date ?? row.dt ?? row.stck_bsop_date ?? row.timestamp;
  if (isDaily && (typeof rawTime === "string" || typeof rawTime === "number")) {
    if (typeof rawTime === "number") {
      const t = rawTime;
      if (t > 1e12) time = Math.floor(t / 1000) as OhlcvTime;
      else if (t > 1e8) time = yyyymmddToBusinessDay(String(t));
      else time = t as OhlcvTime;
    } else {
      time = dateStringToBusinessDay(rawTime);
    }
  } else if (typeof rawTime === "number") {
    time = rawTime > 1e12 ? Math.floor(rawTime / 1000) : rawTime;
  } else if (typeof rawTime === "string") {
    if (/^\d+$/.test(rawTime)) time = dateStringToBusinessDay(rawTime);
    else time = dateStringToBusinessDay(rawTime);
  } else {
    return null;
  }

  return { time, open, high, low, close };
}

/** API 응답을 표준 OhlcvCandlestick[] 로 정규화 (시간 오름차순) */
function normalizeOhlcvResponse(data: unknown, isDaily: boolean): OhlcvCandlestick[] {
  const list = Array.isArray(data) ? data : (data as Record<string, unknown>)?.data;
  if (!Array.isArray(list)) return [];
  const out: OhlcvCandlestick[] = [];
  for (const row of list) {
    const item = rowToCandlestick(
      typeof row === "object" && row !== null ? (row as Record<string, unknown>) : {},
      isDaily
    );
    if (item) out.push(item);
  }
  out.sort((a, b) => {
    const ta = a.time;
    const tb = b.time;
    if (typeof ta === "number" && typeof tb === "number") return ta - tb;
    if (typeof ta === "object" && typeof tb === "object" && ta && tb) {
      const dta = (ta.year - 1) * 372 + (ta.month - 1) * 31 + ta.day;
      const dtb = (tb.year - 1) * 372 + (tb.month - 1) * 31 + tb.day;
      return dta - dtb;
    }
    return 0;
  });
  return out;
}

/**
 * OHLCV 데이터 조회. 백엔드가 없으면 빈 배열 반환.
 * @param code 종목코드 6자 (예: "005930")
 * @param tf 타임프레임 (기본 1D)
 * @param count 건수 (기본 200)
 */
export async function getOhlcv(
  code: string,
  tf: string = "1D",
  count: number = 200
): Promise<OhlcvCandlestick[]> {
  const c = String(code).trim().padStart(6, "0");
  try {
    const raw = await apiGet<unknown>(
      `/api/ohlcv?code=${encodeURIComponent(c)}&tf=${encodeURIComponent(tf)}&count=${count}`
    );
    const isDaily = tf === "1D" || tf.toUpperCase() === "D";
    return normalizeOhlcvResponse(raw, isDaily);
  } catch {
    return [];
  }
}
