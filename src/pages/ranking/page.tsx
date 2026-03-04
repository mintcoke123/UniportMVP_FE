import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllGroupsRanking,
  getMyGroupRanking,
  getGroupPortfolio,
  getGroupMembers,
  getMatchingRooms,
} from "../../services";
import type {
  GroupRankingItem,
  MyGroupRankingResponse,
  GroupPortfolioResponse,
  GroupMemberItem,
} from "../../types";

export default function Ranking() {
  const navigate = useNavigate();
  const [allGroupsRanking, setAllGroupsRanking] = useState<GroupRankingItem[]>(
    []
  );
  const [myGroupRanking, setMyGroupRanking] =
    useState<MyGroupRankingResponse | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<{
    id: number;
    groupName: string;
  } | null>(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<GroupMemberItem[]>([]);
  const [teamPortfolio, setTeamPortfolio] =
    useState<GroupPortfolioResponse | null>(null);
  /** 매칭방 목록(우측 상단 방/참가자 수 표시용). 랭킹과 별도로 1회 로드 */
  const [roomCount, setRoomCount] = useState<number | null>(null);
  const [participantCount, setParticipantCount] = useState<number | null>(null);

  useEffect(() => {
    getAllGroupsRanking().then(setAllGroupsRanking).catch(() => {});
    getMyGroupRanking()
      .then(setMyGroupRanking)
      .catch(() => setMyGroupRanking(null));
    getMatchingRooms()
      .then((rooms) => {
        setRoomCount(rooms.length);
        setParticipantCount(rooms.reduce((sum, r) => sum + (r.memberCount ?? 0), 0));
      })
      .catch(() => {
        setRoomCount(null);
        setParticipantCount(null);
      });
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      setTeamMembers([]);
      setTeamPortfolio(null);
      return;
    }
    setTeamDetailLoading(true);
    setTeamMembers([]);
    setTeamPortfolio(null);
    Promise.all([
      getGroupMembers(selectedTeam.id),
      getGroupPortfolio(selectedTeam.id),
    ])
      .then(([members, portfolio]) => {
        setTeamMembers(members ?? []);
        setTeamPortfolio(portfolio ?? null);
      })
      .catch(() => {
        setTeamMembers([]);
        setTeamPortfolio(null);
      })
      .finally(() => setTeamDetailLoading(false));
  }, [selectedTeam?.id]);

  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString("ko-KR");
  };

  const formatPercentage = (rate: number) => {
    const percentage = (rate * 100).toFixed(2);
    return rate >= 0 ? `+${percentage}` : percentage;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700";
    if (rank === 2) return "bg-gray-100 text-gray-700";
    if (rank === 3) return "bg-orange-100 text-orange-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white min-w-0 overflow-x-hidden">
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 box-border">
        {/* 대회 타이틀 + 우측 상단 매칭방/참가자 수 */}
        <div className="relative text-center mb-6 sm:mb-8">
          <div className="absolute top-0 right-0 text-sm text-gray-500 tabular-nums">
            {roomCount !== null && participantCount !== null ? (
              <>방 {roomCount}개 · 참가자 {participantCount}명</>
            ) : null}
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center">
            <i className="ri-trophy-fill text-3xl sm:text-4xl text-white" aria-hidden />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">모의투자 랭킹</h1>
        </div>

        {/* 참가 정보 카드 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4 sm:p-5 text-center min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              <i className="ri-group-line text-2xl sm:text-3xl text-blue-700" aria-hidden />
            </div>
            <p className="text-xs sm:text-sm text-blue-900 mb-1">참가 그룹</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-900 tabular-nums">
              {allGroupsRanking.length}팀
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-4 sm:p-5 text-center min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              <i className="ri-medal-line text-2xl sm:text-3xl text-purple-700" aria-hidden />
            </div>
            <p className="text-xs sm:text-sm text-purple-900 mb-1">순위</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-900 tabular-nums">
              {myGroupRanking ? `${myGroupRanking.rank}위` : "-"}
            </p>
          </div>
        </div>

        {/* 내 그룹 순위 */}
        {myGroupRanking && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
              실시간 순위
            </h2>
            <button
              type="button"
              onClick={() =>
                setSelectedTeam({
                  id: myGroupRanking.id,
                  groupName: myGroupRanking.groupName,
                })
              }
              className="w-full text-left bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-4 sm:p-5 border-2 border-yellow-300 min-w-0 cursor-pointer hover:from-yellow-100 hover:to-yellow-200 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-lg font-bold text-yellow-900">
                      {myGroupRanking.rank}
                    </span>
                  </div>
                </div>
                <span
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-500 text-white flex items-center justify-center text-base sm:text-lg font-semibold shrink-0"
                  aria-hidden
                >
                  {myGroupRanking.groupName.charAt(0)}
                </span>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">
                    {myGroupRanking.groupName}
                  </h3>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 tabular-nums break-all">
                    {formatNumber(myGroupRanking.currentAssets)}원
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`text-base sm:text-lg font-bold tabular-nums ${
                      myGroupRanking.profitRate >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(myGroupRanking.profitRate)}%
                  </p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* 그룹별 랭킹보드 */}
        <section className="min-w-0">
          <div className="space-y-2 sm:space-y-3">
            {allGroupsRanking.map((group, index) => {
              const rank = index + 1;
              const isMyGroup = group.id === myGroupRanking?.id;

              return (
                <button
                  type="button"
                  key={group.id}
                  onClick={() =>
                    setSelectedTeam({
                      id: group.id,
                      groupName: group.groupName,
                    })
                  }
                  className={`w-full text-left rounded-2xl p-4 sm:p-5 min-w-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isMyGroup
                      ? "bg-white border-2 border-blue-300"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 text-center w-7 sm:w-8">
                      <div
                        className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getRankBadgeColor(
                          rank
                        )}`}
                      >
                        <span className="text-sm sm:text-base font-bold">{rank}</span>
                      </div>
                    </div>
                    <span
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-500 text-white flex items-center justify-center text-base sm:text-lg font-semibold shrink-0"
                      aria-hidden
                    >
                      {group.groupName.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1 truncate">
                        {group.groupName}
                      </h3>
                      <p className="text-base sm:text-lg font-bold text-gray-900 tabular-nums break-all">
                        {formatNumber(group.currentAssets)}원
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-sm sm:text-base font-bold tabular-nums ${
                          group.profitRate >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercentage(group.profitRate)}%
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 참여하기 / 채팅 이동 버튼 */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate("/matching-rooms")}
            className="flex-1 min-h-[44px] py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base sm:text-lg font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer whitespace-nowrap"
          >
            팀 참가방
          </button>
          <button
            type="button"
            onClick={() => navigate("/mock-investment")}
            className="flex-1 min-h-[44px] py-3.5 sm:py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base sm:text-lg font-bold rounded-2xl hover:from-teal-600 hover:to-teal-700 transition-all cursor-pointer whitespace-nowrap"
          >
            채팅
          </button>
        </div>

        {/* 팀 상세 모달: 멤버 + 보유 종목 */}
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedTeam(null)}
              aria-hidden
            />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
                <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                  {selectedTeam.groupName}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer shrink-0"
                  aria-label="닫기"
                >
                  <i className="ri-close-line text-xl" aria-hidden />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
                {teamDetailLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    <i className="ri-loader-4-line animate-spin text-2xl inline-block mb-2" aria-hidden />
                    <p>불러오는 중...</p>
                  </div>
                ) : (
                  <>
                    <section>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">
                        팀 멤버
                      </h4>
                      {teamMembers.length === 0 ? (
                        <p className="text-sm text-gray-500">멤버 정보가 없습니다.</p>
                      ) : (
                        <ul className="space-y-2">
                          {teamMembers.map((m) => (
                            <li
                              key={m.id}
                              className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50"
                            >
                              <span className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                                {m.nickname?.charAt(0) ?? "?"}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {m.nickname ?? "-"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                    <section>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">
                        보유 종목
                      </h4>
                      {!teamPortfolio?.holdings?.length ? (
                        <p className="text-sm text-gray-500">보유 종목이 없습니다.</p>
                      ) : (
                        <ul className="space-y-2">
                          {teamPortfolio.holdings.map((h) => (
                            <li
                              key={h.id}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {h.stockName ?? h.stockCode}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {h.quantity?.toLocaleString("ko-KR")}주 · 평단{" "}
                                  {h.averagePrice?.toLocaleString("ko-KR")}원
                                </p>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="text-sm font-bold text-gray-900 tabular-nums">
                                  {h.currentValue?.toLocaleString("ko-KR")}원
                                </p>
                                <p className="text-xs text-gray-500 tabular-nums">
                                  현재가 {h.currentPrice?.toLocaleString("ko-KR")}원
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
