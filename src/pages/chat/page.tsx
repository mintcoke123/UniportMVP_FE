import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { getChatMessages, getVotes, getGroupPortfolio } from '../../services';
import type { ChatMessageItem, VoteItem, GroupPortfolioResponse } from '../../types';

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'portfolio' | 'vote'>('chat');
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [groupPortfolioData, setGroupPortfolioData] = useState<GroupPortfolioResponse | null>(null);

  useEffect(() => {
    getChatMessages().then(setMessages);
    getVotes().then(setVotes);
    getGroupPortfolio().then(setGroupPortfolioData);
  }, []);
  const [showVoteSuccessModal, setShowVoteSuccessModal] = useState(false);
  const [passedVote, setPassedVote] = useState<VoteItem | null>(null);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 토너먼트 종료 여부 (실제로는 API에서 가져와야 함)
  const isTournamentEnded = true; // 테스트를 위해 true로 설정

  // 현재 사용자 ID (로그인된 사용자)
  const currentUserId = 1;
  const currentUserName = '투자왕김철수';
  const currentUserImage = 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20person%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user001&orientation=squarish';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const newMsg: ChatMessageItem = {
      id: messages.length + 1,
      type: 'user',
      userId: 1,
      userNickname: '나',
      userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20person%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user001&orientation=squarish',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
  };

  const handleGroupInfo = () => {
    setShowGroupInfoModal(true);
  };

  const handleTradeShare = () => {
    navigate('/mock-investment');
  };

  const handleVote = (voteId: number, voteType: '찬성' | '반대') => {
    setVotes(prevVotes => {
      return prevVotes.map(vote => {
        if (vote.id !== voteId) return vote;

        // 이미 투표했는지 확인
        const existingVoteIndex = vote.votes.findIndex(v => v.userId === currentUserId);
        let newVotes = [...vote.votes];

        if (existingVoteIndex >= 0) {
          // 기존 투표 수정
          newVotes[existingVoteIndex] = {
            oderId: existingVoteIndex + 1,
            userId: currentUserId,
            userName: currentUserName,
            userImage: currentUserImage,
            vote: voteType
          };
        } else {
          // 새 투표 추가
          newVotes.push({
            oderId: newVotes.length + 1,
            userId: currentUserId,
            userName: currentUserName,
            userImage: currentUserImage,
            vote: voteType
          });
        }

        // 과반수 체크
        const agreeCount = newVotes.filter(v => v.vote === '찬성').length;
        const disagreeCount = newVotes.filter(v => v.vote === '반대').length;
        const majority = Math.ceil(vote.totalMembers / 2);

        let newStatus = vote.status;
        if (agreeCount >= majority) {
          newStatus = 'passed';
          setPassedVote({ ...vote, votes: newVotes, status: 'passed' });
          setShowVoteSuccessModal(true);
        } else if (disagreeCount >= majority) {
          newStatus = 'rejected';
        }

        return {
          ...vote,
          votes: newVotes,
          status: newStatus
        };
      });
    });
  };

  const getVoteCount = (vote: VoteItem, type: '찬성' | '반대') => {
    return vote.votes.filter(v => v.vote === type).length;
  };

  const getUserVote = (vote: VoteItem) => {
    const userVote = vote.votes.find(v => v.userId === currentUserId);
    return userVote?.vote || null;
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('ko-KR')}원`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const isProfit = (groupPortfolioData?.profitLoss ?? 0) >= 0;

  const handleTradeCardClick = (tradeData: { action: '매수' | '매도'; stockName: string; quantity: number; pricePerShare: number; reason: string }, userNickname: string, userProfileImage: string) => {
    // 해당 거래 계획에 대한 투표 생성
    const newVote: VoteItem = {
      id: votes.length + 1,
      type: tradeData.action,
      stockName: tradeData.stockName,
      proposerId: 0,
      proposerName: userNickname || '알 수 없음',
      proposerImage: userProfileImage || '',
      quantity: tradeData.quantity,
      proposedPrice: tradeData.pricePerShare,
      reason: tradeData.reason,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      expiresAt: '24시간 후 만료',
      votes: [],
      totalMembers: 5,
      status: 'ongoing'
    };
    
    setVotes([newVote, ...votes]);
    setActiveTab('vote');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* 채팅 헤더 */}
      <div className="fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl text-gray-700"></i>
            </button>
            <h1 className="text-lg font-bold text-gray-900">안세대 투자 클럽</h1>
            <span className="text-sm text-gray-500">5명</span>
          </div>
          <button 
            onClick={handleGroupInfo}
            className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 cursor-pointer whitespace-nowrap transition-colors"
          >
            채팅방 정보
          </button>
        </div>

        {/* 탭 전환 */}
        <div className="max-w-4xl mx-auto px-5 pb-3">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'chat' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-chat-3-line mr-1"></i>
              채팅
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'portfolio' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-pie-chart-line mr-1"></i>
              포트폴리오
            </button>
            <button
              onClick={() => setActiveTab('vote')}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'vote' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-checkbox-circle-line mr-1"></i>
              투표
              {votes.filter(v => v.status === 'ongoing').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {votes.filter(v => v.status === 'ongoing').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-y-auto pt-44 pb-32 px-5">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'user' && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={msg.userProfileImage} alt={msg.userNickname} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{msg.userNickname}</span>
                        <span className="text-xs text-gray-400">{msg.timestamp}</span>
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 inline-block max-w-md">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {msg.type === 'trade' && msg.tradeData && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={msg.userProfileImage} alt={msg.userNickname} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{msg.userNickname}</span>
                        <span className="text-xs text-gray-400">{msg.timestamp}</span>
                      </div>
                      <div 
                        onClick={() => handleTradeCardClick(msg.tradeData, msg.userNickname || '', msg.userProfileImage || '')}
                        className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl rounded-tl-sm p-4 shadow-sm border border-teal-200 max-w-md cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            msg.tradeData.action === '매수' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            {msg.tradeData.action} 계획
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">종목</span>
                            <span className="text-sm font-semibold text-gray-900">{msg.tradeData.stockName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">수량</span>
                            <span className="text-sm font-semibold text-gray-900">{msg.tradeData.quantity}주</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">희망 가격</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(msg.tradeData.pricePerShare)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">주문 금액</span>
                            <span className="text-sm font-bold text-teal-600">{formatCurrency(msg.tradeData.totalAmount)}</span>
                          </div>
                        </div>
                        <div className="border-t border-teal-200 pt-3 mb-3">
                          <p className="text-sm text-gray-700">{msg.tradeData.reason}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.tradeData.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white text-teal-600 text-xs font-medium rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* 포트폴리오 영역 */}
      {activeTab === 'portfolio' && (
        <div className="flex-1 overflow-y-auto pt-44 pb-32 px-5">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 투자 원금 및 손익 */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <i className="ri-wallet-3-line text-2xl"></i>
                <h3 className="text-lg font-bold">팀 투자 현황</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-100">투자 원금</span>
                  <span className="text-2xl font-bold">{formatCurrency(groupPortfolioData?.investmentAmount ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-100">현재 평가액</span>
                  <span className="text-2xl font-bold">{formatCurrency(groupPortfolioData?.totalValue ?? 0)}</span>
                </div>
                <div className="border-t border-teal-400 pt-3 flex justify-between items-center">
                  <span className="text-sm text-teal-100">총 손익</span>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${isProfit ? 'text-yellow-300' : 'text-red-200'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(groupPortfolioData?.profitLoss ?? 0)}
                    </span>
                    <span className={`text-sm ml-2 ${isProfit ? 'text-yellow-300' : 'text-red-200'}`}>
                      {formatPercentage(groupPortfolioData?.profitLossPercentage ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 파이 차트 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4">포트폴리오 구성</h3>
              <div className="flex items-center justify-center mb-6">
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {(groupPortfolioData?.holdings ?? []).map((holding, index) => {
                    const holdings = groupPortfolioData?.holdings ?? [];
                    const total = holdings.reduce((sum, h) => sum + h.currentValue, 0);
                    let startAngle = 0;
                    for (let i = 0; i < index; i++) {
                      startAngle += (holdings[i].currentValue / total) * 360;
                    }
                    const angle = (holding.currentValue / total) * 360;
                    const endAngle = startAngle + angle;
                    
                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;
                    
                    const x1 = 100 + 80 * Math.cos(startRad);
                    const y1 = 100 + 80 * Math.sin(startRad);
                    const x2 = 100 + 80 * Math.cos(endRad);
                    const y2 = 100 + 80 * Math.sin(endRad);
                    
                    const largeArc = angle > 180 ? 1 : 0;
                    
                    const colors = ['#14B8A6', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
                    
                    return (
                      <path
                        key={holding.id}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={colors[index % colors.length]}
                        opacity="0.9"
                      />
                    );
                  })}
                  <circle cx="100" cy="100" r="50" fill="white" />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(groupPortfolioData?.holdings ?? []).map((holding, index) => {
                  const colors = ['bg-teal-500', 'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-green-500'];
                  const total = (groupPortfolioData?.holdings ?? []).reduce((sum, h) => sum + h.currentValue, 0);
                  const percentage = ((holding.currentValue / total) * 100).toFixed(1);
                  
                  return (
                    <div key={holding.id} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900">{holding.stockName}</p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 보유 종목 리스트 */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-gray-900">보유 종목</h3>
              {(groupPortfolioData?.holdings ?? []).map((holding) => {
                const profitLoss = holding.currentValue - (holding.averagePrice * holding.quantity);
                const profitLossPercentage = ((profitLoss / (holding.averagePrice * holding.quantity)) * 100);
                const isProfit = profitLoss >= 0;
                const isSelected = selectedStock === holding.id;

                return (
                  <div 
                    key={holding.id}
                    onClick={() => setSelectedStock(isSelected ? null : holding.id)}
                    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer ${
                      isSelected ? 'border-teal-500 ring-2 ring-teal-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{holding.stockName}</h4>
                        <span className="text-xs text-gray-500">{holding.stockCode}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(holding.currentPrice)}</p>
                        <p className={`text-xs font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(profitLossPercentage)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <span className="text-xs text-gray-500">보유수량</span>
                        <p className="text-sm font-semibold text-gray-900">{holding.quantity}주</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">평균단가</span>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(holding.averagePrice)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">평가손익</span>
                        <p className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // 처분 투표 생성
                          const newVote: VoteItem = {
                            id: votes.length + 1,
                            type: '매도',
                            stockName: holding.stockName,
                            quantity: holding.quantity,
                            proposedPrice: holding.currentPrice,
                            reason: `${holding.stockName} 전량 시장가 매도 제안입니다. 현재 보유 수량 ${holding.quantity}주를 모두 처분하고자 합니다.`,
                            proposerName: currentUserName,
                            proposerImage: currentUserImage,
                            expiresAt: '24시간 후 만료',
                            votes: [],
                            totalMembers: 5,
                            status: 'ongoing'
                          };
                          setVotes([newVote, ...votes]);
                          setActiveTab('vote');
                          setSelectedStock(null);
                        }}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 cursor-pointer whitespace-nowrap transition-all"
                      >
                        <i className="ri-arrow-down-line mr-1"></i>
                        시장가 전량 처분 투표 생성
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 투표 목록 영역 */}
      {activeTab === 'vote' && (
        <div className="flex-1 overflow-y-auto pt-44 pb-32 px-5">
          <div className="max-w-4xl mx-auto space-y-4">
            {votes.length === 0 ? (
              <div className="text-center py-20">
                <i className="ri-checkbox-circle-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">진행 중인 투표가 없습니다</p>
              </div>
            ) : (
              votes.map((vote) => (
                <div 
                  key={vote.id} 
                  className={`bg-white rounded-2xl p-5 shadow-sm border ${
                    vote.status === 'passed' ? 'border-green-300 bg-green-50' :
                    vote.status === 'rejected' ? 'border-red-300 bg-red-50' :
                    'border-gray-200'
                  }`}
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        <img src={vote.proposerImage} alt={vote.proposerName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">제안자 {vote.proposerName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{vote.expiresAt}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      vote.type === '매수' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {vote.type}
                    </div>
                  </div>

                  {/* 종목 정보 */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{vote.stockName}</h3>
                      <span className="text-sm text-gray-500">{vote.votes.length}/{vote.totalMembers}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">수량</span>
                        <p className="text-sm font-semibold text-gray-900">{vote.quantity}주</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">지정가</span>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(vote.proposedPrice)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 투자 근거 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{vote.reason}</p>
                  </div>

                  {/* 투표 현황 - 실명 표시 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500">투표 현황</span>
                      <span className="text-xs text-gray-400">(실명 투표)</span>
                    </div>
                    <div className="flex gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-green-600 font-medium">찬성</span>
                        <span className="text-xs font-bold text-green-600">{getVoteCount(vote, '찬성')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600 font-medium">반대</span>
                        <span className="text-xs font-bold text-red-600">{getVoteCount(vote, '반대')}</span>
                      </div>
                    </div>

                    {/* 투표자 목록 */}
                    {vote.votes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {vote.votes.map((v, idx) => (
                          <div 
                            key={idx}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                              v.vote === '찬성' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full overflow-hidden">
                              <img src={v.userImage} alt={v.userName} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium">{v.userName}</span>
                            <span>({v.vote})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 투표 버튼 */}
                  {vote.status === 'ongoing' ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVote(vote.id, '찬성')}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          getUserVote(vote) === '찬성'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        찬성
                      </button>
                      <button
                        onClick={() => handleVote(vote.id, '반대')}
                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          getUserVote(vote) === '반대'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        반대
                      </button>
                    </div>
                  ) : (
                    <div className={`py-3 rounded-xl text-sm font-bold text-center ${
                      vote.status === 'passed' ? 'bg-green-500 text-white' :
                      vote.status === 'rejected' ? 'bg-red-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {vote.status === 'passed' ? '✓ 투표 통과 - 체결 완료' :
                       vote.status === 'rejected' ? '✗ 투표 부결' :
                       '투표 만료'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 채팅 입력 영역 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-5 py-4">
          {isTournamentEnded ? (
            // 토너먼트 종료 시 피드백 리포트 버튼 표시
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                <div className="flex items-center gap-3 mb-2">
                  <i className="ri-trophy-line text-2xl text-teal-600"></i>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">토너먼트가 종료되었습니다</h3>
                    <p className="text-xs text-gray-600">팀의 투자 결과를 확인해보세요</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/feedback-report')}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 cursor-pointer whitespace-nowrap transition-all flex items-center justify-center gap-2"
              >
                <i className="ri-file-chart-line text-xl"></i>
                <span>피드백 리포트 보기</span>
              </button>
            </div>
          ) : (
            // 토너먼트 진행 중일 때 기존 채팅 입력 UI
            <>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleTradeShare}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-pink-600 cursor-pointer whitespace-nowrap transition-all flex items-center justify-center gap-2"
                >
                  <i className="ri-stock-line text-lg"></i>
                  <span>매수/매도 계획 공유</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center hover:bg-teal-600 cursor-pointer transition-colors"
                >
                  <i className="ri-send-plane-fill text-white text-xl"></i>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 매수/매도 계획 공유 모달 */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">매수/매도 계획 공유</h3>
            <p className="text-sm text-gray-600 mb-4">
              모의투자 페이지에서 매수/매도 계획을 작성하고 공유할 수 있습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-300 cursor-pointer whitespace-nowrap transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowTradeModal(false);
                  navigate('/mock-investment');
                }}
                className="flex-1 py-3 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 cursor-pointer whitespace-nowrap transition-colors"
              >
                모의투자로 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 투표 통과 모달 */}
      {showVoteSuccessModal && passedVote && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-checkbox-circle-fill text-4xl text-green-500"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">투표 통과!</h3>
            <p className="text-sm text-gray-600 mb-4">
              과반수 찬성으로 <span className="font-bold">{passedVote.stockName}</span> {passedVote.type} 주문이 체결되었습니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">종목</span>
                <span className="text-sm font-semibold">{passedVote.stockName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">유형</span>
                <span className={`text-sm font-semibold ${passedVote.type === '매수' ? 'text-red-600' : 'text-blue-600'}`}>
                  {passedVote.type}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">수량</span>
                <span className="text-sm font-semibold">{passedVote.quantity}주</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">체결가</span>
                <span className="text-sm font-semibold">{formatCurrency(passedVote.proposedPrice)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowVoteSuccessModal(false);
                setPassedVote(null);
              }}
              className="w-full py-3 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 cursor-pointer whitespace-nowrap transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 그룹 정보 모달 */}
      {showGroupInfoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">채팅방 정보</h3>
              <button
                onClick={() => setShowGroupInfoModal(false)}
                className="w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-700"></i>
              </button>
            </div>

            {/* 그룹 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <img src={groupPortfolioData?.profileImage ?? ''} alt={groupPortfolioData?.groupName ?? ''} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">{groupPortfolioData?.groupName ?? '-'}</h4>
                  <span className="text-sm text-gray-500">멤버 5명</span>
                </div>
              </div>

              {/* 투자 정보 */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-wallet-3-line text-teal-600 text-lg"></i>
                  <span className="text-sm font-semibold text-gray-700">팀 투자 현황</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">팀 투자금(실시간)</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(groupPortfolioData?.investmentAmount ?? 0)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">전체 자산</span>
                    <span className="text-base font-bold text-gray-900">{formatCurrency(groupPortfolioData?.totalValue ?? 0)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-teal-200">
                    <span className="text-sm text-gray-600">투자 손익</span>
                    <div className="text-right">
                      <span className={`text-base font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? '+' : ''}{formatCurrency(groupPortfolioData?.profitLoss ?? 0)}
                      </span>
                      <span className={`text-xs ml-2 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(groupPortfolioData?.profitLossPercentage ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowGroupInfoModal(false);
                  navigate('/group-portfolio');
                }}
                className="w-full py-3 bg-teal-500 text-white text-sm font-bold rounded-xl hover:bg-teal-600 cursor-pointer whitespace-nowrap transition-colors"
              >
                그룹 포트폴리오 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}