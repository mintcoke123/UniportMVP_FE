import { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import { getOhlcv, type OhlcvCandlestick } from "../../../services/ohlcvService";

interface StockCandleChartProps {
  stockCode: string;
  height?: number;
}

const DEFAULT_HEIGHT = 320;

export default function StockCandleChart({ stockCode, height = DEFAULT_HEIGHT }: StockCandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const code6 = String(stockCode ?? "").trim().padStart(6, "0");

  const renderChart = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      height,
      layout: { background: { type: ColorType.Solid, color: "#fff" }, textColor: "#333" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      rightPriceScale: { borderColor: "#ccc" },
      timeScale: { borderColor: "#ccc", timeVisible: true, secondsVisible: false },
    });
    const series = chart.addSeries(CandlestickSeries, {});
    chartRef.current = chart;
    seriesRef.current = series;
  }, [height]);

  useEffect(() => {
    renderChart();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      chartRef.current?.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [renderChart]);

  useEffect(() => {
    if (!code6 || !seriesRef.current) return;

    getOhlcv(code6, "1D", 200).then((data: OhlcvCandlestick[]) => {
      if (import.meta.env.DEV) {
        console.log("fetch ohlcv", code6, data.length);
      }
      const series = seriesRef.current;
      if (!series) return;
      if (data.length === 0) return;
      series.setData(data as CandlestickData<Time>[]);
      chartRef.current?.timeScale().fitContent();
    });
  }, [code6]);

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">차트</h3>
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
