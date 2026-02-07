import { useState, useEffect, useRef } from "react";

interface StockChartProps {
  stockName: string;
  /** 백엔드 종목코드 (예: "005930"). TradingView에는 KRX:코드 형식으로 전달 */
  stockCode?: string;
}

type ChartPeriod = "1D" | "1W" | "3M" | "6M" | "1Y";

const StockChart = ({ stockName, stockCode = "005930" }: StockChartProps) => {
  const tvSymbol = `KRX:${stockCode}`;
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("1D");
  const containerRef = useRef<HTMLDivElement>(null);

  const periods: ChartPeriod[] = ["1D", "1W", "3M", "6M", "1Y"];

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval:
            selectedPeriod === "1D"
              ? "5"
              : selectedPeriod === "1W"
              ? "60"
              : "D",
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
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [selectedPeriod]);

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">차트</h3>

      {/* Period Tabs */}
      <div className="flex gap-2 mb-4">
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedPeriod === period
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* TradingView Chart */}
      <div
        ref={containerRef}
        className="w-full h-80 rounded-lg overflow-hidden border border-gray-200"
      >
        <div id="tradingview_chart" className="w-full h-full"></div>
      </div>
    </div>
  );
};

export default StockChart;
