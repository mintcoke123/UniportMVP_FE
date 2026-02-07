/**
 * 백엔드 대회 종료일 파싱.
 * - "YYYY-MM-DD"만 오면 UTC 자정이 되어 당일 오전에 만료되므로, 해당일 23:59:59.999(로컬)로 해석.
 * - "YYYY-MM-DDTHH:mm:ss..." 형식이면 그대로 사용.
 */
export function parseCompetitionEndDate(endDate: string | null | undefined): Date {
  if (!endDate || typeof endDate !== "string") return new Date(0);
  const s = endDate.trim();
  if (!s) return new Date(0);
  if (s.includes("T")) return new Date(s);
  return new Date(s + "T23:59:59.999");
}
