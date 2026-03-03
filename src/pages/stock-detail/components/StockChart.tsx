import { useEffect, useMemo, useRef, useId } from "react";

interface StockChartProps {
  stockName: string;
  /** 백엔드 종목코드 (예: "005930"). TradingView에는 KRX:코드 형식으로 전달 */
  stockCode?: string;
}

declare global {
  interface Window {
    TradingView?: any;
  }
}

const TV_SCRIPT_SRC = "https://s3.tradingview.com/tv.js";

/**
 * 종목 변경 시 차트가 안 바뀌는 이유 (리서치 요약):
 * 1. 같은 container_id 재사용 시 tv.js가 이전 위젯 인스턴스를 캐시/재활용해 새 symbol이 반영되지 않음.
 * 2. innerHTML만 비우고 새 위젯을 만들면, 이전 인스턴스가 remove()되지 않아 메모리/전역 상태에 남고 새 위젯과 충돌할 수 있음.
 * 대응: container_id에 code6 포함(심볼별 유일 id), 위젯 생성 시 반환값을 ref에 저장하고 cleanup에서 remove() 호출.
 */

function loadTvScriptOnce() {
  return new Promise<void>((resolve, reject) => {
    if (window.TradingView) return resolve();

    const existing = document.querySelector(`script[src="${TV_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("tv.js load failed")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TV_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("tv.js load failed"));
    document.head.appendChild(script);
  });
}

const StockChart = ({ stockName, stockCode = "005930" }: StockChartProps) => {
  const code6 = useMemo(
    () =>
      String(stockCode ?? "005930")
        .trim()
        .padStart(6, "0"),
    [stockCode],
  );
  const tvSymbol = `KRX:${code6}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ remove?: () => void } | null>(null);
  const uid = useId().replaceAll(":", "_");
  /** symbol마다 다른 id → tv.js가 같은 container_id 재사용으로 이전 차트를 캐시하지 않도록 */
  const containerId = `tradingview_chart_${uid}_${code6}`;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadTvScriptOnce();
      if (cancelled || !window.TradingView) return;

      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;

      const el = document.getElementById(containerId);
      if (!el) return;

      el.innerHTML = "";

      const widget = new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "D",
        timezone: "Asia/Seoul",
        theme: "light",
        style: "1",
        locale: "kr",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        container_id: containerId,
        hide_top_toolbar: false,
        hide_legend: true,
        save_image: false,
        studies: [],
      });
      if (!cancelled) widgetRef.current = widget ?? null;
    })();

    return () => {
      cancelled = true;
      try {
        if (widgetRef.current && typeof widgetRef.current.remove === "function") {
          widgetRef.current.remove();
        }
      } catch {
        /* ignore */
      }
      widgetRef.current = null;
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
    };
  }, [tvSymbol, containerId]);

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">차트</h3>

      <div
        key={tvSymbol}
        ref={containerRef}
        className="w-full h-80 rounded-lg overflow-hidden border border-gray-200"
      >
        <div id={containerId} className="w-full h-full" />
      </div>
    </div>
  );
};

export default StockChart;
