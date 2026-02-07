/**
 * 관리자 전용 API. GET/POST/PATCH /api/admin/competitions, teams, matching-rooms, users
 * @see docs/API_SPEC.md §10
 */

import type { AdminCompetition } from "../types";
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";
import type { CompetingTeamItem } from "../types";
import type { MatchingRoom } from "../types";

/** 대회 목록 (관리자용: 시작일·종료일 포함) */
export async function getAdminCompetitions(): Promise<AdminCompetition[]> {
  return await apiGet<AdminCompetition[]>("/api/admin/competitions");
}

/** 대회 생성 */
export async function createAdminCompetition(body: {
  name: string;
  startDate: string;
  endDate: string;
}): Promise<{
  success: boolean;
  message: string;
  competition?: AdminCompetition;
}> {
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (end.getTime() <= start.getTime()) {
    return {
      success: false,
      message: "종료일은 시작일보다 이후여야 합니다.",
    };
  }
  return await apiPost<{
    success: boolean;
    message: string;
    competition?: AdminCompetition;
  }>("/api/admin/competitions", body);
}

/** 대회 수정 */
export async function updateAdminCompetition(
  id: number,
  body: { name?: string; startDate?: string; endDate?: string }
): Promise<{ success: boolean; message: string }> {
  return await apiPatch<{ success: boolean; message: string }>(
    `/api/admin/competitions/${id}`,
    body
  );
}

/** 대회별 팀 목록 */
export async function getAdminTeamsByCompetition(
  competitionId: number
): Promise<CompetingTeamItem[]> {
  return await apiGet<CompetingTeamItem[]>(
    `/api/admin/competitions/${competitionId}/teams`
  );
}

/** 매칭방(팀 대기/구성) 목록 (관리자용) */
export async function getAdminMatchingRooms(): Promise<MatchingRoom[]> {
  return await apiGet<MatchingRoom[]>("/api/admin/matching-rooms");
}

/** 팀(매칭방) 삭제. DELETE /api/admin/matching-rooms/{roomId} — roomId: room-1 또는 1 */
export async function deleteAdminMatchingRoom(
  roomId: string
): Promise<{ success: boolean; message: string }> {
  return await apiDelete<{ success: boolean; message: string }>(
    `/api/admin/matching-rooms/${encodeURIComponent(roomId)}`
  );
}

/** 멤버 강제 제거. DELETE /api/admin/matching-rooms/{roomId}/members/{userId} */
export async function deleteAdminMatchingRoomMember(
  roomId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  return await apiDelete<{ success: boolean; message: string }>(
    `/api/admin/matching-rooms/${encodeURIComponent(
      roomId
    )}/members/${encodeURIComponent(userId)}`
  );
}

/** 유저 목록 (관리자용) */
export async function getAdminUsers(): Promise<
  {
    id: string;
    email: string;
    nickname: string;
    teamId: string | null;
    role: string;
  }[]
> {
  return await apiGet<
    {
      id: string;
      email: string;
      nickname: string;
      teamId: string | null;
      role: string;
    }[]
  >("/api/admin/users");
}

/** 유저 삭제 (관리자 전용). 본인·다른 관리자 계정은 삭제 불가. */
export async function deleteAdminUser(
  userId: string
): Promise<{ success: boolean; message: string }> {
  return await apiDelete<{ success: boolean; message: string }>(
    `/api/admin/users/${encodeURIComponent(userId)}`
  );
}
