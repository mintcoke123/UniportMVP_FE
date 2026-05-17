import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, UserRound } from "lucide-react";
import {
  startFestivalSession,
  type FestivalParticipantInput,
} from "../../services/festivalService";

const initialFormState: FestivalParticipantInput = {
  name: "",
  phoneNumber: "",
  privacyAgreed: false,
};

export default function FestivalPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FestivalParticipantInput>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.removeItem("festivalSession");
  }, []);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const session = await startFestivalSession(form);
      sessionStorage.setItem(
        "festivalSession",
        JSON.stringify({
          sessionId: session.sessionId,
          displayName: session.displayName,
          startCash: session.startCash,
          startedAt: session.startedAt,
          participant: form,
        }),
      );
      navigate("/festival-stock", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(247,148,29,0.08),_transparent_30%),linear-gradient(180deg,_#fffdf8_0%,_#f5f7fb_100%)] px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.45),_transparent_55%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-orange-200">
                <Trophy className="h-4 w-4" />
                Festival Booth Mode
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight">
                UNIPORT
                <br />
                축제 모의투자 이벤트
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                이름과 전화번호를 입력하면 바로 2분 모의투자가 시작됩니다. 시작 버튼을 누르면
                기존 모의투자 종목 화면으로 이동하고, 그 화면을 축제용 기본 투자 화면으로 사용합니다.
              </p>
              <div className="mt-8 grid gap-3 md:grid-cols-2">
                <HighlightCard label="시작 자산" value="₩100,000,000" />
                <HighlightCard label="투자 시간" value="02:00" />
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
                <UserRound className="h-4 w-4" />
                Participant Check-In
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                참가 정보를 입력해주세요
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                개인정보 동의 후 시작하기를 누르면 바로 투자 화면으로 이동합니다. 전화번호는
                중복 등록할 수 없으며, 등록 후 투자 화면에서 2분 타이머를 시작할 수 있습니다.
              </p>
            </div>

            <div className="grid gap-4">
              <InputField
                label="이름"
                value={form.name}
                onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="이름을 입력해주세요"
              />
              <InputField
                label="전화번호"
                value={form.phoneNumber}
                onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
                placeholder="010-1234-5678"
              />
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.privacyAgreed}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    privacyAgreed: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="leading-6">
                개인정보 수집 및 이용에 동의합니다. 입력한 정보는 참가 확인과 운영 연락 용도로만
                사용합니다.
              </span>
            </label>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!isReady(form) || submitting}
              onClick={() => void handleStart()}
              className="mt-6 inline-flex w-full items-center justify-center rounded-[28px] bg-slate-950 px-6 py-5 text-lg font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "참가 세션 생성 중..." : "시작하기"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
      <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300">{label}</div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

function isReady(form: FestivalParticipantInput) {
  return form.name.trim() !== "" && form.phoneNumber.trim() !== "" && form.privacyAgreed;
}

function extractErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "참가 세션을 시작하지 못했습니다.";
}
