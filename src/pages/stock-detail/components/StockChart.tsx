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

      new window.TradingView.widget({
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
    })();

    return () => {
      cancelled = true;
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
