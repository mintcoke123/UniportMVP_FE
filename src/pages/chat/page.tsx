import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/feature/Header";
import { useAuth } from "../../contexts/AuthContext";
import {
  getChatMessages,
  sendChatMessage,
  sendTradeMessage,
  getChatWebSocketUrl,
  getVotes,
  submitVote as submitVoteApi,
  createVote,
  cancelPendingVote,
  getGroupPortfolio,
  getMyMatchingRooms,
  getMatchingRooms,
  leaveMatchingRoom,
  startMatchingRoom,
  usePriceWebSocket,
} from "../../services";
import type {
  ChatMessageItem,
  VoteItem,
  GroupPortfolioResponse,
  MatchingRoom,
} from "../../types";
import type { ApiError } from "../../services/apiClient";
import { getPieSlicePathD } from "../../utils/portfolioPiePath";

const CAPACITY = 3;

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"chat" | "vote">("chat");
  const [votes, setVotes] = useState<VoteItem[]>([]);
  const [groupPortfolioData, setGroupPortfolioData] =
    useState<GroupPortfolioResponse | null>(null);
  const [portfolioLoadError, setPortfolioLoadError] = useState(false);

  /** 팀원 매칭 대기: 참가한 방 중 멤버 부족한 방 → "팀원을 매칭중입니다..." 표시 */
  const [matchingRooms, setMatchingRooms] = useState<MatchingRoom[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [leaveConfirmRoomId, setLeaveConfirmRoomId] = useState<string | null>(
    null,
  );
  const [actionRoomId, setActionRoomId] = useState<string | null>(null);
  /** GET 채팅 목록 403 시 표시 (해당 그룹 멤버 아님) */
  const [chatError, setChatError] = useState<string | null>(null);
  /** WebSocket 연결 여부. false면 메시지 전송 시 REST로 fallback */
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  /** 폴링 시 getGroupPortfolio 과호출 방지: 이미 알고 있는 executed vote id 집합 */
  const executedIdsRef = useRef<Set<number>>(new Set());

  const isInRoom = (room: MatchingRoom) =>
    room.isJoined === true ||
    (Boolean(user) && room.members.some((m) => m.userId === user!.id));
  /** 아직 모의투자를 시작하지 않은 방 → '팀원을 매칭중입니다' 대기 화면. started면 채팅 본문 표시 */
  const myWaitingRoom = matchingRooms.find(
    (room) => isInRoom(room) && room.status !== "started",
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

  /** 팀 포트폴리오 로드(거래 가능 현금 등). 실패 시 portfolioLoadError 설정 */
  const fetchGroupPortfolio = (gid: number) => {
    getGroupPortfolio(gid)
      .then((data) => {
        setGroupPortfolioData(data);
        setPortfolioLoadError(false);
      })
      .catch(() => {
        setGroupPortfolioData(null);
        setPortfolioLoadError(true);
      });
  };

  /** 투표에 올라온 종목코드만 6자리로 정규화해 WebSocket 구독용으로 사용 */
  const normalizeStockCode = (c: string | undefined): string => {
    if (!c || !String(c).trim()) return "";
    const t = String(c).trim();
    return t.length >= 6 ? t : t.padStart(6, "0");
  };
  /** 투표 + 보유종목 종목코드 통합 (WebSocket 구독용) */
  const subscribeStockCodes = useMemo(() => {
    const fromVotes = votes
      .map((v) => normalizeStockCode(v.stockCode))
      .filter((c) => c.length === 6);
    const fromHoldings = (groupPortfolioData?.holdings ?? [])
      .map((h) => normalizeStockCode(h.stockCode))
      .filter((c) => c.length === 6);
    return [...new Set([...fromVotes, ...fromHoldings])];
  }, [votes, groupPortfolioData?.holdings]);
  const realtimePrices = usePriceWebSocket(subscribeStockCodes);

  /** trade 메시지 clientMessageId 기준 중복 제거 (동일 제안 2번 저장 시 첫 메시지만 표시) */
  const dedupedMessages = useMemo(() => {
    const seen = new Set<string | number>();
    return messages.filter((m) => {
      const key =
        m.type === "trade" && m.tradeData?.clientMessageId
          ? m.tradeData.clientMessageId
          : m.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  /** 진행 중(투표/대기/주문중) 상태: ongoing, pending, executing, passed */
  const isVoteActive = (s: VoteItem["status"]) =>
    s === "ongoing" || s === "pending" || s === "executing" || s === "passed";

  /** 해당 종목에 동일 유형(매수/매도) 진행 중인 투표가 있으면 true */
  const hasOngoingVoteForStock = (
    stockCode: string | undefined,
    type: "매수" | "매도",
  ) => {
    const norm = (s: string | undefined) => String(s ?? "").trim();
    return votes.some(
      (v) =>
        isVoteActive(v.status) &&
        norm(v.stockCode) === norm(stockCode) &&
        v.type === type,
    );
  };

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
          setSelectedRoomId((prev) => {
            const first =
              list.find((r) => r.status === "started") ??
              list.find((r) => r.status === "full") ??
              list[0];
            return prev && list.some((r) => r.id === prev) ? prev : first.id;
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
            const first =
              joined.find((r) => r.status === "started") ??
              joined.find((r) => r.status === "full") ??
              joined[0];
            return prev && joined.some((r) => r.id === prev) ? prev : first.id;
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
            const first =
              joined.find((r) => r.status === "started") ??
              joined.find((r) => r.status === "full") ??
              joined[0];
            return prev && joined.some((r) => r.id === prev) ? prev : first.id;
          });
        });
      })
      .finally(() => setMyRoomsLoading(false));
  }, [user?.id, !!myWaitingRoom]);

  /** 개인방(capacity=1)이면 채팅 없이 /solo로 리다이렉트 */
  useEffect(() => {
    if (myRoomsLoading || !selectedRoom) return;
    if (selectedRoom.capacity === 1) {
      navigate("/solo", { replace: true });
    }
  }, [myRoomsLoading, selectedRoom?.id, selectedRoom?.capacity, navigate]);

  useEffect(() => {
    getMatchingRooms().then((list) => {
      setMatchingRooms(list);
      setMatchingLoading(false);
    });
  }, []);

  // WebSocket 채팅: groupId 변경 시 연결/해제, 수신 메시지 실시간 반영
  useEffect(() => {
    if (myWaitingRoom) return;
    if (groupId == null || !user) {
      setMessages([]);
      setVotes([]);
      setGroupPortfolioData(null);
      setChatError(null);
      setWsConnected(false);
      const ws = wsRef.current;
      if (ws) {
        ws.close();
        wsRef.current = null;
      }
      return;
    }

    const url = getChatWebSocketUrl(groupId);
    if (!url) {
      setChatError(null);
      getChatMessages(groupId)
        .then((msgs) => setMessages(msgs))
        .catch((e) => {
          setMessages([]);
          setChatError(e?.message ?? "채팅을 불러올 수 없습니다.");
        });
      getVotes(groupId).then(setVotes);
      fetchGroupPortfolio(groupId);
      return;
    }

    setChatError(null);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      getChatMessages(groupId)
        .then((msgs) => setMessages(msgs))
        .catch((e) => {
          setMessages([]);
          setChatError(e?.message ?? "이 그룹의 멤버가 아닙니다.");
        });
      getVotes(groupId).then(setVotes);
      fetchGroupPortfolio(groupId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as Record<
          string,
          unknown
        >;
        const type = (data.type as string) || "user";
        if (type === "vote_update" && groupId != null) {
          getVotes(groupId).then(setVotes);
          return;
        }
        const id = typeof data.id === "number" ? data.id : null;
        if (id == null) return;
        const userId = typeof data.userId === "number" ? data.userId : 0;
        const userNickname =
          typeof data.userNickname === "string" ? data.userNickname : "";
        const message =
          typeof data.message === "string" ? data.message : undefined;
        const timestamp =
          typeof data.timestamp === "string" ? data.timestamp : "";
        const tradeData = data.tradeData ?? null;
        const executionData = data.executionData ?? null;
        const item: ChatMessageItem = {
          id,
          type: type === "trade" ? "trade" : type === "execution" ? "execution" : "user",
          userId,
          userNickname,
          message: message ?? null,
          timestamp,
          tradeData: tradeData as ChatMessageItem["tradeData"],
          executionData: executionData as ChatMessageItem["executionData"],
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === item.id)) return prev;
          return [...prev, item];
        });
        if (type === "trade" && groupId != null) getVotes(groupId).then(setVotes);
        if (type === "execution" && groupId != null) {
          getVotes(groupId).then(setVotes);
          fetchGroupPortfolio(groupId);
        }
      } catch {
        // ignore non-JSON or invalid payloads
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };
    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [myWaitingRoom, groupId, user?.id]);

  /** groupId 변경 시 executed 기준 집합을 현재 votes 기준으로 초기화 */
  useEffect(() => {
    executedIdsRef.current = new Set(
      votes.filter((v) => v.status === "executed").map((v) => v.id),
    );
  }, [groupId]);

  // pending/executing/passed 투표가 있으면 10초마다 getVotes 폴링; 새로 executed 된 경우에만 포트폴리오 갱신
  useEffect(() => {
    if (groupId == null) return;
    const hasActive = votes.some(
      (v) =>
        v.status === "pending" ||
        v.status === "executing" ||
        v.status === "passed",
    );
    if (!hasActive) return;
    const interval = setInterval(() => {
      getVotes(groupId).then((updated) => {
        setVotes(updated);
        const updatedExecutedIds = new Set(
          updated.filter((v) => v.status === "executed").map((v) => v.id),
        );
        const prev = executedIdsRef.current;
        let hasNew = false;
        for (const id of updatedExecutedIds) {
          if (!prev.has(id)) {
            hasNew = true;
            break;
          }
        }
        executedIdsRef.current = updatedExecutedIds;
        if (hasNew) {
          fetchGroupPortfolio(groupId);
          getChatMessages(groupId).then(setMessages);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [votes, groupId]);

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
  /** 투표 제출 중인 항목 ID — 중복 클릭 방지 */
  const [votingVoteId, setVotingVoteId] = useState<number | null>(null);
  /** 대기 취소 요청 중인 투표 ID */
  const [cancellingVoteId, setCancellingVoteId] = useState<number | null>(null);
  /** 처분 투표 생성 중인 보유 종목 ID — 중복 생성 방지 */
  const [creatingVoteStockId, setCreatingVoteStockId] = useState<number | null>(
    null,
  );
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  /** 매도 수량 입력란 문자열 (선택된 보유종목 변경 시 해당 수량으로 초기화, 전송 시에만 숫자 파싱) */
  const [sellQuantityInput, setSellQuantityInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedHolding = groupPortfolioData?.holdings?.find((h) => h.id === selectedStock);
  useEffect(() => {
    if (selectedHolding != null) setSellQuantityInput(String(selectedHolding.quantity ?? 0));
  }, [selectedStock, selectedHolding?.quantity]);

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

    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          userId: currentUserId,
          nickname: currentUserName,
          message: text,
        }),
      );
      setNewMessage("");
      return;
    }

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
    if (votingVoteId === voteId) return;
    const vote = votes.find((v) => v.id === voteId);
    if (vote && getUserVote(vote) === voteType) return;

    setVotingVoteId(voteId);
    submitVoteApi(groupId, voteId, voteType)
      .then((res) => {
        if (!res.success) {
          alert(res.message ?? "투표 반영에 실패했습니다.");
          return;
        }
        const responseStatus = res.vote?.status;
        if (responseStatus) {
          setVotes((prev) =>
            prev.map((v) =>
              v.id === voteId
                ? { ...v, status: responseStatus as VoteItem["status"] }
                : v,
            ),
          );
        }
        return getVotes(groupId!).then((updated) => {
          setVotes(updated);
          const successVote = updated.find(
            (v) => v.id === voteId && v.status === "executed",
          );
          if (successVote) {
            setPassedVote(successVote);
            setShowVoteSuccessModal(true);
            fetchGroupPortfolio(groupId!);
            getChatMessages(groupId!).then(setMessages);
          }
        });
      })
      .catch(() => alert("투표 반영에 실패했습니다."))
      .finally(() => setVotingVoteId(null));
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

  /** 거래 가능 현금(원, 정수). totalValue - 보유 종목 평가합. 미체결 주문 예약 차감은 백엔드에 없음. */
  const availableCash =
    groupPortfolioData != null
      ? Math.max(
          0,
          Math.floor(
            (groupPortfolioData.totalValue ?? 0) -
              (groupPortfolioData.holdings ?? []).reduce(
                (s, h) => s + (h.currentValue ?? 0),
                0,
              ),
          ),
        )
      : null;

  const handleTradeCardClick = (
    _tradeData: {
      action: "매수" | "매도";
      stockName: string;
      quantity: number;
      pricePerShare: number;
      reason: string;
    },
    _userNickname: string,
  ) => {
    // 거래 계획 카드 클릭 시 투표 탭으로 이동 (투표는 공유 시 백엔드에서 이미 생성됨)
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
              {myWaitingRoom.memberCount >= Math.min(2, myWaitingRoom.capacity ?? 3) && (
                <span className="block mt-1 text-teal-600 font-medium">
                  {myWaitingRoom.capacity === 1
                    ? "모의투자를 시작할 수 있습니다."
                    : "2명 이상이면 모의투자를 시작할 수 있습니다."}
                </span>
              )}
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
            <div className="flex flex-wrap gap-3 justify-center">
              {myWaitingRoom.memberCount >= Math.min(2, myWaitingRoom.capacity ?? 3) && (
                <button
                  type="button"
                  onClick={async () => {
                    setActionRoomId(myWaitingRoom.id);
                    try {
                      await startMatchingRoom(myWaitingRoom.id);
                      navigate("/mock-investment");
                    } catch (e) {
                      const err = e as ApiError;
                      alert(err.message ?? "모의투자 시작에 실패했습니다.");
                    } finally {
                      setActionRoomId(null);
                    }
                  }}
                  disabled={actionRoomId === myWaitingRoom.id}
                  className="py-2.5 px-6 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {actionRoomId === myWaitingRoom.id ? "처리 중..." : "모의투자 시작"}
                </button>
              )}
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
                  {/* 거래 가능 현금 (항상 표시) */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-gray-600 text-sm font-medium">
                        거래 가능 현금
                      </span>
                      {groupId == null ? (
                        <span className="text-gray-400 text-sm">—</span>
                      ) : availableCash !== null ? (
                        <span className="text-lg font-bold text-gray-900">
                          {availableCash.toLocaleString("ko-KR")}원
                        </span>
                      ) : portfolioLoadError ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-amber-600">
                            현금 정보를 불러오지 못했습니다
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              groupId != null && fetchGroupPortfolio(groupId)
                            }
                            className="text-xs font-medium text-teal-600 hover:text-teal-700 cursor-pointer"
                          >
                            재시도
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          거래 가능 현금 불러오는 중…
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 투자 원금 및 손익 — 클릭 시 포트폴리오 화면으로 */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate("/group-portfolio")}
                    onKeyDown={(e) => e.key === "Enter" && navigate("/group-portfolio")}
                    className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white cursor-pointer hover:from-teal-600 hover:to-teal-700 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <i className="ri-wallet-3-line text-xl"></i>
                      <h3 className="text-sm font-bold">투자 요약</h3>
                      <i className="ri-arrow-right-s-line text-teal-200 ml-auto" aria-hidden />
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
                            const getValue = (h: (typeof holdings)[0]) => {
                              const c = normalizeStockCode(h.stockCode);
                              const price = c
                                ? (realtimePrices[c]?.currentPrice ??
                                  h.currentPrice)
                                : h.currentPrice;
                              return price * (h.quantity ?? 0);
                            };
                            const total = holdings.reduce(
                              (sum, h) => sum + getValue(h),
                              0,
                            );
                            if (total <= 0) return null;
                            let startAngle = 0;
                            for (let i = 0; i < index; i++) {
                              startAngle +=
                                (getValue(holdings[i]) / total) * 360;
                            }
                            const angle = (getValue(holding) / total) * 360;
                            const cx = 100;
                            const cy = 100;
                            const r = 80;
                            const pathD = getPieSlicePathD(
                              cx,
                              cy,
                              r,
                              startAngle,
                              angle,
                            );
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
                                d={pathD}
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
                      const code = normalizeStockCode(holding.stockCode);
                      const rt = code ? realtimePrices[code] : undefined;
                      const currentPrice =
                        rt?.currentPrice ?? holding.currentPrice;
                      const currentValue =
                        currentPrice * (holding.quantity ?? 0);
                      const cost =
                        (holding.averagePrice ?? 0) * (holding.quantity ?? 0);
                      const profitLoss = cost > 0 ? currentValue - cost : 0;
                      const profitLossPercentage =
                        cost > 0 ? (profitLoss / cost) * 100 : 0;
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
                                {formatCurrency(currentPrice)}
                                {rt && (
                                  <span className="text-teal-600 ml-0.5">
                                    (실시간)
                                  </span>
                                )}
                              </span>
                            </div>
                            <p
                              className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                                isProfit ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              <span className="text-gray-500 font-normal">매수대비 </span>
                              {formatPercentage(profitLossPercentage)}
                            </p>
                          </div>
                          {isSelected && (
                            <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                            <button
                              type="button"
                              disabled={
                                groupId == null ||
                                creatingVoteStockId === holding.id ||
                                hasOngoingVoteForStock(
                                  holding.stockCode,
                                  "매도",
                                )
                              }
                              title={
                                hasOngoingVoteForStock(
                                  holding.stockCode,
                                  "매도",
                                )
                                  ? "이미 해당 종목에 대한 매도 투표가 진행 중입니다."
                                  : undefined
                              }
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  groupId == null ||
                                  creatingVoteStockId != null
                                )
                                  return;
                                if (
                                  hasOngoingVoteForStock(
                                    holding.stockCode,
                                    "매도",
                                  )
                                )
                                  return;
                                setCreatingVoteStockId(holding.id);
                                const reason = `${holding.stockName} 전량 시장가 매도 제안입니다. 현재 보유 수량 ${holding.quantity}주를 모두 처분하고자 합니다.`;
                                try {
                                  const res = await createVote(groupId, {
                                    type: "매도",
                                    stockName: holding.stockName,
                                    stockCode: holding.stockCode,
                                    quantity: holding.quantity,
                                    proposedPrice: currentPrice,
                                    reason,
                                  });
                                  if (res.success) {
                                    await sendTradeMessage(groupId, {
                                      action: "매도",
                                      stockName: holding.stockName,
                                      quantity: holding.quantity,
                                      pricePerShare: currentPrice,
                                      totalAmount: currentPrice * (holding.quantity ?? 0),
                                      reason,
                                      tags: ["처분"],
                                      voteId: res.voteId,
                                    }).catch(() => {});
                                    const updated = await getVotes(groupId);
                                    setVotes(updated);
                                    setMessages((prev) => {
                                      getChatMessages(groupId).then((list) => setMessages(list));
                                      return prev;
                                    });
                                    setSelectedStock(null);
                                    setRightPanelTab("vote");
                                  } else {
                                    alert(
                                      res.message ??
                                        "처분 투표 생성에 실패했습니다.",
                                    );
                                  }
                                } catch (e) {
                                  const msg =
                                    (e as ApiError)?.message ??
                                    "처분 투표 생성에 실패했습니다.";
                                  alert(msg);
                                } finally {
                                  setCreatingVoteStockId(null);
                                }
                              }}
                              className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {creatingVoteStockId === holding.id ? (
                                <>
                                  <i
                                    className="ri-loader-4-line mr-1 animate-spin"
                                    aria-hidden
                                  />
                                  생성 중...
                                </>
                              ) : hasOngoingVoteForStock(
                                  holding.stockCode,
                                  "매도",
                                ) ? (
                                <>
                                  <i
                                    className="ri-time-line mr-1"
                                    aria-hidden
                                  />
                                  매도 투표 진행 중
                                </>
                              ) : (
                                <>
                                  <i className="ri-arrow-down-line mr-1"></i>
                                  처분 투표 생성
                                </>
                              )}
                            </button>
                            {/* 매도 수량 입력 + 매도 투표 생성 (일부 수량 매도) */}
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600 whitespace-nowrap">매도 수량</label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder="1"
                                  value={sellQuantityInput}
                                  onChange={(e) => setSellQuantityInput(e.target.value.replace(/[^0-9]/g, ""))}
                                  className="w-20 py-1.5 px-2 text-sm border border-gray-300 rounded-lg"
                                />
                                <span className="text-xs text-gray-500">/ {holding.quantity}주</span>
                              </div>
                              {(() => {
                                const maxQ = holding.quantity ?? 0;
                                const parsed = parseInt(sellQuantityInput, 10);
                                const isValid = !Number.isNaN(parsed) && parsed >= 1 && parsed <= maxQ;
                                const sellQuantity = isValid ? parsed : 0;
                                return (
                              <button
                                type="button"
                                disabled={
                                  groupId == null ||
                                  creatingVoteStockId === holding.id ||
                                  hasOngoingVoteForStock(holding.stockCode, "매도") ||
                                  !isValid
                                }
                                title={hasOngoingVoteForStock(holding.stockCode, "매도") ? "이미 해당 종목에 대한 매도 투표가 진행 중입니다." : undefined}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (groupId == null || creatingVoteStockId != null || hasOngoingVoteForStock(holding.stockCode, "매도")) return;
                                  if (!isValid) return;
                                  setCreatingVoteStockId(holding.id);
                                  const reason = `${holding.stockName} ${sellQuantity}주 시장가 매도 제안입니다.`;
                                  try {
                                    const res = await createVote(groupId, {
                                      type: "매도",
                                      stockName: holding.stockName,
                                      stockCode: holding.stockCode,
                                      quantity: sellQuantity,
                                      proposedPrice: currentPrice,
                                      reason,
                                    });
                                    if (res.success) {
                                      await sendTradeMessage(groupId, {
                                        action: "매도",
                                        stockName: holding.stockName,
                                        quantity: sellQuantity,
                                        pricePerShare: currentPrice,
                                        totalAmount: currentPrice * sellQuantity,
                                        reason,
                                        tags: ["매도"],
                                        voteId: res.voteId,
                                      }).catch(() => {});
                                      getChatMessages(groupId).then(setMessages);
                                      const updated = await getVotes(groupId);
                                      setVotes(updated);
                                      setSelectedStock(null);
                                      setRightPanelTab("vote");
                                    } else {
                                      alert(res.message ?? "매도 투표 생성에 실패했습니다.");
                                    }
                                  } catch (err) {
                                    alert((err as ApiError)?.message ?? "매도 투표 생성에 실패했습니다.");
                                    } finally {
                                      setCreatingVoteStockId(null);
                                    }
                                  }}
                                className="w-full py-2 border-2 border-teal-500 text-teal-600 text-xs font-bold rounded-lg hover:bg-teal-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                매도 투표 생성
                              </button>
                                );
                              })()}
                            </div>
                            </div>
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
                        onChange={(e) =>
                          setSelectedRoomId(e.target.value || null)
                        }
                        className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-0 max-w-[12rem]"
                        aria-label="채팅방 선택"
                      >
                        {myRooms.map((room) => {
                          const gid = roomIdToGroupId(room.id);
                          const myTeamNum = user?.teamId != null && String(user.teamId).startsWith("team-")
                            ? parseInt(String(user.teamId).replace(/^team-/, ""), 10)
                            : null;
                          const isMyTeam = gid != null && myTeamNum != null && !Number.isNaN(myTeamNum) && gid === myTeamNum;
                          return (
                            <option key={room.id} value={room.id}>
                              {room.name} ({room.memberCount}/{room.capacity}){isMyTeam ? " (내 팀)" : ""}
                            </option>
                          );
                        })}
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
                      {votes.filter((v) => isVoteActive(v.status)).length >
                        0 && (
                        <span
                          className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                            rightPanelTab === "vote"
                              ? "bg-white/20 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {votes.filter((v) => isVoteActive(v.status)).length}
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
                      {groupId != null && !chatError && (
                        <div className="flex-shrink-0 px-4 py-1.5 border-b border-gray-100 flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-gray-300"}`}
                            aria-hidden
                          />
                          <span className="text-xs text-gray-500">
                            {wsConnected
                              ? "실시간 연결됨"
                              : "연결 중… (메시지는 저장됩니다)"}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 space-y-4">
                        {dedupedMessages.map((msg) => (
                          <div key={msg.id}>
                            {msg.type === "user" && (
                              <div className="flex gap-3">
                                <span
                                  className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                  aria-hidden
                                >
                                  {msg.userNickname.charAt(0)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-900">
                                      {msg.userNickname}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 inline-block max-w-xl">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                      {msg.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === "trade" && msg.tradeData && (
                              <div className="flex gap-3">
                                <span
                                  className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                  aria-hidden
                                >
                                  {msg.userNickname.charAt(0)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
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
                                    className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl rounded-tl-sm p-4 shadow-sm border border-teal-200 max-w-xl cursor-pointer hover:shadow-md transition-shadow"
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
                                        <span className="text-sm text-gray-600">
                                          종목
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {msg.tradeData.stockName}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">
                                          수량
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {msg.tradeData.quantity}주
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">
                                          희망 가격
                                        </span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          {formatCurrency(
                                            msg.tradeData.pricePerShare,
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">
                                          주문 금액
                                        </span>
                                        <span className="text-sm font-bold text-teal-600">
                                          {formatCurrency(
                                            msg.tradeData.totalAmount,
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="border-t border-teal-200 pt-3 mb-3">
                                      <p className="text-sm text-gray-700">
                                        {msg.tradeData.reason}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {(msg.tradeData.tags ?? []).map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-white text-teal-600 text-xs font-medium rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {msg.type === "execution" && msg.executionData && (
                              <div className="flex gap-3">
                                <span
                                  className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                  aria-hidden
                                >
                                  <i className="ri-check-line text-lg" aria-hidden />
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-400">
                                      {msg.timestamp}
                                    </span>
                                  </div>
                                  <div className="bg-green-50 rounded-2xl rounded-tl-sm p-4 shadow-sm border border-green-200 max-w-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                        {msg.executionData.action} 체결 완료
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-800">
                                      <span className="font-semibold">{msg.executionData.stockName}</span>
                                      {" "}{msg.executionData.quantity}주 · 체결가{" "}
                                      {formatCurrency(msg.executionData.executionPrice)}
                                    </p>
                                    {msg.userNickname && msg.userNickname !== "시스템" && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        제안: {msg.userNickname}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
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
                                vote.status === "passed" ||
                                vote.status === "executed"
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
                                    {vote.executionPrice != null
                                      ? `체결가: ${formatCurrency(vote.executionPrice)}`
                                      : vote.status === "pending" &&
                                          vote.orderStrategy === "CONDITIONAL"
                                        ? "시장가(체결 시점)"
                                        : `제안가: ${formatCurrency(vote.proposedPrice)}`}
                                  </span>
                                </div>
                                {(vote.orderStrategy === "LIMIT" &&
                                  vote.limitPrice != null) ||
                                (vote.orderStrategy === "CONDITIONAL" &&
                                  vote.triggerPrice != null) ? (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {vote.orderStrategy === "LIMIT"
                                      ? `희망가: ${formatCurrency(vote.limitPrice!)}`
                                      : `조건: ${vote.triggerDirection === "ABOVE" ? "이상" : "이하"} ${formatCurrency(vote.triggerPrice!)}원`}
                                    {vote.executionExpiresAt &&
                                      ` · 유효기간: ${vote.executionExpiresAt}`}
                                  </p>
                                ) : vote.executionExpiresAt ? (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    유효기간: {vote.executionExpiresAt}
                                  </p>
                                ) : null}
                                {(() => {
                                  const code = normalizeStockCode(
                                    vote.stockCode,
                                  );
                                  const rt = code
                                    ? realtimePrices[code]
                                    : undefined;
                                  if (!rt) return null;
                                  const ch = rt.change ?? 0;
                                  const cr = rt.changeRate ?? 0;
                                  const isUp = ch >= 0;
                                  return (
                                    <p
                                      className={`text-xs mt-1 font-medium ${isUp ? "text-red-600" : "text-blue-600"}`}
                                    >
                                      현재가 {formatCurrency(rt.currentPrice)} (
                                      {isUp ? "+" : ""}
                                      {Number(cr).toFixed(2)}%)
                                    </p>
                                  );
                                })()}
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
                                  {vote.votes.length}/
                                  {selectedRoom?.memberCount ??
                                    selectedRoom?.capacity ??
                                    vote.totalMembers}
                                </span>
                              </div>
                              {vote.status === "ongoing" ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={votingVoteId === vote.id}
                                    onClick={() => handleVote(vote.id, "찬성")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                      getUserVote(vote) === "찬성"
                                        ? "bg-green-500 text-white"
                                        : "bg-green-100 text-green-600 hover:bg-green-200"
                                    }`}
                                  >
                                    찬성
                                  </button>
                                  <button
                                    type="button"
                                    disabled={votingVoteId === vote.id}
                                    onClick={() => handleVote(vote.id, "보류")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                      getUserVote(vote) === "보류"
                                        ? "bg-gray-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    보류
                                  </button>
                                  <button
                                    type="button"
                                    disabled={votingVoteId === vote.id}
                                    onClick={() => handleVote(vote.id, "반대")}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                      getUserVote(vote) === "반대"
                                        ? "bg-red-500 text-white"
                                        : "bg-red-100 text-red-600 hover:bg-red-200"
                                    }`}
                                  >
                                    반대
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div
                                    className={`py-2 rounded-lg text-xs font-bold text-center ${
                                      vote.status === "executed"
                                        ? "bg-green-500 text-white"
                                        : vote.status === "rejected"
                                          ? "bg-red-500 text-white"
                                          : vote.status === "cancelled"
                                            ? "bg-gray-400 text-white"
                                            : "bg-gray-300 text-gray-600"
                                    }`}
                                  >
                                    {vote.status === "pending"
                                      ? "대기"
                                      : vote.status === "executing" ||
                                          vote.status === "passed"
                                        ? "주문 처리중"
                                        : vote.status === "executed"
                                          ? "✓ 체결"
                                          : vote.status === "rejected"
                                            ? "✗ 부결"
                                            : vote.status === "cancelled"
                                              ? "취소"
                                              : "만료"}
                                  </div>
                                  {vote.status === "pending" &&
                                    groupId != null && (
                                      <button
                                        type="button"
                                        disabled={cancellingVoteId === vote.id}
                                        onClick={async () => {
                                          if (
                                            groupId == null ||
                                            cancellingVoteId === vote.id
                                          )
                                            return;
                                          setCancellingVoteId(vote.id);
                                          try {
                                            const res = await cancelPendingVote(
                                              groupId,
                                              vote.id,
                                            );
                                            if (res.success) {
                                              const updated =
                                                await getVotes(groupId);
                                              setVotes(updated);
                                            } else {
                                              alert(
                                                res.message ??
                                                  "대기 취소에 실패했습니다.",
                                              );
                                            }
                                          } catch {
                                            alert("대기 취소에 실패했습니다.");
                                          } finally {
                                            setCancellingVoteId(null);
                                          }
                                        }}
                                        className="w-full py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                                      >
                                        {cancellingVoteId === vote.id
                                          ? "처리 중..."
                                          : "대기 취소"}
                                      </button>
                                    )}
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
