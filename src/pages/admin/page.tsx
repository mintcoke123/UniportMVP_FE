import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  deleteFestivalAdminSession,
  getFestivalAdminOverview,
  type FestivalAdminOverview,
  type FestivalAdminSessionItem,
} from "../../services/festivalService";

interface AdminPageProps {
  mode?: "sisu";
}

type SessionFilter = "ALL" | "IN_PROGRESS" | "COMPLETED";

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const percentFormatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AdminPage({ mode }: AdminPageProps = {}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<FestivalAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SessionFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FestivalAdminSessionItem | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

  const loadOverview = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await getFestivalAdminOverview();
      setOverview(data);
      setSelectedSessionId((currentId) => {
        if (!data.sessions.length) return null;
        if (currentId && data.sessions.some((session) => session.sessionId === currentId)) {
          return currentId;
        }
        return data.sessions[0].sessionId;
      });
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "축제 운영 데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview(true);
  }, []);

  const handleDeleteCompletedSession = async () => {
    if (!deleteTarget || deleteTarget.status !== "COMPLETED") return;

    setDeletingSessionId(deleteTarget.sessionId);
    setError(null);
    try {
      const data = await deleteFestivalAdminSession(deleteTarget.sessionId);
      setOverview(data);
      setSelectedSessionId((currentId) => {
        if (!data.sessions.length) return null;
        if (currentId === deleteTarget.sessionId) return data.sessions[0].sessionId;
        if (currentId && data.sessions.some((session) => session.sessionId === currentId)) {
          return currentId;
        }
        return data.sessions[0].sessionId;
      });
      setDeleteTarget(null);
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "참가 세션을 삭제하지 못했습니다.";
      setError(message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const sessions = overview?.sessions ?? [];
    return sessions.filter((session) => {
      if (filter !== "ALL" && session.status !== filter) return false;
      if (!keyword) return true;
      return [
        session.displayName,
        session.participantName,
        session.department,
        session.studentId,
        session.phoneNumber,
        session.mainStockName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [filter, overview?.sessions, search]);

  const selectedSession =
    filteredSessions.find((session) => session.sessionId === selectedSessionId) ??
    overview?.sessions.find((session) => session.sessionId === selectedSessionId) ??
    filteredSessions[0] ??
    null;

  const completedSessions = overview?.sessions.filter((session) => session.status === "COMPLETED") ?? [];
  const podium = [...completedSessions]
    .sort((a, b) => (b.returnRate ?? -999) - (a.returnRate ?? -999))
    .slice(0, 3);
  const recentInProgress =
    overview?.sessions.filter((session) => session.status === "IN_PROGRESS").slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f9fc_0%,#eef3ff_100%)] text-slate-900">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-6 py-8">
        <section className="overflow-hidden rounded-[32px] bg-slate-950 px-8 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-sm font-medium tracking-[0.18em] text-slate-200">
                {mode === "sisu" ? "SISU FESTIVAL DESK" : "UNIPORT FESTIVAL DESK"}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  축제 운영용 관리자 대시보드
                </h1>
                <p className="max-w-3xl text-sm text-slate-300 md:text-base">
                  참가자 등록 현황, 실시간 진행 세션, 종료 수익률, 지급 상품까지 이 화면에서 바로 확인할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void loadOverview(false)}
                className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/16"
              >
                {refreshing ? "새로고침 중..." : "새로고침"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                축제 홈으로
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/8"
              >
                로그아웃
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
            <span>관리자: {user?.nickname ?? user?.studentId ?? "admin"}</span>
            <span>마지막 종료 세션: {formatDateTime(overview?.lastCompletedAt)}</span>
            <span>평균 수익률: {formatPercent(overview?.averageReturnRate)}</span>
          </div>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-5 text-rose-700 shadow-sm">
            {error}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="총 참가자"
            value={String(overview?.totalParticipants ?? 0)}
            accent="bg-blue-50 text-blue-700"
          />
          <MetricCard
            label="진행 완료"
            value={String(overview?.completedParticipants ?? 0)}
            accent="bg-emerald-50 text-emerald-700"
          />
          <MetricCard
            label="진행 중"
            value={String(overview?.activeParticipants ?? 0)}
            accent="bg-amber-50 text-amber-700"
          />
          <MetricCard
            label="2% 이상"
            value={String(overview?.qualifiedParticipants ?? 0)}
            accent="bg-fuchsia-50 text-fuchsia-700"
          />
          <MetricCard
            label="최고 수익률"
            value={formatPercent(overview?.bestReturnRate)}
            accent="bg-slate-100 text-slate-800"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">참가 세션 목록</h2>
                <p className="mt-1 text-sm text-slate-500">
                  학생 정보와 종료 스냅샷을 함께 확인하면서 운영하세요.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                  {(["ALL", "IN_PROGRESS", "COMPLETED"] as SessionFilter[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                        filter === item
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {filterLabel(item)}
                    </button>
                  ))}
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="이름, 학번, 전화번호, 종목 검색"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 sm:w-72"
                />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
              <div className="max-h-[640px] overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">상태</th>
                      <th className="px-4 py-3 font-medium">참가자</th>
                      <th className="px-4 py-3 font-medium">학과 / 학번</th>
                      <th className="px-4 py-3 font-medium">연락처</th>
                      <th className="px-4 py-3 font-medium">주요 종목</th>
                      <th className="px-4 py-3 font-medium">종료 평가금</th>
                      <th className="px-4 py-3 font-medium">수익률</th>
                      <th className="px-4 py-3 font-medium">상품</th>
                      <th className="px-4 py-3 font-medium">종료 시각</th>
                      <th className="px-4 py-3 font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <tr key={`skeleton-${index}`}>
                          <td className="px-4 py-4" colSpan={10}>
                            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                          </td>
                        </tr>
                      ))
                    ) : filteredSessions.length ? (
                      filteredSessions.map((session) => (
                        <tr
                          key={session.sessionId}
                          className={`cursor-pointer transition hover:bg-slate-50 ${
                            selectedSession?.sessionId === session.sessionId ? "bg-blue-50/70" : ""
                          }`}
                          onClick={() => setSelectedSessionId(session.sessionId)}
                        >
                          <td className="px-4 py-4">
                            <StatusBadge status={session.status} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-900">{session.displayName}</div>
                            <div className="text-xs text-slate-500">{session.participantName}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            <div>{session.department}</div>
                            <div className="text-xs text-slate-400">{session.studentId}</div>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{session.phoneNumber}</td>
                          <td className="px-4 py-4 text-slate-600">{session.mainStockName ?? "-"}</td>
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {formatCurrency(session.endTotalValue)}
                          </td>
                          <td className={`px-4 py-4 font-semibold ${profitClassName(session.returnRate)}`}>
                            {formatPercent(session.returnRate)}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            {session.finalPrize ?? session.basePrize ?? "-"}
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {formatDateTime(session.endedAt)}
                          </td>
                          <td className="px-4 py-4">
                            {session.status === "COMPLETED" ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDeleteTarget(session);
                                }}
                                disabled={deletingSessionId === session.sessionId}
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingSessionId === session.sessionId ? "삭제 중" : "삭제"}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-16 text-center text-slate-500" colSpan={10}>
                          조건에 맞는 참가 세션이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">오늘의 포디움</h2>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Top 3</span>
              </div>
              <div className="mt-4 space-y-3">
                {podium.length ? (
                  podium.map((session, index) => (
                    <div
                      key={session.sessionId}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {index + 1}위
                          </div>
                          <div className="mt-1 text-lg font-semibold text-slate-900">
                            {session.displayName}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {session.mainStockName ?? "주요 종목 없음"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${profitClassName(session.returnRate)}`}>
                            {formatPercent(session.returnRate)}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {session.finalPrize ?? session.basePrize ?? "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                    아직 종료된 세션이 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">진행 중 세션</h2>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Live Queue
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {recentInProgress.length ? (
                  recentInProgress.map((session) => (
                    <button
                      key={session.sessionId}
                      type="button"
                      onClick={() => setSelectedSessionId(session.sessionId)}
                      className="flex w-full items-center justify-between rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-left transition hover:border-amber-300"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{session.displayName}</div>
                        <div className="mt-1 text-xs text-slate-500">{session.department}</div>
                      </div>
                      <div className="text-xs text-slate-500">{formatDateTime(session.startedAt)}</div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                    현재 진행 중인 참가자가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">상세 정보</h2>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Session Detail</span>
              </div>
              {selectedSession ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {selectedSession.status === "COMPLETED" ? "Completed" : "In Progress"}
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {selectedSession.displayName}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {selectedSession.department} · {selectedSession.studentId}
                        </div>
                      </div>
                      <StatusBadge status={selectedSession.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <InfoChip label="전화번호" value={selectedSession.phoneNumber} />
                      <InfoChip label="주요 종목" value={selectedSession.mainStockName ?? "-"} />
                      <InfoChip label="거래 횟수" value={`${selectedSession.tradeCount}회`} />
                      <InfoChip
                        label="미체결 주문"
                        value={`${selectedSession.unfilledOrderCount}건`}
                      />
                      <InfoChip label="시작 시각" value={formatDateTime(selectedSession.startedAt)} />
                      <InfoChip label="종료 시각" value={formatDateTime(selectedSession.endedAt)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoCard label="시작 자산" value={formatCurrency(selectedSession.startCash)} />
                    <InfoCard label="종료 현금" value={formatCurrency(selectedSession.endCash)} />
                    <InfoCard
                      label="보유 주식 평가금"
                      value={formatCurrency(selectedSession.endPortfolioValue)}
                    />
                    <InfoCard
                      label="종료 총평가금"
                      value={formatCurrency(selectedSession.endTotalValue)}
                      emphasize
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">상품 및 수익률</div>
                        <div className="mt-1 text-xs text-slate-500">
                          종료 스냅샷 기준 결과입니다.
                        </div>
                      </div>
                      <div className={`text-2xl font-semibold ${profitClassName(selectedSession.returnRate)}`}>
                        {formatPercent(selectedSession.returnRate)}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <InfoChip label="기본 상품" value={selectedSession.basePrize ?? "-"} />
                      <InfoChip label="최종 상품" value={selectedSession.finalPrize ?? "-"} />
                    </div>
                  </div>

                  <SnapshotPanel
                    title="종료 보유 스냅샷"
                    emptyText="저장된 보유 스냅샷이 없습니다."
                    data={selectedSession.holdingsSnapshot}
                  />
                  <SnapshotPanel
                    title="거래 내역"
                    emptyText="저장된 거래 내역이 없습니다."
                    data={selectedSession.tradeHistory}
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-200 px-4 py-16 text-center text-sm text-slate-500">
                  조회할 참가 세션을 선택해주세요.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center px-4 py-6">
          <div className="fixed inset-0 bg-slate-950/55" aria-hidden />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <h2 className="text-xl font-semibold text-slate-950">종료 세션 삭제</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {deleteTarget.displayName} 참가자의 종료 데이터를 삭제할까요? 삭제한 데이터는 리더보드와
              참가 세션 목록에서 사라집니다.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingSessionId !== null}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCompletedSession()}
                disabled={deletingSessionId !== null}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {deletingSessionId !== null ? "삭제 중" : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "IN_PROGRESS" | "COMPLETED" }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        status === "COMPLETED"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {status === "COMPLETED" ? "종료" : "진행 중"}
    </span>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        emphasize
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SnapshotPanel({
  title,
  emptyText,
  data,
}: {
  title: string;
  emptyText: string;
  data: unknown;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {data ? (
        <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </div>
  );
}

function filterLabel(filter: SessionFilter) {
  if (filter === "IN_PROGRESS") return "진행 중";
  if (filter === "COMPLETED") return "종료";
  return "전체";
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-";
  return `${currencyFormatter.format(Math.round(value))}원`;
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${percentFormatter.format(value)}%`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = parseKoreaDateTime(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseKoreaDateTime(value: string) {
  if (/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return new Date(value);
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/
  );
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] = match;
  const millisecond = Number(fraction.padEnd(3, "0").slice(0, 3));
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 9,
      Number(minute),
      Number(second),
      millisecond
    )
  );
}

function profitClassName(value: number | null | undefined) {
  if (value == null) return "text-slate-500";
  if (value > 0) return "text-rose-600";
  if (value < 0) return "text-blue-600";
  return "text-slate-700";
}
