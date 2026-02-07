/**
 * 현재 로그인 사용자 프로필 (GET /api/me).
 * teamId 등 DB 최신값을 가져와 헤더/모의투자 활성화 등에 사용.
 */
import { apiGet } from "./apiClient";

export interface MeResponse {
  id?: string | null;
  email?: string | null;
  nickname?: string | null;
  totalAssets?: number;
  investmentAmount?: number;
  profitLoss?: number;
  profitLossRate?: number;
  teamId?: string | null;
  role?: string;
}

export async function getMe(): Promise<MeResponse | null> {
  const data = await apiGet<MeResponse>("/api/me");
  if (data && data.id) return data;
  return null;
}
