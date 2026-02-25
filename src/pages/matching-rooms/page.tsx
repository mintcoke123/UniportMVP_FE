import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/feature/Header";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMatchingRooms,
  createMatchingRoom,
  joinMatchingRoom,
  joinRoomByCode,
  leaveMatchingRoom,
  startMatchingRoom,
} from "../../services";
import type { MatchingRoom } from "../../types";

const CAPACITY = 3;

export default function MatchingRoomsPage() {
  const navigate = useNavigate();
  const { updateUserTeam, user } = useAuth();
  const [rooms, setRooms] = useState<MatchingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionRoomId, setActionRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<"solo" | "team">("team");
  const [newRoomVisibility, setNewRoomVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [creating, setCreating] = useState(false);
  /** 생성 성공 후 초대코드 표시용. 설정되면 만들기 모달 안에서 성공 UI 표시. capacity 1이면 초대코드 블록 생략 */
  const [createSuccessRoom, setCreateSuccessRoom] = useState<{ inviteCode: string; visibility: string; capacity?: number } | null>(null);
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinByCodeLoading, setJoinByCodeLoading] = useState(false);
  const [joinByCodeError, setJoinByCodeError] = useState<string | null>(null);
  /** 나가기 확인 모달에 표시할 방 id (null이면 모달 비표시) */
  const [leaveConfirmRoomId, setLeaveConfirmRoomId] = useState<string | null>(
    null
  );

  useEffect(() => {
    getMatchingRooms().then((list) => {
      setRooms(list);
      setLoading(false);
    });
  }, []);

  const handleJoin = async (roomId: string) => {
    if (!user) return;
    if (hasTeam) {
      alert("이미 팀에 소속되어 있어 다른 방에 참가할 수 없습니다.");
      return;
    }
    if (hasJoinedRoom) {
      alert("이미 참가 중인 방이 있습니다. 다른 방에 참가하려면 먼저 해당 방에서 나가세요.");
      return;
    }
    setActionRoomId(roomId);
    const result = await joinMatchingRoom(roomId, {
      id: user.id,
      nickname: user.nickname,
    });
    setActionRoomId(null);
    if (result.success) {
      // 백엔드 join 응답의 room은 id, memberCount만 옴. 기존 room에 병합해 members/name/status/capacity 유지(렌더 크래시 방지).
      if (result.room) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === result.room!.id
              ? { ...r, ...result.room!, isJoined: true } as MatchingRoom
              : r
          )
        );
      }
      // 서버 목록으로 다시 불러오기. 실패 시 mock으로 덮어쓰지 않음
      getMatchingRooms()
        .then(setRooms)
        .catch(() => {});
    } else {
      alert(result.message);
    }
  };

  const handleLeave = async (roomId: string) => {
    setActionRoomId(roomId);
    const result = await leaveMatchingRoom(roomId);
    setActionRoomId(null);
    setLeaveConfirmRoomId(null);
    if (result.success) {
      getMatchingRooms()
        .then(setRooms)
        .catch(() => {});
    }
  };

  const openLeaveConfirm = (roomId: string) => setLeaveConfirmRoomId(roomId);
  const closeLeaveConfirm = () => setLeaveConfirmRoomId(null);

  const handleStart = async (room: MatchingRoom) => {
    setActionRoomId(room.id);
    const result = await startMatchingRoom(room.id);
    setActionRoomId(null);
    if (result.success) {
      const teamIdToSet =
        result.teamId ??
        (result.groupId != null ? String(result.groupId) : null);
      if (teamIdToSet) updateUserTeam(teamIdToSet);
      navigate(room.capacity === 1 ? "/solo" : "/mock-investment");
    }
  };

  const handleCreateRoom = async () => {
    if (hasTeam) {
      alert("이미 팀에 소속되어 있어 새 방을 만들 수 없습니다.");
      return;
    }
    if (hasJoinedRoom) {
      alert("이미 참가 중인 방이 있습니다. 새 방을 만들려면 먼저 방을 나가세요.");
      return;
    }
    setCreating(true);
    const capacity = newRoomType === "solo" ? 1 : 3;
    const visibility = newRoomType === "solo" ? "PUBLIC" : newRoomVisibility;
    const result = await createMatchingRoom(newRoomName.trim() || undefined, visibility, capacity);
    setCreating(false);
    if (result.success) {
      if (result.room) {
        setRooms((prev) => [{ ...result.room!, isJoined: true }, ...prev]);
        if (result.room.inviteCode && capacity > 1) {
          setCreateSuccessRoom({ inviteCode: result.room.inviteCode, visibility, capacity });
          return;
        }
        if (capacity === 1) {
          setCreateSuccessRoom({ inviteCode: "", visibility: "PUBLIC", capacity: 1 });
          return;
        }
      }
      setShowCreateModal(false);
      setNewRoomName("");
      setCreateSuccessRoom(null);
      getMatchingRooms().then(setRooms).catch(() => {});
    } else {
      alert(result.message);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewRoomName("");
    setNewRoomType("team");
    setNewRoomVisibility("PUBLIC");
    setCreateSuccessRoom(null);
    getMatchingRooms().then(setRooms).catch(() => {});
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => alert("초대코드가 복사되었습니다.")).catch(() => alert("복사에 실패했습니다."));
  };

  const handleJoinByCode = async () => {
    const code = inviteCodeInput.trim();
    if (!code) {
      setJoinByCodeError("초대코드를 입력해 주세요.");
      return;
    }
    setJoinByCodeError(null);
    setJoinByCodeLoading(true);
    try {
      const result = await joinRoomByCode(code);
      if (result.success) {
        setShowJoinByCodeModal(false);
        setInviteCodeInput("");
        if (result.room) {
          setRooms((prev) =>
            prev.some((r) => r.id === result.room!.id)
              ? prev.map((r) => (r.id === result.room!.id ? { ...r, ...result.room!, isJoined: true } as MatchingRoom : r))
              : [{ ...result.room!, isJoined: true }, ...prev]
          );
        }
        getMatchingRooms().then(setRooms).catch(() => {});
      } else {
        setJoinByCodeError(result.message ?? "입장에 실패했습니다.");
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "입장에 실패했습니다.";
      setJoinByCodeError(msg);
    } finally {
      setJoinByCodeLoading(false);
    }
  };

  const isFull = (room: MatchingRoom) => room.memberCount >= CAPACITY;
  /** API의 isJoined 사용, 없으면 members에 내가 있는지로 판단 (mock 폴백) */
  const isInRoom = (room: MatchingRoom) =>
    room.isJoined === true ||
    (Boolean(user) && room.members.some((m) => m.userId === user!.id));

  /** 내가 참가한 방 중 멤버가 부족한 방(2명 이하) — 이 경우 대기 페이지 표시 */
  const myWaitingRoom = rooms.find(
    (room) => isInRoom(room) && room.memberCount < CAPACITY
  );
  /** 이미 참가 중인 방이 하나라도 있으면 방 만들기 불가 (백엔드 400과 동일 규칙) */
  const hasJoinedRoom = rooms.some((room) => isInRoom(room));
  /** 이미 팀에 소속됨(모의투자 시작 후) — 다른 방 참가·방 만들기 불가 */
  const hasTeam = Boolean(user?.teamId);
  /** 다른 방에 참가 가능 여부: 어떤 방에도 참가하지 않았고, 팀도 없을 때만 참가 가능 */
  const canJoinAnotherRoom = !hasJoinedRoom && !hasTeam;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 팀원 매칭 대기 중일 때: 채팅에서 대기하도록 안내 */}
        {!loading && myWaitingRoom && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-teal-700">
                {myWaitingRoom.name}
              </span>
              방에서 팀원을 기다리는 중입니다. 채팅 화면에서 대기할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="py-2.5 px-5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer transition-colors flex items-center gap-2"
            >
              <i className="ri-chat-3-line text-lg" aria-hidden />
              채팅에서 대기하기
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="text-gray-500">목록 불러오는 중...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h1 className="text-xl font-bold text-gray-900">매칭방 목록</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    !hasJoinedRoom && !hasTeam && setShowJoinByCodeModal(true)
                  }
                  disabled={hasJoinedRoom || hasTeam}
                  title={
                    hasTeam
                      ? "이미 팀에 소속되어 있어 다른 방에 참가할 수 없습니다."
                      : hasJoinedRoom
                        ? "이미 참가 중인 방이 있습니다. 나간 뒤 초대코드로 입장할 수 있습니다."
                        : undefined
                  }
                  className="py-2.5 px-5 rounded-xl text-sm font-medium border border-teal-500 text-teal-600 hover:bg-teal-50 cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-key-line text-lg" aria-hidden />
                  초대코드 입력
                </button>
                <button
                  type="button"
                  onClick={() =>
                    !hasJoinedRoom && !hasTeam && setShowCreateModal(true)
                  }
                  disabled={hasJoinedRoom || hasTeam}
                  title={
                    hasTeam
                      ? "이미 팀에 소속되어 있어 새 방을 만들 수 없습니다."
                      : hasJoinedRoom
                        ? "이미 참가 중인 방이 있습니다. 새 방을 만들려면 먼저 방을 나가세요."
                        : undefined
                  }
                  className="py-2.5 px-5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-500"
                >
                  <i className="ri-add-line text-lg" aria-hidden />방 만들기
                </button>
              </div>
            </div>
            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">진행 중인 매칭방이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">
                  새 매칭방이 생성되면 여기에 표시됩니다.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    !hasJoinedRoom && !hasTeam && setShowCreateModal(true)
                  }
                  disabled={hasJoinedRoom || hasTeam}
                  title={
                    hasTeam
                      ? "이미 팀에 소속되어 있어 새 방을 만들 수 없습니다."
                      : hasJoinedRoom
                        ? "이미 참가 중인 방이 있습니다. 새 방을 만들려면 먼저 방을 나가세요."
                        : undefined
                  }
                  className="mt-4 py-2.5 px-5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  방 만들기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => {
                  const full = isFull(room);
                  const busy = actionRoomId === room.id;
                  const roomNum = parseInt(String(room.id).replace(/^room-/, ""), 10);
                  const teamNum =
                    user?.teamId != null && String(user.teamId).startsWith("team-")
                      ? parseInt(String(user.teamId).replace(/^team-/, ""), 10)
                      : null;
                  const isMyTeam =
                    !Number.isNaN(roomNum) &&
                    teamNum != null &&
                    !Number.isNaN(teamNum) &&
                    roomNum === teamNum;
                  return (
                    <div
                      key={room.id}
                      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                        isMyTeam ? "ring-2 ring-teal-500 border-teal-500" : "border-gray-200"
                      }`}
                    >
                      <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                          {room.name}
                          {isMyTeam && (
                            <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-teal-500 text-white rounded-full">
                              내 팀
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          멤버 {room.memberCount}/{room.capacity}명
                          {room.status !== "started" && room.memberCount >= 1 && (
                            <span className="ml-2 text-teal-600 font-medium">
                              · 모의투자 시작 가능
                            </span>
                          )}
                          {room.status === "started" && (
                            <span className="ml-2 text-gray-500">
                              · 진행 중
                            </span>
                          )}
                        </p>
                        {room.inviteCode && room.capacity > 1 && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <span>초대코드</span>
                            <code className="font-mono tracking-wider">{room.inviteCode}</code>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyInviteCode(room.inviteCode!);
                              }}
                              className="text-teal-600 hover:text-teal-700 cursor-pointer"
                              title="복사"
                            >
                              <i className="ri-file-copy-line text-sm" aria-hidden />
                            </button>
                          </p>
                        )}
                      </div>

                      <div className="p-5">
                        <p className="text-xs font-medium text-gray-500 mb-3">
                          멤버
                        </p>
                        <ul className="space-y-3">
                          {room.members.map((member) => (
                            <li
                              key={member.userId}
                              className="flex items-center gap-3"
                            >
                              <span
                                className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                                aria-hidden
                              >
                                {member.nickname.charAt(0)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.nickname}
                                </p>
                              </div>
                            </li>
                          ))}
                          {room.members.length < room.capacity &&
                            Array.from({
                              length: room.capacity - room.members.length,
                            }).map((_, i) => (
                              <li
                                key={`empty-${i}`}
                                className="flex items-center gap-3"
                              >
                                <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center">
                                  <span className="text-xs text-gray-400">
                                    빈 자리
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400">대기 중</p>
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div className="p-5 pt-0 flex gap-2">
                        {room.status === "started" ? (
                          <button
                            type="button"
                            disabled
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
                          >
                            진행 중
                          </button>
                        ) : isInRoom(room) && room.memberCount >= 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStart(room)}
                              disabled={busy}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              {busy ? "처리 중..." : "모의투자 시작"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openLeaveConfirm(room.id)}
                              disabled={busy}
                              className="py-2.5 px-4 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              나가기
                            </button>
                          </>
                        ) : full ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                            title="방이 가득 찼습니다"
                          >
                            참가 불가 (3/3)
                          </button>
                        ) : room.visibility === "PRIVATE" ? (
                          <div
                            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 text-center"
                            title="비공개 방은 초대코드로만 입장할 수 있습니다"
                          >
                            초대코드로만 입장
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoin(room.id)}
                            disabled={busy || !canJoinAnotherRoom}
                            title={
                              hasTeam
                                ? "이미 팀에 소속되어 있어 다른 방에 참가할 수 없습니다."
                                : hasJoinedRoom
                                  ? "이미 참가 중인 방이 있습니다. 나간 뒤 참가할 수 있습니다."
                                  : undefined
                            }
                            className="w-full py-2.5 rounded-xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            {busy
                              ? "처리 중..."
                              : !canJoinAnotherRoom
                                ? (hasTeam ? "다른 팀 참가 불가" : "참가 불가")
                                : "참가하기"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 방 나가기 확인 모달 */}
        {leaveConfirmRoomId && (
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
                나가시면 해당 방의 팀원 매칭에서 제외됩니다. 다시 참가하려면
                방에 새로 참가해야 합니다.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeLeaveConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleLeave(leaveConfirmRoomId)}
                  disabled={actionRoomId === leaveConfirmRoomId}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                >
                  {actionRoomId === leaveConfirmRoomId
                    ? "처리 중..."
                    : "나가기"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 모의투자방 만들기 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              {createSuccessRoom ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {createSuccessRoom.capacity === 1 ? "개인방이 생성되었습니다" : "방이 생성되었습니다"}
                  </h3>
                  {createSuccessRoom.capacity === 1 ? (
                    <p className="text-sm text-gray-600 mb-4">
                      아래 목록에서 해당 방의 &quot;모의투자 시작&quot;을 누르면 개인 모의투자 화면으로 이동합니다.
                    </p>
                  ) : (
                    <>
                      {createSuccessRoom.visibility === "PRIVATE" && (
                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                          비공개 방은 목록에 보이지 않습니다. 초대코드를 팀원에게 공유하세요.
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">초대코드</p>
                      <div className="flex items-center gap-2 mb-4">
                        <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-base font-mono font-bold tracking-wider">
                          {createSuccessRoom.inviteCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyInviteCode(createSuccessRoom.inviteCode)}
                          className="py-2 px-4 rounded-xl text-sm font-medium border border-teal-500 text-teal-600 hover:bg-teal-50 cursor-pointer"
                        >
                          복사
                        </button>
                      </div>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 cursor-pointer"
                  >
                    확인
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    모의투자방 만들기
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">방 유형</p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="roomType"
                          checked={newRoomType === "solo"}
                          onChange={() => setNewRoomType("solo")}
                          className="text-teal-500"
                        />
                        <span className="text-sm">개인 (1인)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="roomType"
                          checked={newRoomType === "team"}
                          onChange={() => setNewRoomType("team")}
                          className="text-teal-500"
                        />
                        <span className="text-sm">팀 (최대 3인)</span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="방 이름 (선택)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
                  />
                  {newRoomType === "team" && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">공개 설정</p>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            checked={newRoomVisibility === "PUBLIC"}
                            onChange={() => setNewRoomVisibility("PUBLIC")}
                            className="text-teal-500"
                          />
                          <span className="text-sm">공개 (목록에 표시)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="visibility"
                            checked={newRoomVisibility === "PRIVATE"}
                            onChange={() => setNewRoomVisibility("PRIVATE")}
                            className="text-teal-500"
                          />
                          <span className="text-sm">비공개 (초대코드로만 입장)</span>
                        </label>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mb-4">
                    {newRoomType === "solo"
                      ? "개인방은 채팅 없이 모의투자만 가능합니다. 생성 후 시작하면 /solo 화면으로 이동합니다."
                      : "비우면 자동으로 날짜 기반 이름이 붙습니다. 인원 모이면 시작 가능(최대 3명)."}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      disabled={creating}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer"
                    >
                      {creating ? "만드는 중..." : "만들기"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 초대코드로 입장 모달 */}
        {showJoinByCodeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                초대코드로 입장
              </h3>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => {
                  setInviteCodeInput(e.target.value);
                  setJoinByCodeError(null);
                }}
                placeholder="초대코드 입력 (6~8자)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
              />
              {joinByCodeError && (
                <p className="text-sm text-red-600 mb-4">{joinByCodeError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinByCodeModal(false);
                    setInviteCodeInput("");
                    setJoinByCodeError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleJoinByCode}
                  disabled={joinByCodeLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 cursor-pointer"
                >
                  {joinByCodeLoading ? "입장 중..." : "입장"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
