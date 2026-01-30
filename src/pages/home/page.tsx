import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { useAuth } from '../../contexts/AuthContext';
import { getMyInvestment } from '../../services';
import type { InvestmentData, StockHolding, TournamentSummary } from '../../types';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [data, setData] = useState<InvestmentData | null>(null);
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [tournamentData, setTournamentData] = useState<TournamentSummary | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!isLoggedIn) {
      setData(null);
      setStocks([]);
      setTournamentData(null);
      return;
    }
    getMyInvestment().then((res) => {
      setData(res.investmentData);
      setStocks(res.stockHoldings);
      setTournamentData(res.tournamentData);
    });
  }, [isLoggedIn]);

  useEffect(() => {
    if (!tournamentData?.endDate) return;
    const calculateCountdown = () => {
      try {
        const endDate = new Date(tournamentData.endDate);
        const now = new Date();
        const diff = endDate.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setCountdown({ days, hours, minutes, seconds });
        } else {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } catch (error) {
        console.error('Error calculating countdown:', error);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournamentData?.endDate]);

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString('ko-KR');
  };

  const formatPercentage = (num: number) => {
    return Math.abs(num).toFixed(2);
  };

  const formatTime = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  const isLoading = isLoggedIn && data === null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Header />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-32 pb-12 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽 컬럼 - 자산 정보 (로그인 시에만 표시) */}
          <div className="col-span-8">
            {/* 진행 중인 토너먼트 */}
            <section>
              <h3 className="text-base font-semibold text-gray-700 mb-4">진행 중인 토너먼트</h3>
              <div
                className="bg-gradient-to-br from-[#0088FF] to-[#6155F5] rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                onClick={() => navigate('/tournament')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{tournamentData?.name ?? '토너먼트 이름'}</h2>
                    <p className="text-sm text-white/90 mt-3 font-mono text-base">
                      {formatTime(countdown.days)}:{formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <i className="ri-arrow-right-line text-3xl text-white"></i>
                  </div>
                </div>
              </div>
            </section>

            {isLoggedIn && data ? (
              <>
                {/* 자산 */}
                <section className="mt-6">
                  <h3 className="text-base font-semibold text-gray-700 mb-4">자산</h3>

                  {/* 총 자산 */}
                  <div className="bg-yellow-50 rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <i className="ri-wallet-3-line text-2xl text-yellow-600"></i>
                      </div>
                      <span className="text-base text-gray-700">나의 총 자산</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <h2 className="text-4xl font-bold text-gray-900">{formatNumber(data.totalAssets)}원</h2>
                      <div className={`text-lg font-semibold ${data.profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                        {data.profitLoss >= 0 ? '▲' : '▼'}
                        {formatNumber(Math.abs(data.profitLoss))}
                        <span className="ml-2">({formatPercentage(data.profitLossPercentage)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* 투자 원금 & 남은 자산 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">투자 원금</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(data.investmentPrincipal)}원</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">남은 자산</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(data.cashBalance)}원</p>
                    </div>
                  </div>
                </section>

                {/* 보유 주식 */}
                <section className="mt-6">
                  <h3 className="text-base font-semibold text-gray-700 mb-4">보유 주식</h3>

                  <div className="space-y-4">
                    {stocks.map((stock) => (
                      <div key={stock.id} className="bg-white rounded-2xl p-5 border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                            style={{ backgroundColor: stock.logoColor }}
                          >
                            {stock.name.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-base font-semibold text-gray-900">{stock.name}</h4>
                              <p className="text-base font-bold text-gray-900">{formatNumber(stock.currentValue)}원</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500">{stock.quantity}주 보유</p>
                              <p className={`text-sm font-medium ${stock.profitLoss >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {stock.profitLoss >= 0 ? '▲' : '▼'}
                                {formatNumber(Math.abs(stock.profitLoss))}원 ({formatPercentage(stock.profitLossPercentage)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <section className="mt-6">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i className="ri-wallet-3-line text-3xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600 mb-2">로그인하면 팀의 총 자산을 확인할 수 있습니다.</p>
                  <p className="text-sm text-gray-500 mb-6">같은 토너먼트 팀의 자산·보유 주식이 표시됩니다.</p>
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
                  >
                    로그인
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* 오른쪽 컬럼 - 토너먼트 내역 */}
          <div className="col-span-4">
            <section>
              <h3 className="text-base font-semibold text-gray-700 mb-4">토너먼트 내역</h3>

              <div
                className="bg-white rounded-2xl p-5 border border-gray-200 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate('/tournament')}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="ri-trophy-line text-2xl text-purple-600"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900">{tournamentData?.name ?? '토너먼트 이름'}</h4>
                    <p className="text-sm text-gray-500 mt-2">종료일 {tournamentData?.endDate ?? '-'}</p>
                    <p className="text-sm text-gray-500">D-{tournamentData?.daysRemaining ?? 0}</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-2xl text-gray-400"></i>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
