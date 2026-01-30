import { useNavigate } from 'react-router-dom';
import { groupPortfolioData } from '../../mocks/groupPortfolioData';

interface TradeRecord {
  id: number;
  type: '매수' | '매도';
  stockName: string;
  quantity: number;
  price: number;
  date: string;
  profitLoss: number;
  profitLossPercentage: number;
  analysis?: string; // OpenAI API로부터 받을 총평
}

export default function FeedbackReportPage() {
  const navigate = useNavigate();

  // 최종 투자 결과
  const finalInvestment = groupPortfolioData.investmentAmount;
  const finalValue = groupPortfolioData.totalValue;
  const finalProfitLoss = groupPortfolioData.profitLoss;
  const finalProfitLossPercentage = groupPortfolioData.profitLossPercentage;
  const isProfit = finalProfitLoss >= 0;

  // 베스트 거래 (가장 많이 벌었던 거래)
  const bestTrade: TradeRecord = {
    id: 1,
    type: '매수',
    stockName: 'SK하이닉스',
    quantity: 30,
    price: 120000,
    date: '2024.01.15',
    profitLoss: 240000,
    profitLossPercentage: 6.67,
    analysis: 'SK하이닉스에서는 장중 발표된 실적 호조 뉴스에 빠르게 대응하여 좋은 수익을 거두었습니다. 팀원들의 신속한 의사결정이 빛을 발한 거래였습니다.'
  };

  // 워스트 거래 (가장 많이 잃었던 거래)
  const worstTrade: TradeRecord = {
    id: 2,
    type: '매수',
    stockName: 'NAVER',
    quantity: 15,
    price: 190000,
    date: '2024.01.20',
    profitLoss: -75000,
    profitLossPercentage: -2.63,
    analysis: 'NAVER에서는 변동성 급증 시점에 손절 타이밍을 놓쳐 손실이 발생했습니다. 시장 상황 변화에 대한 더 빠른 대응이 필요했던 거래입니다.'
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('ko-KR')}원`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">피드백 리포트</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        {/* 최종 수익률 카드 */}
        <div className={`rounded-2xl p-6 ${isProfit ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-trophy-line text-2xl"></i>
            <h2 className="text-lg font-bold">최종 투자 결과</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">최종 투자금</span>
              <span className="text-2xl font-bold">{formatCurrency(finalInvestment)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm opacity-90">최종 평가액</span>
              <span className="text-2xl font-bold">{formatCurrency(finalValue)}</span>
            </div>
            <div className="border-t border-white/30 pt-3 flex justify-between items-center">
              <span className="text-sm opacity-90">최종 수익률</span>
              <div className="text-right">
                <span className="text-3xl font-bold">
                  {isProfit ? '+' : ''}{formatCurrency(finalProfitLoss)}
                </span>
                <span className="text-lg ml-2 font-semibold">
                  {formatPercentage(finalProfitLossPercentage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 베스트 거래 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-arrow-up-line text-xl text-green-600"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">가장 많이 벌었던 거래</h3>
              <span className="text-xs text-gray-500">Best Trade</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {bestTrade.type}
                </div>
                <span className="text-base font-bold text-gray-900">{bestTrade.stockName}</span>
              </div>
              <span className="text-xs text-gray-500">{bestTrade.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500">수량</span>
                <p className="text-sm font-semibold text-gray-900">{bestTrade.quantity}주</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">체결가</span>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(bestTrade.price)}</p>
              </div>
            </div>
            <div className="border-t border-green-200 pt-3 mb-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">수익</span>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">
                  +{formatCurrency(bestTrade.profitLoss)}
                </span>
                <span className="text-sm ml-2 text-green-600">
                  {formatPercentage(bestTrade.profitLossPercentage)}
                </span>
              </div>
            </div>
            {/* AI 총평 */}
            {bestTrade.analysis && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-2">
                  <i className="ri-lightbulb-line text-green-600 text-lg mt-0.5"></i>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">AI 분석</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{bestTrade.analysis}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 워스트 거래 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <i className="ri-arrow-down-line text-xl text-red-600"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">가장 많이 잃었던 거래</h3>
              <span className="text-xs text-gray-500">Worst Trade</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {worstTrade.type}
                </div>
                <span className="text-base font-bold text-gray-900">{worstTrade.stockName}</span>
              </div>
              <span className="text-xs text-gray-500">{worstTrade.date}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500">수량</span>
                <p className="text-sm font-semibold text-gray-900">{worstTrade.quantity}주</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">체결가</span>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(worstTrade.price)}</p>
              </div>
            </div>
            <div className="border-t border-red-200 pt-3 mb-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">손실</span>
              <div className="text-right">
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(worstTrade.profitLoss)}
                </span>
                <span className="text-sm ml-2 text-red-600">
                  {formatPercentage(worstTrade.profitLossPercentage)}
                </span>
              </div>
            </div>
            {/* AI 총평 */}
            {worstTrade.analysis && (
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-start gap-2">
                  <i className="ri-lightbulb-line text-red-600 text-lg mt-0.5"></i>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 mb-1">AI 분석</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{worstTrade.analysis}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => navigate('/chat')}
            className="flex-1 py-4 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 cursor-pointer whitespace-nowrap transition-colors"
          >
            채팅방으로 돌아가기
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-4 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 cursor-pointer whitespace-nowrap transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
