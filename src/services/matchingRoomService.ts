/**
 * 매칭방 API. GET/POST /api/matching-rooms, join/leave/start
 * @see docs/API_SPEC.md §9
 */

import type { MatchingRoom } from "../types";
import { apiGet, apiPost, type ApiError } from "./apiClient";

/** 참가 시 필요한 사용자 정보 */
export interface JoinMatchingRoomUser {
  id: string;
  nickname: string;
}

/** 참가 API 응답. 백엔드가 갱신된 방(멤버 목록 포함)을 주면 목록 갱신에 사용 */
export interface JoinMatchingRoomResponse {
  success: boolean;
  message: string;
  room?: MatchingRoom;
}

/**
 * 전체 매칭방 목록. 인증 시 각 방에 isJoined 포함.
 */
export async function getMatchingRooms(): Promise<MatchingRoom[]> {
  return await apiGet<MatchingRoom[]>("/api/matching-rooms");
}

/** 내가 참가 중인 매칭방 목록. GET /api/me/matching-rooms (인증 필요) */
export async function getMyMatchingRooms(): Promise<MatchingRoom[]> {
  return await apiGet<MatchingRoom[]>("/api/me/matching-rooms");
}

export async function joinMatchingRoom(
  roomId: string,
  user: JoinMatchingRoomUser
): Promise<JoinMatchingRoomResponse> {
  return await apiPost<JoinMatchingRoomResponse>(
    `/api/matching-rooms/${roomId}/join`
  );
}

export async function leaveMatchingRoom(
  roomId: string
): Promise<{ success: boolean; message: string }> {
  return await apiPost<{ success: boolean; message: string }>(
    `/api/matching-rooms/${roomId}/leave`
  );
}

export async function createMatchingRoom(
  name?: string,
  visibility?: "PUBLIC" | "PRIVATE",
  capacity?: number
): Promise<{ success: boolean; message: string; room?: MatchingRoom }> {
  try {
    const body: { name?: string; visibility?: string; capacity?: number } = {};
    if (name != null) body.name = name;
    if (visibility != null) body.visibility = visibility;
    if (capacity != null && capacity >= 1) body.capacity = capacity;
    return await apiPost<{
      success: boolean;
      message: string;
      room?: MatchingRoom;
    }>("/api/matching-rooms", Object.keys(body).length > 0 ? body : undefined);
  } catch (e) {
    const err = e as ApiError;
    if (err.status != null && err.message) {
      return { success: false, message: err.message };
    }
    throw e;
  }
}

/** 초대코드로 입장. POST /api/matching-rooms/join-by-code */
export async function joinRoomByCode(
  inviteCode: string
): Promise<JoinMatchingRoomResponse> {
  return await apiPost<JoinMatchingRoomResponse>(
    "/api/matching-rooms/join-by-code",
    { inviteCode: inviteCode.trim() }
  );
}

export async function startMatchingRoom(roomId: string): Promise<{
  success: boolean;
  message: string;
  teamId?: string;
  groupId?: number;
  competitionId?: number;
}> {
  return await apiPost<{
    success: boolean;
    message: string;
    teamId?: string;
    groupId?: number;
    competitionId?: number;
  }>(`/api/matching-rooms/${roomId}/start`);
}
