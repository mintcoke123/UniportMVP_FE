import { useMemo } from "react";

interface StockChartProps {
  stockName: string;
  /** 백엔드 종목코드 (예: "005930"). TradingView에는 KRX:코드 형식으로 전달 */
  stockCode?: string;
}

/**
 * iframe으로 /tv-chart.html?symbol=KRX:xxx 로드.
 * 종목마다 완전히 별도 문서에서 차트만 그리므로 tv.js 캐시/재사용 문제 없음.
 */
const StockChart = ({ stockCode = "005930" }: StockChartProps) => {
  const code6 = useMemo(
    () =>
      String(stockCode ?? "005930")
        .trim()
        .padStart(6, "0"),
    [stockCode],
  );
  const tvSymbol = `KRX:${code6}`;
  const iframeSrc = `/tv-chart.html?symbol=${encodeURIComponent(tvSymbol)}&_=${encodeURIComponent(code6)}`;

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">차트</h3>

      <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
        <iframe
          key={tvSymbol}
          src={iframeSrc}
          title={`차트 ${tvSymbol}`}
          className="w-full h-full border-0 block"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default StockChart;
