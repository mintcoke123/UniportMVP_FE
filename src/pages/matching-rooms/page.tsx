import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/feature/Header";
import { useAuth } from "../../contexts/AuthContext";
import {
  getMatchingRooms,
  createMatchingRoom,
  joinMatchingRoom,
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
  const [creating, setCreating] = useState(false);
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

  const handleStart = async (roomId: string) => {
    setActionRoomId(roomId);
    const result = await startMatchingRoom(roomId);
    setActionRoomId(null);
    if (result.success) {
      const teamIdToSet =
        result.teamId ??
        (result.groupId != null ? String(result.groupId) : null);
      if (teamIdToSet) updateUserTeam(teamIdToSet);
      navigate("/mock-investment");
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
    const result = await createMatchingRoom(newRoomName.trim() || undefined);
    setCreating(false);
    if (result.success) {
      setShowCreateModal(false);
      setNewRoomName("");
      // 백엔드가 만든 방을 주면 즉시 목록에 추가
      if (result.room) {
        setRooms((prev) => [{ ...result.room!, isJoined: true }, ...prev]);
      }
      getMatchingRooms()
        .then(setRooms)
        .catch(() => {});
    } else {
      alert(result.message);
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">매칭방 목록</h1>
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
                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <div className="p-5 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 truncate">
                          {room.name}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          멤버 {room.memberCount}/{room.capacity}명
                          {room.status === "full" && (
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
                        ) : full ? (
                          isInRoom(room) ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStart(room.id)}
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
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                              title="방이 가득 찼습니다"
                            >
                              참가 불가 (3/3)
                            </button>
                          )
                        ) : isInRoom(room) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate("/chat")}
                              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-teal-500 text-teal-600 hover:bg-teal-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                            >
                              <i
                                className="ri-chat-3-line text-base"
                                aria-hidden
                              />
                              채팅에서 대기
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                모의투자방 만들기
              </h3>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="방 이름 (선택)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
              />
              <p className="text-xs text-gray-500 mb-4">
                비우면 자동으로 날짜 기반 이름이 붙습니다. 정원 3명이 모이면
                모의투자를 시작할 수 있습니다.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoomName("");
                  }}
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
