/**
 * 한국 거래 시간: 09:00 ~ 15:30 (KST). 15:30 이후 거래 불가.
 */
export const TRADING_HOURS_MESSAGE =
  "15시 30분 이후로는 거래를 할 수 없습니다.";

const KST_OFFSET_MINUTES = 9 * 60; // UTC+9
const OPEN_MINUTES = 9 * 60; // 09:00
const CLOSE_MINUTES = 15 * 60 + 30; // 15:30

/** 현재 시각을 한국 시간 기준 0시 0분부터의 분 단위로 반환 (0 ~ 1439) */
function getKoreaMinutesOfDay(now: Date = new Date()): number {
  const utcMinutes =
    now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const koreaMinutes = utcMinutes + KST_OFFSET_MINUTES;
  return ((koreaMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
}

/** 거래 가능 시간이면 true. 09:00 <= now < 15:30 (KST) */
export function isWithinTradingHours(now?: Date): boolean {
  const min = getKoreaMinutesOfDay(now ?? new Date());
  return min >= OPEN_MINUTES && min < CLOSE_MINUTES;
}
