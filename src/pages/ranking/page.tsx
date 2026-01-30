import { useNavigate } from 'react-router-dom';
import { allGroupsRanking, myGroupRanking } from '../../mocks/rankingData';

export default function Ranking() {
  const navigate = useNavigate();

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString('ko-KR');
  };

  const formatPercentage = (rate: number) => {
    const percentage = (rate * 100).toFixed(2);
    return rate >= 0 ? `+${percentage}` : percentage;
  };

  const handleGroupClick = (groupId: number) => {
    // 해당 그룹의 포트폴리오 화면으로 이동
    navigate(`/portfolio/${groupId}`);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-700';
    if (rank === 2) return 'bg-gray-100 text-gray-700';
    if (rank === 3) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-line text-2xl text-gray-900"></i>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8">
        {/* 토너먼트 타이틀 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center">
            <i className="ri-trophy-fill text-4xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">토너먼트 이름</h1>
        </div>

        {/* 참가 정보 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <i className="ri-group-line text-3xl text-blue-700"></i>
            </div>
            <p className="text-sm text-blue-900 mb-1">참가 그룹</p>
            <p className="text-2xl font-bold text-blue-900">5팀</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <i className="ri-timer-line text-3xl text-purple-700"></i>
            </div>
            <p className="text-sm text-purple-900 mb-1">종료까지</p>
            <p className="text-2xl font-bold text-purple-900">dd fff mmmm</p>
          </div>
        </div>

        {/* 내 그룹 순위 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">실시간 순위</h2>
          <div 
            onClick={() => handleGroupClick(myGroupRanking.id)}
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-5 border-2 border-yellow-300 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 text-center">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-yellow-900">{myGroupRanking.rank}</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                <img 
                  src={myGroupRanking.profileImage} 
                  alt={myGroupRanking.groupName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 mb-1">{myGroupRanking.groupName}</h3>
                <p className="text-xl font-bold text-gray-900">{formatNumber(myGroupRanking.currentAssets)}원</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-bold ${myGroupRanking.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(myGroupRanking.profitRate)}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 그룹별 랭킹보드 */}
        <section>
          <div className="space-y-3">
            {allGroupsRanking.map((group, index) => {
              const rank = index + 1;
              const isMyGroup = group.id === myGroupRanking.id;
              
              return (
                <div 
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className={`rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all ${
                    isMyGroup 
                      ? 'bg-white border-2 border-blue-300' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 text-center w-8">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankBadgeColor(rank)}`}>
                        <span className="text-base font-bold">{rank}</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      <img 
                        src={group.profileImage} 
                        alt={group.groupName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{group.groupName}</h3>
                      <p className="text-lg font-bold text-gray-900">{formatNumber(group.currentAssets)}원</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${group.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(group.profitRate)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 참여하기 버튼 */}
        <div className="mt-8">
          <button 
            onClick={() => navigate('/group-portfolio')}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer whitespace-nowrap"
          >
            참여하기
          </button>
        </div>
      </main>
    </div>
  );
}