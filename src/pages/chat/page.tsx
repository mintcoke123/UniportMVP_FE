import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/feature/Header";
import { useAuth } from "../../contexts/AuthContext";
import {
  getChatMessages,
  sendChatMessage,
  getVotes,
  createVote,
  submitVote as submitVoteApi,
  getGroupPortfolio,
  getMyMatchingRooms,
  getMatchingRooms,
  leaveMatchingRoom,
} from "../../services";
import type {
  ChatMessageItem,
  VoteItem,
  GroupPortfolioResponse,
  GroupHoldingItem,
  MatchingRoom,
} from "../../types";

const CAPACITY = 3;
const STORAGE_KEY_SELECTED_ROOM = "uniport_selected_room_id";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, updateUserTeam } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "vote">("chat");
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [groupPortfolioData, setGroupPortfolioData] =
    useState<GroupPortfolioResponse | null>(null);

  /** 팀원 매칭 대기: 참가한 방 중 멤버 부족한 방 → "팀원을 매칭중입니다..." 표시 */
  const [matchingRooms, setMatchingRooms] = useState<MatchingRoom[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [leaveConfirmRoomId, setLeaveConfirmRoomId] = useState<string | null>(
    null,
  );
  const [actionRoomId, setActionRoomId] = useState<string | null>(null);
  /** GET 채팅 목록 403 시 표시 (해당 그룹 멤버 아님) */
  const [chatError, setChatError] = useState<string | null>(null);

  const isInRoom = (room: MatchingRoom) =>
    room.isJoined === true ||
    (Boolean(user) && room.members.some((m) => m.userId === user!.id));
  const myWaitingRoom = matchingRooms.find(
    (room) => isInRoom(room) && room.memberCount < CAPACITY,
  );

  /** 내가 속한 채팅방 목록. GET /api/me/matching-rooms (채팅 진입 시 로드) */
  const [myRooms, setMyRooms] = useState<MatchingRoom[]>([]);
  const [myRoomsLoading, setMyRoomsLoading] = useState(true);
  /** 선택한 방 id (예: "room-1"). 없으면 첫 번째 started/full 방 또는 첫 방 */
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  /** room id "room-1" → 채팅/그룹 API용 숫자 ID 1 */
  const roomIdToGroupId = (roomId: string): number | undefined => {
    const n = parseInt(roomId.replace(/^room-/, ""), 10);
    return Number.isNaN(n) || n < 1 ? undefined : n;
  };

  const selectedRoom =
    selectedRoomId != null
      ? myRooms.find((r) => r.id === selectedRoomId)
      : (myRooms.find((r) => r.status === "started") ??
        myRooms.find((r) => r.status === "full") ??
        myRooms[0]);
  const groupId = selectedRoom ? roomIdToGroupId(selectedRoom.id) : undefined;

  useEffect(() => {
    if (!user || myWaitingRoom) {
      setMyRooms([]);
      setSelectedRoomId(null);
      setMyRoomsLoading(false);
      return;
    }
    setMyRoomsLoading(true);
    getMyMatchingRooms()
      .then((list) => {
        if (list.length > 0) {
          setMyRooms(list);
          const startedRoom = list.find((r) => r.status === "started");
          if (startedRoom && (!user?.teamId || !String(user.teamId).startsWith("team-"))) {
            const teamId = "team-" + startedRoom.id.replace(/^room-/, "");
            updateUserTeam(teamId);
          }
          setSelectedRoomId((prev) => {
            const teamRoomId =
              user?.teamId && String(user.teamId).startsWith("team-")
                ? "room-" + String(user.teamId).slice(5)
                : null;
            const inListTeam =
              teamRoomId && list.some((r) => r.id === teamRoomId);
            const saved =
              typeof localStorage !== "undefined"
                ? localStorage.getItem(STORAGE_KEY_SELECTED_ROOM)
                : null;
            const inList = saved && list.some((r) => r.id === saved);
            const first =
              list.find((r) => r.status === "started") ??
              list.find((r) => r.status === "full") ??
              list[0];
            const next = inListTeam
              ? teamRoomId
              : inList
                ? saved
                : prev && list.some((r) => r.id === prev)
                  ? prev
                  : (first?.id ?? null);
            if (next && typeof localStorage !== "undefined")
              localStorage.setItem(STORAGE_KEY_SELECTED_ROOM, next);
            return next;
          });
          return;
        }
        // GET /api/me/matching-rooms 실패(500 등) 시 fallback: 전체 목록에서 내가 참가한 방만 필터
        return getMatchingRooms().then((allRooms) => {
          const joined = allRooms.filter(
            (r) =>
              r.isJoined === true ||
              (Boolean(user) && r.members.some((m) => m.userId === user!.id)),
          );
          setMyRooms(joined);
          setSelectedRoomId((prev) => {
            if (joined.length === 0) return null;
            const teamRoomId =
              user?.teamId && String(user.teamId).startsWith("team-")
                ? "room-" + String(user.teamId).slice(5)
                : null;
            const inListTeam =
              teamRoomId && joined.some((r) => r.id === teamRoomId);
            const saved =
              typeof localStorage !== "undefined"
                ? localStorage.getItem(STORAGE_KEY_SELECTED_ROOM)
                : null;
            const inList = saved && joined.some((r) => r.id === saved);
            const first =
              joined.find((r) => r.status === "started") ??
              joined.find((r) => r.status === "full") ??
              joined[0];
            const next = inListTeam
              ? teamRoomId
              : inList
                ? saved
                : prev && joined.some((r) => r.id === prev)
                  ? prev
                  : (first?.id ?? null);
            if (next && typeof localStorage !== "undefined")
              localStorage.setItem(STORAGE_KEY_SELECTED_ROOM, next);
            return next;
          });
        });
      })
      .catch(() => {
        // GET /api/me/matching-rooms 실패(500 등) 시 fallback: 전체 목록에서 내가 참가한 방만 필터
        return getMatchingRooms().then((allRooms) => {
          const joined = allRooms.filter(
            (r) =>
              r.isJoined === true ||
              (Boolean(user) && r.members.some((m) => m.userId === user!.id)),
          );
          setMyRooms(joined);
          setSelectedRoomId((prev) => {
            if (joined.length === 0) return null;
            const teamRoomId =
              user?.teamId && String(user.teamId).startsWith("team-")
                ? "room-" + String(user.teamId).slice(5)
                : null;
            const inListTeam =
              teamRoomId && joined.some((r) => r.id === teamRoomId);
            const saved =
              typeof localStorage !== "undefined"
                ? localStorage.getItem(STORAGE_KEY_SELECTED_ROOM)
                : null;
            const inList = saved && joined.some((r) => r.id === saved);
            const first =
              joined.find((r) => r.status === "started") ??
              joined.find((r) => r.status === "full") ??
              joined[0];
            const next = inListTeam
              ? teamRoomId
              : inList
                ? saved
                : prev && joined.some((r) => r.id === prev)
                  ? prev
                  : (first?.id ?? null);
            if (next && typeof localStorage !== "undefined")
              localStorage.setItem(STORAGE_KEY_SELECTED_ROOM, next);
            return next;
          });
        });
      })
      .finally(() => setMyRoomsLoading(false));
  }, [user?.id, !!myWaitingRoom]);

  useEffect(() => {
    getMatchingRooms().then((list) => {
      setMatchingRooms(list);
      setMatchingLoading(false);
    });
  }, []);

  useEffect(() => {
    if (myWaitingRoom) return;
    if (groupId == null) {
      setMessages([]);
      setVotes([]);
      setGroupPortfolioData(null);
      setChatError(null);
      return;
    }
    setChatError(null);
    getChatMessages(groupId)
      .then((msgs) => {
        setMessages(msgs);
        setChatError(null);
      })
      .catch((e) => {
        setMessages([]);
        setChatError(
          e?.message ??
            "이 그룹의 멤버가 아닙니다. 해당 채팅방에 참가한 멤버만 읽고 쓸 수 있습니다.",
        );
      });
    getVotes(groupId).then(setVotes);
    getGroupPortfolio(groupId)
      .then((data) => {
        setGroupPortfolioData(data);
      })
      .catch((e) => {
        setGroupPortfolioData(null);
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/a6a64c35-8528-46cf-81e3-5dc882525cc5",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "chat:getGroupPortfolio:error",
              message: "portfolio failed",
              data: { groupId, err: String(e?.message ?? e) },
              timestamp: Date.now(),
              sessionId: "debug-session",
              hypothesisId: "H1,H5",
            }),
          },
        ).catch(() => {});
        // #endregion
      });
  }, [myWaitingRoom, groupId]);

  const handleLeaveFromChat = async (roomId: string) => {
    setActionRoomId(roomId);
    const result = await leaveMatchingRoom(roomId);
    setActionRoomId(null);
    setLeaveConfirmRoomId(null);
    if (result.success)
      getMatchingRooms()
        .then(setMatchingRooms)
        .catch(() => {});
  };
  const [showVoteSuccessModal, setShowVoteSuccessModal] = useState(false);
  const [passedVote, setPassedVote] = useState<VoteItem | null>(null);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  /** 매도 투표 생성 모달: 열린 보유 종목. null이면 모달 비표시 */
  const [sellVoteModalHolding, setSellVoteModalHolding] =
    useState<GroupHoldingItem | null>(null);
  const [sellVoteQuantity, setSellVoteQuantity] = useState<number>(0);
  const [sellVoteReason, setSellVoteReason] = useState<string>("");
  const [sellVoteSubmitting, setSellVoteSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 대회 종료 여부 (실제로는 API에서 가져와야 함)
  const isTournamentEnded = false; // 대회 진행 중일 때 채팅 입력 UI 표시

  /** 로그인 사용자 (채팅·투표 표시용) */
  const currentUserId = user?.id != null ? Number(user.id) || 0 : 0;
  const currentUserName = user?.nickname ?? "나";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [sending, setSending] = useState(false);
  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (text === "" || groupId == null || sending) return;

    setSending(true);
    const result = await sendChatMessage(groupId, text);
    setSending(false);
    if (result.success) {
      setNewMessage("");
      getChatMessages(groupId)
        .then(setMessages)
        .catch(() => {});
    } else {
      alert(result.message ?? "메시지 전송에 실패했습니다.");
    }
  };

  const handleTradeShare = () => {
    navigate("/mock-investment");
  };

  const handleVote = (voteId: number, voteType: "찬성" | "반대" | "보류") => {
    if (groupId == null) return;
    const vote = votes.find((v) => v.id === voteId);
    if (vote && getUserVote(vote) === voteType) return;
    submitVoteApi(groupId, voteId, voteType)
      .then((res) => {
        if (!res.success) {
          alert(res.message ?? "투표 반영에 실패했습니다.");
          return;
        }
        return getVotes(groupId!).then((updated) => {
          setVotes(updated);
          const v = updated.find((x) => x.id === voteId);
          if (v?.status === "passed") {
            setPassedVote(v);
            setShowVoteSuccessModal(true);
            getGroupPortfolio(groupId!).then(setGroupPortfolioData).catch(() => {});
          }
        });
      })
      .catch(() => alert("투표 반영에 실패했습니다."));
  };

  const getVoteCount = (vote: VoteItem, type: "찬성" | "반대" | "보류") => {
    return vote.votes.filter((v) => v.vote === type).length;
  };

  const getUserVote = (vote: VoteItem): "찬성" | "반대" | "보류" | null => {
    const userVote = vote.votes.find((v) => v.userId === currentUserId);
    return userVote?.vote ?? null;
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString("ko-KR")}원`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const isProfit = (groupPortfolioData?.profitLoss ?? 0) >= 0;

  const handleTradeCardClick = (
    tradeData: {
      action: "매수" | "매도";
      stockName: string;
      quantity: number;
      pricePerShare: number;
      reason: string;
    },
    userNickname: string,
  ) => {
    // 해당 거래 계획에 대한 투표 생성 (채팅방 정원 3명 기준)
    const newVote: VoteItem = {
      id: votes.length + 1,
      type: tradeData.action,
      stockName: tradeData.stockName,
      proposerId: 0,
      proposerName: userNickname || "알 수 없음",
      quantity: tradeData.quantity,
      proposedPrice: tradeData.pricePerShare,
      reason: tradeData.reason,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      expiresAt: "24시간 후 만료",
      votes: [],
      totalMembers: CAPACITY,
      status: "ongoing",
    };

    setVotes([newVote, ...votes]);
    setRightPanelTab("vote");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* 팀원 매칭 대기 중: "팀원을 매칭중입니다..." 표시 */}
        {matchingLoading ? (
          <div className="flex justify-center py-16">
            <span className="text-gray-500">불러오는 중...</span>
          </div>
        ) : myWaitingRoom ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mb-6">
              <i
                className="ri-user-search-line text-4xl text-teal-600"
                aria-hidden
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              팀원을 매칭중입니다...
            </h2>
            <p className="text-gray-500 mb-1">
              <span className="font-medium text-gray-700">
                {myWaitingRoom.name}
              </span>{" "}
              방에서 팀원이 모일 때까지 잠시만 기다려 주세요.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              현재 {myWaitingRoom.memberCount}명 / {myWaitingRoom.capacity}명
            </p>
            <ul className="flex flex-wrap justify-center gap-4 mb-8">
              {myWaitingRoom.members.map((member) => (
                <li key={member.userId} className="flex flex-col items-center">
                  <span
                    className="w-14 h-14 rounded-full bg-teal-500 text-white flex items-center justify-center text-lg font-semibold shrink-0 border-2 border-white shadow"
                    aria-hidden
                  >
                    {member.nickname.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-gray-700 mt-2 truncate max-w-[100px]">
                    {member.nickname}
                  </span>
                </li>
              ))}
              {Array.from({
                length: myWaitingRoom.capacity - myWaitingRoom.members.length,
              }).map((_, i) => (
                <li key={`empty-${i}`} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <i
                      className="ri-user-add-line text-2xl text-gray-400"
                      aria-hidden
                    />
                  </div>
                  <span className="text-sm text-gray-400 mt-2">대기 중</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/matching-rooms")}
                className="py-2.5 px-6 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                매칭방 목록
              </button>
              <button
                type="button"
                onClick={() => setLeaveConfirmRoomId(myWaitingRoom.id)}
                disabled={actionRoomId === myWaitingRoom.id}
                className="py-2.5 px-6 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
              >
                {actionRoomId === myWaitingRoom.id ? "처리 중..." : "방 나가기"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 왼쪽: 포트폴리오 | 오른쪽: 채팅/투표 토글 */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 lg:h-[calc(100vh-6rem)] min-h-[24rem]">
              {/* 왼쪽: 포트폴리오 */}
              <div className="flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-0 order-2 lg:order-1">
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <i className="ri-pie-chart-line text-teal-500"></i>팀 투자
                    현황
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
                  {/* 투자 원금 및 손익 */}
                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ri-wallet-3-line text-xl"></i>
                      <h3 className="text-sm font-bold">투자 요약</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-teal-100">투자 원금</span>
                        <span className="font-bold">
                          {formatCurrency(
                            groupPortfolioData?.investmentAmount ?? 0,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-teal-100">현재 평가액</span>
                        <span className="font-bold">
                          {formatCurrency(groupPortfolioData?.totalValue ?? 0)}
                        </span>
                      </div>
                      <div className="border-t border-teal-400 pt-2 flex justify-between items-center text-sm">
                        <span className="text-teal-100">총 손익</span>
                        <div className="text-right">
                          <span
                            className={`font-bold ${
                              isProfit ? "text-yellow-300" : "text-red-200"
                            }`}
                          >
                            {isProfit ? "+" : ""}
                            {formatCurrency(
                              groupPortfolioData?.profitLoss ?? 0,
                            )}
                          </span>
                          <span
                            className={`text-xs ml-1 ${
                              isProfit ? "text-yellow-300" : "text-red-200"
                            }`}
                          >
                            {formatPercentage(
                              groupPortfolioData?.profitLossPercentage ?? 0,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 파이 차트 */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">
                      포트폴리오 구성
                    </h3>
                    <div className="flex items-center justify-center mb-3">
                      <svg viewBox="0 0 200 200" className="w-28 h-28">
                        {(groupPortfolioData?.holdings ?? []).map(
                          (holding, index) => {
                            const holdings = groupPortfolioData?.holdings ?? [];
                            const total = holdings.reduce(
                              (sum, h) => sum + h.currentValue,
                              0,
                            );
                            let startAngle = 0;
                            for (let i = 0; i < index; i++) {
                              startAngle +=
                                (holdings[i].currentValue / total) * 360;
                            }
                            const angle = (holding.currentValue / total) * 360;
                            const endAngle = startAngle + angle;
                            const startRad =
                              ((startAngle - 90) * Math.PI) / 180;
                            const endRad = ((endAngle - 90) * Math.PI) / 180;
                            const x1 = 100 + 80 * Math.cos(startRad);
                            const y1 = 100 + 80 * Math.sin(startRad);
                            const x2 = 100 + 80 * Math.cos(endRad);
                            const y2 = 100 + 80 * Math.sin(endRad);
                            const largeArc = angle > 180 ? 1 : 0;
                            const colors = [
                              "#14B8A6",
                              "#06B6D4",
                              "#8B5CF6",
                              "#EC4899",
                              "#F59E0B",
                              "#10B981",
                            ];
                            return (
                              <path
                                key={holding.id}
                                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[index % colors.length]}
                                opacity="0.9"
                              />
                            );
                          },
                        )}
                        <circle cx="100" cy="100" r="50" fill="white" />
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(groupPortfolioData?.holdings ?? []).map(
                        (holding, index) => {
                          const colors = [
                            "bg-teal-500",
                            "bg-cyan-500",
                            "bg-purple-500",
                            "bg-pink-500",
                            "bg-amber-500",
                            "bg-green-500",
                          ];
                          const total = (
                            groupPortfolioData?.holdings ?? []
                          ).reduce((sum, h) => sum + h.currentValue, 0);
                          const percentage =
                            total > 0
                              ? ((holding.currentValue / total) * 100).toFixed(
                                  1,
                                )
                              : "0";
                          return (
                            <div
                              key={holding.id}
                              className="flex items-center gap-1.5"
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  colors[index % colors.length]
                                }`}
                              ></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">
                                  {holding.stockName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {percentage}%
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* 보유 종목 리스트 */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-gray-900">
                      보유 종목
                    </h3>
                    {(groupPortfolioData?.holdings ?? []).map((holding) => {
                      const profitLoss =
                        holding.currentValue -
                        holding.averagePrice * holding.quantity;
                      const profitLossPercentage =
                        (profitLoss /
                          (holding.averagePrice * holding.quantity)) *
                        100;
                      const isProfit = profitLoss >= 0;
                      const isSelected = selectedStock === holding.id;
                      return (
                        <div
                          key={holding.id}
                          onClick={() =>
                            setSelectedStock(isSelected ? null : holding.id)
                          }
                          className={`rounded-xl p-3 border transition-all cursor-pointer ${
                            isSelected
                              ? "border-teal-500 ring-2 ring-teal-200 bg-teal-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate">
                                {holding.stockName}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {holding.quantity}주 ·{" "}
                                {formatCurrency(holding.currentPrice)}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                                isProfit ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {formatPercentage(profitLossPercentage)}
                            </p>
                          </div>
                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSellVoteModalHolding(holding);
                                setSellVoteQuantity(holding.quantity);
                                setSellVoteReason("");
                              }}
                              className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                            >
                              <i className="ri-arrow-down-line mr-1"></i>
                              매도 투표 생성
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 오른쪽: 채팅 위 헤더(별도 행) + 채팅 블록 카드 — 겹침 방지 */}
              <div className="flex flex-col min-h-0 order-1 lg:order-2">
                {/* 채팅 위 헤더: 고정 높이, 본문과 겹치지 않음 */}
                <header className="flex-none shrink-0 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-teal-50 border border-gray-200 border-b-0 rounded-t-2xl rounded-b-none shadow-sm">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-bold text-gray-800 shrink-0">
                      채팅 · 투표
                    </span>
                    {myRooms.length > 1 && (
                      <select
                        value={selectedRoomId ?? ""}
                        onChange={(e) => {
                          const next = e.target.value || null;
                          setSelectedRoomId(next);
                          if (typeof localStorage !== "undefined") {
                            if (next)
                              localStorage.setItem(
                                STORAGE_KEY_SELECTED_ROOM,
                                next,
                              );
                            else
                              localStorage.removeItem(
                                STORAGE_KEY_SELECTED_ROOM,
                              );
                          }
                        }}
                        className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-0 max-w-[12rem]"
                        aria-label="채팅방 선택"
                      >
                        {myRooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name} ({room.memberCount}/{room.capacity})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex bg-white rounded-full p-1 shadow border border-gray-300 flex-1 min-w-0 max-w-[14rem]">
                    <button
                      type="button"
                      onClick={() => setRightPanelTab("chat")}
                      className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        rightPanelTab === "chat"
                          ? "bg-teal-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <i className="ri-chat-3-line mr-1" aria-hidden />
                      채팅
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelTab("vote")}
                      className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
                        rightPanelTab === "vote"
                          ? "bg-teal-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <i className="ri-checkbox-circle-line" aria-hidden />
                      투표
                      {votes.filter((v) => v.status === "ongoing").length >
                        0 && (
                        <span
                          className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                            rightPanelTab === "vote"
                              ? "bg-white/20 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {votes.filter((v) => v.status === "ongoing").length}
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGroupInfoModal(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-semibold whitespace-nowrap py-1 px-2"
                  >
                    채팅방 정보
                  </button>
                </header>

                {/* 채팅 블록 카드: 헤더 아래만 차지, 겹치지 않음 */}
                <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden bg-white rounded-b-2xl rounded-t-none border border-t-0 border-gray-200 shadow-sm">
                  {rightPanelTab === "chat" && (
                    <>
                      {chatError && (
                        <div className="flex-shrink-0 px-4 py-3 bg-amber-50 border-b border-amber-200">
                          <p className="text-sm text-amber-800">{chatError}</p>
                        </div>
                      )}
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4">
                        {messages.map((msg) => {
                          const isMine = msg.userId === currentUserId;
                          return (
                          <div key={msg.id}>
                            {msg.type === "user" && (
                              <div
                                className={`flex gap-3 ${
                                  isMine ? "flex-row-reverse justify-end" : ""
                                }`}
                              >
                                <span
                                  className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                  aria-hidden
                                >
                                  {msg.userNickname.charAt(0)}
                                </span>
                                <div className={`flex-1 min-w-0 ${isMine ? "flex flex-col items-end" : ""}`}>
                                  <div className={`flex items-center gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {msg.userNickname}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                  <div
                                    className={`rounded-2xl px-4 py-3 shadow-sm border w-[320px] min-w-[320px] box-border ${
                                      isMine
                                        ? "bg-teal-500 text-white border-teal-500 rounded-tr-sm"
                                        : "bg-white border-gray-100 rounded-tl-sm"
                                    }`}
                                  >
                                    <p className={`text-sm whitespace-pre-wrap ${isMine ? "text-white" : "text-gray-800"}`}>
                                      {msg.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === "trade" && msg.tradeData && (
                              <div
                                className={`flex gap-3 ${
                                  isMine ? "flex-row-reverse justify-end" : ""
                                }`}
                              >
                                <span
                                  className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                  aria-hidden
                                >
                                  {msg.userNickname.charAt(0)}
                                </span>
                                <div className={`flex-1 min-w-0 ${isMine ? "flex flex-col items-end" : ""}`}>
                                  <div className={`flex items-center gap-2 mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {msg.userNickname}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                  <div
                                    onClick={() =>
                                      handleTradeCardClick(
                                        msg.tradeData,
                                        msg.userNickname || "",
                                      )
                                    }
                                    className={`rounded-2xl p-4 shadow-sm border w-[320px] min-w-[320px] box-border cursor-pointer hover:shadow-md transition-shadow ${
                                      isMine
                                        ? "bg-teal-500 border-teal-500 rounded-tr-sm"
                                        : "bg-gradient-to-br from-teal-50 to-teal-100 rounded-tl-sm border-teal-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-3">
                                      <div
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                          msg.tradeData.action === "매수"
                                            ? "bg-red-500 text-white"
                                            : "bg-blue-500 text-white"
                                        }`}
                                      >
                                        {msg.tradeData.action} 계획
                                      </div>
                                    </div>
                                    <div className="space-y-2 mb-3">
                                      <div className="flex justify-between">
                                        <span className={`text-sm ${isMine ? "text-teal-100" : "text-gray-600"}`}>
                                          종목
                                        </span>
                                        <span className={`text-sm font-semibold ${isMine ? "text-white" : "text-gray-900"}`}>
                                          {msg.tradeData.stockName}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className={`text-sm ${isMine ? "text-teal-100" : "text-gray-600"}`}>
                                          수량
                                        </span>
                                        <span className={`text-sm font-semibold ${isMine ? "text-white" : "text-gray-900"}`}>
                                          {msg.tradeData.quantity}주
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className={`text-sm ${isMine ? "text-teal-100" : "text-gray-600"}`}>
                                          희망 가격
                                        </span>
                                        <span className={`text-sm font-semibold ${isMine ? "text-white" : "text-gray-900"}`}>
                                          {formatCurrency(
                                            msg.tradeData.pricePerShare,
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className={`text-sm ${isMine ? "text-teal-100" : "text-gray-600"}`}>
                                          주문 금액
                                        </span>
                                        <span className={`text-sm font-bold ${isMine ? "text-teal-100" : "text-teal-600"}`}>
                                          {formatCurrency(
                                            msg.tradeData.totalAmount,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className={`border-t pt-3 mb-3 ${isMine ? "border-teal-400" : "border-teal-200"}`}>
                                      <p className={`text-sm ${isMine ? "text-white" : "text-gray-700"}`}>
                                        {msg.tradeData.reason}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.tradeData.tags?.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className={`px-2 py-1 text-xs font-medium rounded-full ${isMine ? "bg-white/20 text-white" : "bg-white text-teal-600"}`}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                      {/* 채팅 입력 */}
                      <div className="flex-shrink-0 border-t border-gray-200 p-4">
                        {isTournamentEnded ? (
                          <button
                            onClick={() => navigate("/feedback-report")}
                            className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-teal-600 hover:to-teal-700 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <i className="ri-file-chart-line"></i>
                            피드백 리포트 보기
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleTradeShare}
                              className="w-full py-2.5 mb-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-pink-600 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <i className="ri-stock-line"></i>
                              매수/매도 계획 공유
                            </button>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleSendMessage()
                                }
                                placeholder={
                                  groupId == null
                                    ? myRooms.length === 0 && !myRoomsLoading
                                      ? "참가 중인 채팅방이 없습니다. 매칭방에서 팀에 참가해 주세요."
                                      : "채팅방 정보를 불러오는 중..."
                                    : "메시지 입력..."
                                }
                                disabled={
                                  groupId == null || sending || !!chatError
                                }
                                className="flex-1 px-3 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                              <button
                                type="button"
                                onClick={handleSendMessage}
                                disabled={
                                  groupId == null || sending || !!chatError
                                }
                                className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center hover:bg-teal-600 cursor-pointer transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <i className="ri-send-plane-fill text-white text-lg"></i>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {rightPanelTab === "vote" && (
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                      {votes.length === 0 ? (
                        <div className="text-center py-12">
                          <i className="ri-checkbox-circle-line text-4xl text-gray-300 mb-2"></i>
                          <p className="text-sm text-gray-500">
                            진행 중인 투표가 없습니다
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {votes.map((vote) => (
                            <div
                              key={vote.id}
                              className={`rounded-xl p-4 border ${
                                vote.status === "passed"
                                  ? "border-green-300 bg-green-50"
                                  : vote.status === "rejected"
                                    ? "border-red-300 bg-red-50"
                                    : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                    aria-hidden
                                  >
                                    {vote.proposerName.charAt(0)}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-gray-900 block truncate">
                                      {vote.proposerName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {vote.expiresAt}
                                    </span>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${
                                    vote.type === "매수"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-blue-100 text-blue-600"
                                  }`}
                                >
                                  {vote.type}
                                </span>
                              </div>
                              <div className="bg-white/80 rounded-lg p-3 mb-2">
                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                  {vote.stockName}
                                </h3>
                                <div className="flex justify-between text-xs text-gray-600 mt-1">
                                  <span>{vote.quantity}주</span>
                                  <span>
                                    제안가 {formatCurrency(vote.proposedPrice)}
                                  </span>
                                </div>
                                {vote.executionPrice != null && (
                                  <div className="text-xs text-teal-600 font-semibold mt-0.5">
                                    체결가 {formatCurrency(vote.executionPrice)}
                                  </div>
                                )}
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {vote.reason}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
                                <span className="text-green-600 font-medium">
                                  찬성 {getVoteCount(vote, "찬성")}
                                </span>
                                <span className="text-red-600 font-medium">
                                  반대 {getVoteCount(vote, "반대")}
                                </span>
                                <span className="text-gray-500 font-medium">
                                  보류 {getVoteCount(vote, "보류")}
                                </span>
                                <span className="text-gray-400">
                                  {vote.votes.length}/{CAPACITY}
                                </span>
                              </div>
                              {vote.status === "ongoing" ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVote(vote.id, "찬성")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                                      getUserVote(vote) === "찬성"
                                        ? "bg-green-500 text-white"
                                        : "bg-green-100 text-green-600 hover:bg-green-200"
                                    }`}
                                  >
                                    찬성
                                  </button>
                                  <button
                                    onClick={() => handleVote(vote.id, "보류")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                                      getUserVote(vote) === "보류"
                                        ? "bg-gray-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    보류
                                  </button>
                                  <button
                                    onClick={() => handleVote(vote.id, "반대")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                                      getUserVote(vote) === "반대"
                                        ? "bg-red-500 text-white"
                                        : "bg-red-100 text-red-600 hover:bg-red-200"
                                    }`}
                                  >
                                    반대
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className={`py-2 rounded-lg text-xs font-bold text-center ${
                                    vote.status === "passed"
                                      ? "bg-green-500 text-white"
                                      : vote.status === "rejected"
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-300 text-gray-600"
                                  }`}
                                >
                                  {vote.status === "passed"
                                    ? "✓ 통과"
                                    : vote.status === "rejected"
                                      ? "✗ 부결"
                                      : "만료"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 방 나가기 확인 모달 (팀원 매칭 대기 중일 때) */}
      {leaveConfirmRoomId && myWaitingRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <i
                className="ri-error-warning-line text-2xl text-amber-600"
                aria-hidden
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
              방에서 나가시겠습니까?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              나가시면 해당 방의 팀원 매칭에서 제외됩니다.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLeaveConfirmRoomId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleLeaveFromChat(leaveConfirmRoomId)}
                disabled={actionRoomId === leaveConfirmRoomId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
              >
                {actionRoomId === leaveConfirmRoomId ? "처리 중..." : "나가기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매도 투표 생성 모달 */}
      {sellVoteModalHolding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              매도 투표 생성
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종목
                </label>
                <p className="text-sm text-gray-900 font-semibold">
                  {sellVoteModalHolding.stockName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매도 수량 (최대 {sellVoteModalHolding.quantity}주)
                </label>
                <input
                  type="number"
                  min={1}
                  max={sellVoteModalHolding.quantity}
                  value={sellVoteQuantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v))
                      setSellVoteQuantity(
                        Math.min(
                          sellVoteModalHolding.quantity,
                          Math.max(1, v),
                        ),
                      );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  매도 이유
                </label>
                <textarea
                  value={sellVoteReason}
                  onChange={(e) => setSellVoteReason(e.target.value)}
                  placeholder="매도 사유를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setSellVoteModalHolding(null);
                  setSelectedStock(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={groupId == null || sellVoteSubmitting}
                onClick={async () => {
                  if (groupId == null || sellVoteSubmitting) return;
                  setSellVoteSubmitting(true);
                  const reason =
                    sellVoteReason.trim() ||
                    `${sellVoteModalHolding.stockName} 매도 제안입니다.`;
                  try {
                    const res = await createVote(groupId, {
                      type: "매도",
                      stockName: sellVoteModalHolding.stockName,
                      stockCode: sellVoteModalHolding.stockCode,
                      quantity: sellVoteQuantity,
                      proposedPrice: sellVoteModalHolding.currentPrice,
                      reason,
                    });
                    if (!res.success) {
                      alert(res.message ?? "투표 생성에 실패했습니다.");
                      return;
                    }
                    const updated = await getVotes(groupId);
                    setVotes(updated);
                    setSellVoteModalHolding(null);
                    setSelectedStock(null);
                    setRightPanelTab("vote");
                  } catch (e) {
                    alert("투표 생성에 실패했습니다.");
                  } finally {
                    setSellVoteSubmitting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sellVoteSubmitting ? "생성 중..." : "투표 생성"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매수/매도 계획 공유 모달 */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              매수/매도 계획 공유
            </h3>
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
                  navigate("/mock-investment");
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
              과반수 찬성으로{" "}
              <span className="font-bold">{passedVote.stockName}</span>{" "}
              {passedVote.type} 주문이 체결되었습니다.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">종목</span>
                <span className="text-sm font-semibold">
                  {passedVote.stockName}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">유형</span>
                <span
                  className={`text-sm font-semibold ${
                    passedVote.type === "매수"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {passedVote.type}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">수량</span>
                <span className="text-sm font-semibold">
                  {passedVote.quantity}주
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">체결가</span>
                <span className="text-sm font-semibold">
                  {formatCurrency(
                    passedVote.executionPrice ?? passedVote.proposedPrice,
                  )}
                </span>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
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
                <span
                  className="w-16 h-16 rounded-full bg-teal-500 text-white flex items-center justify-center text-xl font-bold shrink-0"
                  aria-hidden
                >
                  {(groupPortfolioData?.groupName ?? "").charAt(0)}
                </span>
                <div>
                  <h4 className="text-base font-bold text-gray-900">
                    {groupPortfolioData?.groupName ?? "-"}
                  </h4>
                  <span className="text-sm text-gray-500">멤버 5명</span>
                </div>
              </div>

              {/* 투자 정보 */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <i className="ri-wallet-3-line text-teal-600 text-lg"></i>
                  <span className="text-sm font-semibold text-gray-700">
                    팀 투자 현황
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      팀 투자금(실시간)
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(
                        groupPortfolioData?.investmentAmount ?? 0,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">전체 자산</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(groupPortfolioData?.totalValue ?? 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-teal-200">
                    <span className="text-sm text-gray-600">투자 손익</span>
                    <div className="text-right">
                      <span
                        className={`text-base font-bold ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isProfit ? "+" : ""}
                        {formatCurrency(groupPortfolioData?.profitLoss ?? 0)}
                      </span>
                      <span
                        className={`text-xs ml-2 ${
                          isProfit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatPercentage(
                          groupPortfolioData?.profitLossPercentage ?? 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowGroupInfoModal(false);
                  navigate("/group-portfolio");
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
