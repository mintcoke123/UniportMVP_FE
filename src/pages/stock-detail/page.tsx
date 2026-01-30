import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStockDetail } from '../../mocks/stockDetailData';
import StockChart from './components/StockChart';
import MyHolding from './components/MyHolding';

type OrderType = 'buy' | 'sell' | null;

const investmentReasons = [
  '#실적발표',
  '#저평가',
  '#장기투자',
  '#급등기대',
];

const StockDetailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stockId = parseInt(searchParams.get('id') || '1');
  const stock = getStockDetail(stockId);

  const [orderType, setOrderType] = useState<OrderType>(null);
  const [quantity, setQuantity] = useState(1);
  const [pricePerShare, setPricePerShare] = useState(stock?.currentPrice || 0);
  const [investmentLogic, setInvestmentLogic] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  if (!stock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">종목을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const totalOrderAmount = quantity * pricePerShare;

  const handleOpenModal = (type: OrderType) => {
    setOrderType(type);
    setPricePerShare(stock.currentPrice);
    setQuantity(1);
    setInvestmentLogic('');
    setSelectedTags([]);
  };

  const handleCloseModal = () => {
    setOrderType(null);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSharePlan = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    // 채팅방에 특수 메시지 공유 로직
    console.log('공유 완료:', {
      type: orderType,
      stockName: stock.name,
      quantity,
      pricePerShare,
      totalAmount: totalOrderAmount,
      investmentLogic,
      selectedTags
    });
    setShowConfirmDialog(false);
    setOrderType(null);
    
    // 성공 메시지 표시
    setShowSuccessMessage(true);
    
    // 1초 후 채팅 페이지로 이동
    setTimeout(() => {
      navigate('/chat');
    }, 1000);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <h1 className="ml-3 text-lg font-semibold">{stock.name}</h1>
        </div>
      </div>

      {/* Stock Info */}
      <div className="bg-white px-5 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: stock.logoColor }}
          >
            {stock.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold">{stock.name}</h2>
            <p className="text-sm text-gray-500">{stock.code}</p>
          </div>
        </div>
        
        <div className="flex items-end gap-3">
          <p className="text-3xl font-bold">{stock.currentPrice.toLocaleString()}원</p>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-semibold ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
              {isPositive ? '+' : ''}{stock.change.toLocaleString()}원
            </span>
            <span className={`text-lg font-semibold ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
              {isPositive ? '+' : ''}{stock.changeRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <StockChart stockName={stock.name} />

      {/* My Holding */}
      {stock.myHolding && <MyHolding holding={stock.myHolding} />}

      {/* Buy/Sell Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-50">
        <div className="flex gap-3">
          <button 
            onClick={() => handleOpenModal('sell')}
            className="flex-1 py-3.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            판매
          </button>
          <button 
            onClick={() => handleOpenModal('buy')}
            className="flex-1 py-3.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            구매
          </button>
        </div>
      </div>

      {/* Order Modal */}
      {orderType && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={handleCloseModal}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold">
                {orderType === 'buy' ? '구매' : '판매'} 계획 공유
              </h3>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-500"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
              {/* Stock Name & Quantity */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">종목 이름</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{stock.name}</span>
                  <span className="text-gray-400">·</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      <i className="ri-subtract-line text-sm"></i>
                    </button>
                    <span className="font-semibold min-w-[24px] text-center">{quantity}주</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 mb-6">
                {orderType === 'buy' ? '구매' : '판매'} 계획을 공유합니다
              </p>

              {/* Price & Total */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">1주 {orderType === 'buy' ? '매수' : '매도'} 희망 가격</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pricePerShare.toLocaleString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        if (!isNaN(Number(value))) {
                          setPricePerShare(Number(value));
                        }
                      }}
                      className="w-32 text-right font-semibold bg-transparent outline-none"
                    />
                    <span className="text-gray-600">원</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">전체 주문 금액</span>
                  <span className="font-semibold">{totalOrderAmount.toLocaleString()}원</span>
                </div>
              </div>

              {/* Investment Logic */}
              <div className="mb-4">
                <label className="block text-gray-600 mb-2">투자 논리</label>
                <textarea
                  value={investmentLogic}
                  onChange={(e) => setInvestmentLogic(e.target.value.slice(0, 500))}
                  placeholder="투자를 계획하시는 이유를 작성해주세요"
                  className="w-full h-24 px-4 py-3 bg-gray-50 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  maxLength={500}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {investmentReasons.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors whitespace-nowrap ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Share Button */}
              <button
                onClick={handleSharePlan}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-colors cursor-pointer whitespace-nowrap ${
                  orderType === 'buy' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {orderType === 'buy' ? '구매' : '판매'} 계획 공유하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={handleCancelConfirm}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-2xl overflow-hidden animate-scale-up">
            {/* Dialog Header */}
            <div className="px-5 pt-6 pb-4 text-center">
              <h4 className="text-lg font-bold mb-1">
                {orderType === 'buy' ? '매수' : '매도'} 확인
              </h4>
              <p className="text-sm text-gray-500">
                아래 내용으로 {orderType === 'buy' ? '매수' : '매도'} 계획을 공유합니다
              </p>
            </div>

            {/* Dialog Content */}
            <div className="px-5 pb-5">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">종목명</span>
                  <span className="font-semibold">{stock.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">수량</span>
                  <span className="font-semibold">{quantity}주</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">1주 희망 가격</span>
                  <span className="font-semibold">{pricePerShare.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">주문 금액</span>
                  <span className="font-semibold">{totalOrderAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* Dialog Buttons */}
            <div className="flex border-t border-gray-100">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                취소
              </button>
              <div className="w-px bg-gray-100"></div>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-4 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  orderType === 'buy' 
                    ? 'text-red-500 hover:bg-red-50' 
                    : 'text-blue-500 hover:bg-blue-50'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative bg-white rounded-2xl px-8 py-6 shadow-xl animate-scale-up">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                <i className="ri-check-line text-white text-3xl"></i>
              </div>
              <p className="text-lg font-bold text-gray-900">공유 완료!</p>
              <p className="text-sm text-gray-500">채팅방으로 이동합니다</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes scale-up {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StockDetailPage;
