import { useEffect, useRef } from "react";

interface StockChartProps {
  stockName: string;
  /** 백엔드 종목코드 (예: "005930"). TradingView에는 KRX:코드 형식으로 전달 */
  stockCode?: string;
}

const StockChart = ({ stockName, stockCode = "005930" }: StockChartProps) => {
  const code6 = String(stockCode ?? "005930").trim().padStart(6, "0");
  const tvSymbol = `KRX:${code6}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chartEl = document.getElementById("tradingview_chart");
    if (chartEl) chartEl.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
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
          container_id: "tradingview_chart",
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          studies: [],
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("tradingview_chart");
      if (el) el.innerHTML = "";
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [tvSymbol]);

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">차트</h3>

      {/* TradingView Chart */}
      <div
        key={tvSymbol}
        ref={containerRef}
        className="w-full h-80 rounded-lg overflow-hidden border border-gray-200"
      >
        <div id="tradingview_chart" className="w-full h-full"></div>
      </div>
    </div>
  );
};

export default StockChart;
