import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminCompetitions,
  createAdminCompetition,
  updateAdminCompetition,
  getAdminTeamsByCompetition,
  getAdminMatchingRooms,
  deleteAdminMatchingRoom,
  deleteAdminMatchingRoomMember,
  getAdminUsers,
  deleteAdminUser,
} from "../../services";
import type { AdminCompetition } from "../../types";
import type { CompetingTeamItem } from "../../types";
import type { MatchingRoom } from "../../types";

type AdminTab = "competition" | "teams" | "users";

/** 배포용주석**/
const STATUS_LABEL: Record<AdminCompetition["status"], string> = {
  upcoming: "예정",
  ongoing: "진행 중",
  ended: "종료",
};

/** 대회 내역 표기: 날짜만 (시간 없음) */
function formatDateOnly(iso: string) {
  if (!iso || !iso.trim()) return "-";
  const s = iso.trim();
  const datePart = s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
  try {
    return new Date(datePart + "T12:00:00").toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return datePart;
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>("competition");

  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [teams, setTeams] = useState<CompetingTeamItem[]>([]);
  const [rooms, setRooms] = useState<MatchingRoom[]>([]);
  const [users, setUsers] = useState<
    {
      id: string;
      email: string;
      nickname: string;
      teamId: string | null;
      role: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<
    number | null
  >(null);

  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [editingCompetition, setEditingCompetition] =
    useState<AdminCompetition | null>(null);
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [roomActionId, setRoomActionId] = useState<string | null>(null);
  const [memberActionKey, setMemberActionKey] = useState<string | null>(null);
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const loadCompetitions = () => {
    getAdminCompetitions().then(setCompetitions);
  };
  const loadTeams = (competitionId: number) => {
    getAdminTeamsByCompetition(competitionId).then(setTeams);
  };
  const loadRooms = () => {
    getAdminMatchingRooms().then(setRooms);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (
      !window.confirm(
        "이 매칭방을 삭제하면 모든 멤버가 제거됩니다. 계속할까요?",
      )
    )
      return;
    setRoomActionError(null);
    setRoomActionId(roomId);
    try {
      const res = await deleteAdminMatchingRoom(roomId);
      if (res.success) {
        setRoomActionError(null);
        loadRooms();
      } else {
        setRoomActionError(res.message);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setRoomActionError(err?.message ?? "삭제에 실패했습니다.");
    } finally {
      setRoomActionId(null);
    }
  };

  const handleRemoveMember = async (roomId: string, userId: string) => {
    if (!window.confirm("이 멤버를 팀에서 강제 제거합니다. 계속할까요?"))
      return;
    setRoomActionError(null);
    const key = `${roomId}-${userId}`;
    setMemberActionKey(key);
    try {
      const res = await deleteAdminMatchingRoomMember(roomId, userId);
      if (res.success) {
        setRoomActionError(null);
        loadRooms();
      } else {
        setRoomActionError(res.message);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      setRoomActionError(err?.message ?? "멤버 제거에 실패했습니다.");
    } finally {
      setMemberActionKey(null);
    }
  };
  const loadUsers = () => {
    getAdminUsers().then(setUsers);
  };

  const handleDeleteUser = async (u: {
    id: string;
    email: string;
    role: string;
  }) => {
    if (u.role === "admin") {
      setUserActionError("관리자 계정은 삭제할 수 없습니다.");
      return;
    }
    if (user?.id != null && String(user.id) === u.id) {
      setUserActionError("본인 계정은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`"${u.email}" 유저를 삭제할까요?`)) return;
    setUserActionError(null);
    setDeletingUserId(u.id);
    try {
      const res = await deleteAdminUser(u.id);
      if (res.success) {
        loadUsers();
      } else {
        setUserActionError(res.message ?? "삭제에 실패했습니다.");
      }
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg =
        err?.response?.data?.message ?? err?.message ?? "삭제에 실패했습니다.";
      setUserActionError(msg);
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAdminCompetitions(),
      getAdminMatchingRooms(),
      getAdminUsers(),
    ])
      .then(([comp, roomList, userList]) => {
        setCompetitions(comp);
        setRooms(roomList);
        setUsers(userList);
        if (comp.length > 0 && !selectedCompetitionId) {
          setSelectedCompetitionId(comp[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCompetitionId) {
      getAdminTeamsByCompetition(selectedCompetitionId).then(setTeams);
    }
  }, [selectedCompetitionId]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openCreateCompetition = () => {
    setEditingCompetition(null);
    setFormName("");
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const end = new Date(nextMonth);
    end.setDate(end.getDate() + 7);
    setFormStartDate(nextMonth.toISOString().slice(0, 16));
    setFormEndDate(end.toISOString().slice(0, 16));
    setFormError("");
    setShowCompetitionModal(true);
  };

  const openEditCompetition = (c: AdminCompetition) => {
    setEditingCompetition(c);
    setFormName(c.name);
    setFormStartDate(c.startDate.slice(0, 16));
    setFormEndDate(c.endDate.slice(0, 16));
    setFormError("");
    setShowCompetitionModal(true);
  };

  const closeCompetitionModal = () => {
    setShowCompetitionModal(false);
    setEditingCompetition(null);
    setFormError("");
  };

  const handleSaveCompetition = async () => {
    setFormError("");
    if (!formName.trim()) {
      setFormError("대회 이름을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      if (editingCompetition) {
        const result = await updateAdminCompetition(editingCompetition.id, {
          name: formName.trim(),
          startDate: formStartDate,
          endDate: formEndDate,
        });
        if (result.success) {
          loadCompetitions();
          closeCompetitionModal();
        } else {
          setFormError(result.message);
        }
      } else {
        const result = await createAdminCompetition({
          name: formName.trim(),
          startDate: formStartDate,
          endDate: formEndDate,
        });
        if (result.success) {
          loadCompetitions();
          closeCompetitionModal();
        } else {
          setFormError(result.message);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "competition", label: "대회 관리" },
    { key: "teams", label: "팀 확인" },
    { key: "users", label: "유저 관리" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← 서비스 홈
            </button>
            <h1 className="text-xl font-bold text-gray-900">관리자</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.nickname ?? user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100">
          <nav className="flex gap-1 pt-2">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === key
                    ? "bg-white text-teal-600 border border-b-0 border-gray-200 -mb-px"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-16 text-gray-500">
            로딩 중...
          </div>
        ) : (
          <>
            {tab === "competition" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">대회 목록</h2>
                  <button
                    type="button"
                    onClick={openCreateCompetition}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
                  >
                    대회 추가
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
                      <tr>
                        <th className="px-6 py-3">이름</th>
                        <th className="px-6 py-3">시작일</th>
                        <th className="px-6 py-3">종료일</th>
                        <th className="px-6 py-3">상태</th>
                        <th className="px-6 py-3 w-24">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {competitions.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {c.name}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {formatDateOnly(c.startDate)}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {formatDateOnly(c.endDate)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                c.status === "ongoing"
                                  ? "bg-teal-100 text-teal-700"
                                  : c.status === "upcoming"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_LABEL[c.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => openEditCompetition(c)}
                              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                              수정
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "teams" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">
                      대회별 팀 (랭킹)
                    </h2>
                    <select
                      value={selectedCompetitionId ?? ""}
                      onChange={(e) =>
                        setSelectedCompetitionId(Number(e.target.value) || null)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {competitions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({STATUS_LABEL[c.status]})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
                        <tr>
                          <th className="px-6 py-3">순위</th>
                          <th className="px-6 py-3">팀명</th>
                          <th className="px-6 py-3">총 평가액</th>
                          <th className="px-6 py-3">수익률</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {teams.map((t) => (
                          <tr key={t.teamId} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {t.rank}위
                            </td>
                            <td className="px-6 py-4">{t.groupName}</td>
                            <td className="px-6 py-4 text-gray-600">
                              {t.totalValue.toLocaleString("ko-KR")}원
                            </td>
                            <td
                              className={`px-6 py-4 font-medium ${
                                t.profitLossPercentage >= 0
                                  ? "text-red-500"
                                  : "text-blue-500"
                              }`}
                            >
                              {t.profitLossPercentage >= 0 ? "+" : ""}
                              {t.profitLossPercentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">
                      매칭방 (팀 구성 대기)
                    </h2>
                    {roomActionError && (
                      <p className="mt-2 text-sm text-red-600">
                        {roomActionError}
                      </p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
                        <tr>
                          <th className="px-6 py-3">방 이름</th>
                          <th className="px-6 py-3">멤버</th>
                          <th className="px-6 py-3">상태</th>
                          <th className="px-6 py-3 w-40">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rooms.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {r.name}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {r.memberCount}/{r.capacity}명 (
                              {r.members.map((m) => (
                                <span
                                  key={m.userId}
                                  className="inline-flex items-center gap-1 mr-1"
                                >
                                  {m.nickname}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveMember(r.id, m.userId)
                                    }
                                    disabled={
                                      memberActionKey === `${r.id}-${m.userId}`
                                    }
                                    className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                                    title="멤버 강제 제거"
                                  >
                                    {memberActionKey === `${r.id}-${m.userId}`
                                      ? "제거 중..."
                                      : "제거"}
                                  </button>
                                </span>
                              ))}
                              )
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                  r.status === "full"
                                    ? "bg-teal-100 text-teal-700"
                                    : r.status === "started"
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.status === "waiting"
                                  ? "대기 중"
                                  : r.status === "full"
                                    ? "정원 참"
                                    : "시작됨"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(r.id)}
                                disabled={roomActionId !== null}
                                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                              >
                                {roomActionId === r.id
                                  ? "삭제 중..."
                                  : "방 삭제"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === "users" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">유저 목록</h2>
                  {userActionError && (
                    <p className="mt-2 text-sm text-red-600">
                      {userActionError}
                    </p>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm font-medium">
                      <tr>
                        <th className="px-6 py-3">이메일</th>
                        <th className="px-6 py-3">닉네임</th>
                        <th className="px-6 py-3">팀</th>
                        <th className="px-6 py-3">역할</th>
                        <th className="px-6 py-3 w-24">삭제</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => {
                        const isSelf =
                          user?.id != null && String(user.id) === u.id;
                        const cannotDelete = u.role === "admin" || isSelf;
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-gray-900">
                              {u.email}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {u.nickname}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {u.teamId ?? "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {u.role === "admin" ? "관리자" : "일반"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {cannotDelete ? (
                                <span className="text-gray-400 text-sm">—</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={deletingUserId === u.id}
                                  onClick={() => handleDeleteUser(u)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                                >
                                  {deletingUserId === u.id
                                    ? "삭제 중..."
                                    : "삭제"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 대회 추가/수정 모달 */}
      {showCompetitionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCompetition ? "대회 수정" : "대회 추가"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대회 이름
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 2025 봄 시즌 대회"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시작일
                </label>
                <input
                  type="datetime-local"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  종료일
                </label>
                <input
                  type="datetime-local"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeCompetitionModal}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveCompetition}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 disabled:opacity-50"
              >
                {saving ? "저장 중..." : editingCompetition ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
