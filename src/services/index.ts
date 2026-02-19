/**
 * API 데이터 서비스. 백엔드 연동: apiClient + 각 서비스
 * @see docs/API_SPEC.md
 */

export {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "./apiClient";
export type { ApiError, RequestConfig } from "./apiClient";

export { getMyInvestment } from "./investmentService";

export {
  getMarketIndices,
  getStocksByVolume,
  getStocksByRising,
  getStocksByFalling,
} from "./marketService";

export { getStockDetail } from "./stockService";

export {
  getPriceWebSocketUrl,
  connectPriceWebSocket,
  usePriceWebSocket,
} from "./priceWebSocketService";

export {
  getOngoingCompetitions,
  getUpcomingCompetitions,
} from "./competitionService";
export type {
  CompetitionOngoingItem,
  CompetitionUpcomingItem,
} from "./competitionService";

export { getAllGroupsRanking, getMyGroupRanking } from "./rankingService";

export {
  getGroupPortfolio,
  getMyGroupPortfolio,
  getGroupStockHoldings,
  getGroupMembers,
  getCompetingTeams,
} from "./groupService";

export {
  getChatMessages,
  sendChatMessage,
  sendTradeMessage,
  getChatWebSocketUrl,
} from "./chatService";

export { getVotes, createVote, submitVote } from "./voteService";
export type { CreateVotePayload } from "./voteService";

export {
  getMatchingRooms,
  getMyMatchingRooms,
  createMatchingRoom,
  joinMatchingRoom,
  leaveMatchingRoom,
  startMatchingRoom,
} from "./matchingRoomService";

export { getMe } from "./meService";
export type { MeResponse } from "./meService";

export {
  getAdminCompetitions,
  createAdminCompetition,
  updateAdminCompetition,
  getAdminTeamsByCompetition,
  getAdminMatchingRooms,
  deleteAdminMatchingRoom,
  deleteAdminMatchingRoomMember,
  getAdminUsers,
  deleteAdminUser,
} from "./adminService";
