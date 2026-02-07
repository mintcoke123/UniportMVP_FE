/**
 * 대회 목록. GET /api/competitions/ongoing, /api/competitions/upcoming
 * @see docs/API_SPEC.md §4
 */
import { apiGet } from "./apiClient";
import { parseCompetitionEndDate } from "../utils/date";

export interface CompetitionOngoingItem {
  id: number;
  name: string;
  endDate: Date;
}

export interface CompetitionUpcomingItem {
  id: number;
  name: string;
  startDate: Date;
}

interface ApiOngoingItem {
  id: number;
  name: string;
  endDate: string;
}

interface ApiUpcomingItem {
  id: number;
  name: string;
  startDate: string;
}

export async function getOngoingCompetitions(): Promise<
  CompetitionOngoingItem[]
> {
  const list = await apiGet<ApiOngoingItem[]>("/api/competitions/ongoing");
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    endDate: parseCompetitionEndDate(t.endDate),
  }));
}

export async function getUpcomingCompetitions(): Promise<
  CompetitionUpcomingItem[]
> {
  const list = await apiGet<ApiUpcomingItem[]>("/api/competitions/upcoming");
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    startDate: new Date(t.startDate),
  }));
}
