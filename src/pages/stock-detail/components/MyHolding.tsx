interface MyHoldingProps {
  holding: {
    quantity: number;
    avgPrice: number;
    totalValue: number;
    totalProfit: number;
    profitRate: number;
  };
}

const MyHolding = ({ holding }: MyHoldingProps) => {
  const isProfit = holding.totalProfit >= 0;

  return (
    <div className="bg-white mt-2 px-5 py-5">
      <h3 className="text-base font-bold mb-4">내 보유내역</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">보유수량</p>
          <p className="text-base font-semibold">{holding.quantity.toLocaleString()}주</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">평단가</p>
          <p className="text-base font-semibold">{holding.avgPrice.toLocaleString()}원</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">평가금액</p>
          <p className="text-base font-semibold">{holding.totalValue.toLocaleString()}원</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500 mb-1">총수익</p>
          <p className={`text-base font-semibold ${isProfit ? 'text-red-500' : 'text-blue-500'}`}>
            {isProfit ? '+' : ''}{holding.totalProfit.toLocaleString()}원
            <span className="ml-1 text-sm">
              ({isProfit ? '+' : ''}{holding.profitRate}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyHolding;