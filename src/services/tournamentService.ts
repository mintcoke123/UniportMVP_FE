/**
 * 토너먼트 목록 (API 연동 시 이 파일만 교체)
 * @see docs/API_SPEC.md §4
 */
import {
  ongoingTournaments,
  upcomingTournaments,
} from '../mocks/tournamentData';

export interface TournamentOngoingItem {
  id: number;
  name: string;
  endDate: Date;
}

export interface TournamentUpcomingItem {
  id: number;
  name: string;
  startDate: Date;
}

export async function getOngoingTournaments(): Promise<
  TournamentOngoingItem[]
> {
  // TODO: GET /api/tournaments/ongoing → map endDate string to new Date(...)
  return Promise.resolve(
    ongoingTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      endDate: t.endDate,
    }))
  );
}

export async function getUpcomingTournaments(): Promise<
  TournamentUpcomingItem[]
> {
  // TODO: GET /api/tournaments/upcoming → map startDate string to new Date(...)
  return Promise.resolve(
    upcomingTournaments.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
    }))
  );
}
