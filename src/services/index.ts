/**
 * API 데이터 서비스 (현재 mock 반환, 백엔드 연동 시 각 모듈 내부만 교체)
 * @see docs/API_SPEC.md
 */

export {
  getMyInvestment,
} from './investmentService';

export {
  getMarketIndices,
  getStocksByVolume,
  getStocksByRising,
  getStocksByFalling,
} from './marketService';

export { getStockDetail } from './stockService';

export {
  getOngoingTournaments,
  getUpcomingTournaments,
} from './tournamentService';
export type {
  TournamentOngoingItem,
  TournamentUpcomingItem,
} from './tournamentService';

export {
  getAllGroupsRanking,
  getMyGroupRanking,
} from './rankingService';

export {
  getGroupPortfolio,
  getGroupStockHoldings,
  getGroupMembers,
} from './groupService';

export { getChatMessages } from './chatService';

export { getVotes } from './voteService';
