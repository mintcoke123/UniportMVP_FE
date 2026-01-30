import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketIndices, stocksByVolume, stocksByRising, stocksByFalling } from '../../mocks/stockMarketData';

type TabType = 'volume' | 'rising' | 'falling';

export default function MockInvestmentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('volume');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const getStockList = () => {
    let stocks;
    switch (activeTab) {
      case 'volume':
        stocks = stocksByVolume;
        break;
      case 'rising':
        stocks = stocksByRising;
        break;
      case 'falling':
        stocks = stocksByFalling;
        break;
      default:
        stocks = stocksByVolume;
    }

    if (searchQuery.trim()) {
      return stocks.filter(stock => 
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.code.includes(searchQuery)
      );
    }
    return stocks;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const formatChange = (change: number, rate: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatNumber(change)} (${sign}${rate.toFixed(2)}%)`;
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleStockClick = (stockId: number) => {
    navigate(`/stock-detail?id=${stockId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-2xl text-gray-900"></i>
          </button>
          <h1 className="text-lg font-bold text-gray-900">모의투자</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* 검색 오버레이 */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="max-w-md mx-auto">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-200">
              <button 
                onClick={handleCloseSearch}
                className="w-10 h-10 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-arrow-left-line text-2xl text-gray-900"></i>
              </button>
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="종목명 또는 종목코드 검색"
                  className="w-full py-2.5 px-4 pr-10 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-teal-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer"
                  >
                    <i className="ri-close-circle-fill text-gray-400"></i>
                  </button>
                )}
              </div>
            </div>

            {/* 검색 결과 */}
            <div className="px-5 py-3">
              <p className="text-xs text-gray-500 mb-3">
                {searchQuery ? `"${searchQuery}" 검색 결과` : '전체 종목'}
              </p>
              <div className="divide-y divide-gray-100">
                {getStockList().length > 0 ? (
                  getStockList().map((stock) => (
                    <div 
                      key={stock.id} 
                      onClick={() => handleStockClick(stock.id)}
                      className="py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                          style={{ backgroundColor: stock.logoColor }}
                        >
                          {stock.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{stock.name}</p>
                          <p className="text-xs text-gray-500">{stock.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900 mb-1">
                            {formatNumber(stock.currentPrice)}원
                          </p>
                          <p className={`text-xs font-semibold ${stock.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {formatChange(stock.change, stock.changeRate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <i className="ri-search-line text-4xl text-gray-300 mb-3"></i>
                    <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto">
        {/* 시장 지수 */}
        <div className="bg-white px-5 py-4 mb-2">
          <div className="grid grid-cols-3 gap-4">
            {marketIndices.map((index) => (
              <div key={index.id} className="text-center">
                <p className="text-xs text-gray-600 mb-1">{index.name}</p>
                <p className="text-base font-bold text-gray-900 mb-1">
                  {formatNumber(index.value)}
                </p>
                <p className={`text-xs font-semibold ${index.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {index.change >= 0 ? '+' : ''}{formatNumber(index.change)} ({index.change >= 0 ? '+' : ''}{index.changeRate}%)
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white px-5 py-3 mb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('volume')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'volume'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              거래량
            </button>
            <button
              onClick={() => setActiveTab('rising')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rising'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              급상승
            </button>
            <button
              onClick={() => setActiveTab('falling')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'falling'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              급하락
            </button>
          </div>
        </div>

        {/* 특징 종목 리스트 */}
        <div className="bg-white">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">
              {activeTab === 'volume' && '거래량 상위'}
              {activeTab === 'rising' && '급상승 종목'}
              {activeTab === 'falling' && '급하락 종목'}
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {getStockList().map((stock, index) => (
              <div 
                key={stock.id} 
                onClick={() => handleStockClick(stock.id)}
                className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-500 w-5">{index + 1}</span>
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: stock.logoColor }}
                  >
                    {stock.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{stock.name}</p>
                    <p className="text-xs text-gray-500">{stock.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900 mb-1">
                      {formatNumber(stock.currentPrice)}원
                    </p>
                    <p className={`text-xs font-semibold ${stock.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {formatChange(stock.change, stock.changeRate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 플로팅 검색 버튼 */}
      <button
        onClick={handleSearchClick}
        className="fixed bottom-24 right-5 w-14 h-14 bg-teal-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-teal-600 transition-all z-20"
      >
        <i className="ri-search-line text-2xl text-white"></i>
      </button>
    </div>
  );
}