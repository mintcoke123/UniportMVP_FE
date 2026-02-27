import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../services";

export interface StockSearchItem {
  id: number;
  code: string;
  name: string;
  market: string;
}

const DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 20;

export default function StockSearchSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<StockSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const trimmed = q.trim();
    if (trimmed.length < 1) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      query: trimmed,
      limit: String(SEARCH_LIMIT),
    });
    apiGet<unknown>(`/api/stocks/search?${params.toString()}`, {
      signal: ac.signal,
    })
      .then((data) => {
        if (!Array.isArray(data)) {
          setError("검색 중 오류가 발생했습니다.");
          setItems([]);
          return;
        }
        setItems(data as StockSearchItem[]);
      })
      .catch((err: { name?: string; message?: string }) => {
        if (err?.name === "AbortError") return;
        setError("검색 중 오류가 발생했습니다.");
        setItems([]);
      })
      .finally(() => {
        if (abortRef.current === ac) abortRef.current = null;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      doSearch(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [query, doSearch]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showDropdown = query.trim().length >= 1;
  const handleItemClick = (item: StockSearchItem) => {
    navigate(`/stock-detail?id=${item.id}`);
  };

  return (
    <section className="mb-6 relative">
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목명 검색 (API)"
          className="w-full max-w-md py-2.5 pl-10 pr-4 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500 border border-gray-200"
          aria-label="종목 검색"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <i className="ri-loader-4-line animate-spin text-lg" />
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 max-w-md mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {!error && items.length === 0 && !loading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
          {!error && items.length > 0 && (
            <ul className="max-h-60 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={`${item.code}-${item.id}`}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-gray-900">
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.code} · {item.market}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
