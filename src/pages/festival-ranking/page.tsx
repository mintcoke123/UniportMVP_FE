import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFestivalLeaderboard,
  type FestivalLeaderboardItem,
} from "../../services/festivalService";

export default function FestivalRankingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FestivalLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFestivalLeaderboard()
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err: { message?: string }) => {
        setError(err?.message ?? "리더보드를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-bold tracking-[0.18em] text-orange-200">
                FESTIVAL LEADERBOARD
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight">축제 리더보드</h1>
              <p className="mt-2 text-sm text-slate-300">
                종료 시점 기준으로 고정된 결과만 표시합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              참가 등록으로
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              아직 종료된 참가 세션이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.sessionId}
                  className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-[80px_1.3fr_1fr_1fr_1fr] md:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black ${rankClassName(
                        item.rank,
                      )}`}
                    >
                      {item.rank}
                    </div>
                    <div className="md:hidden">
                      <div className="text-base font-bold text-slate-950">{item.displayName}</div>
                      <div className="text-xs text-slate-500">
                        {item.mainStockName ?? "대표 종목 없음"}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div className="text-base font-bold text-slate-950">{item.displayName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.mainStockName ?? "대표 종목 없음"}
                    </div>
                  </div>

                  <Metric label="최종 평가금" value={formatCurrency(item.endTotalValue)} />
                  <Metric
                    label="수익률"
                    value={formatPercent(item.returnRate)}
                    accent={profitClassName(item.returnRate)}
                  />
                  <Metric label="종료 시각" value={formatDateTime(item.endedAt)} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "text-slate-900",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${accent}`}>{value}</div>
    </div>
  );
}

function rankClassName(rank: number) {
  if (rank === 1) return "bg-amber-100 text-amber-700";
  if (rank === 2) return "bg-slate-200 text-slate-700";
  if (rank === 3) return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

function profitClassName(value: number) {
  if (value > 0) return "text-rose-600";
  if (value < 0) return "text-blue-600";
  return "text-slate-900";
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
