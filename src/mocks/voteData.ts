
export interface VoteItem {
  id: number;
  type: '매수' | '매도';
  stockName: string;
  proposerId: number;
  proposerName: string;
  proposerImage: string;
  quantity: number;
  proposedPrice: number;
  reason: string;
  createdAt: string;
  expiresAt: string;
  votes: {
    oderId: number;
    userId: number;
    userName: string;
    userImage: string;
    vote: '찬성' | '반대';
  }[];
  totalMembers: number;
  status: 'ongoing' | 'passed' | 'rejected' | 'expired';
}

export const voteData: VoteItem[] = [
  {
    id: 1,
    type: '매수',
    stockName: '삼성전자',
    proposerId: 2,
    proposerName: '김투자',
    proposerImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businessman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user002&orientation=squarish',
    quantity: 10,
    proposedPrice: 71500,
    reason: '반도체 업황 개선 기대. 최근 실적 발표에서 영업이익이 전분기 대비 15% 증가했고, AI 칩 수요 증가로 향후 전망이 밝습니다.',
    createdAt: '2024-01-15 09:20',
    expiresAt: '23시간 남음',
    votes: [
      {
        oderId: 1,
        userId: 3,
        userName: '박주식',
        userImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20woman%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user003&orientation=squarish',
        vote: '찬성'
      },
      {
        oderId: 2,
        userId: 4,
        userName: '이재테크',
        userImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20man%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user004&orientation=squarish',
        vote: '찬성'
      }
    ],
    totalMembers: 5,
    status: 'ongoing'
  },
  {
    id: 2,
    type: '매도',
    stockName: 'SK하이닉스',
    proposerId: 5,
    proposerName: '최수익',
    proposerImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businesswoman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user005&orientation=squarish',
    quantity: 5,
    proposedPrice: 185000,
    reason: '목표가 도달. 단기 과열 우려가 있어 일부 차익 실현을 제안합니다. HBM 관련 호재는 이미 주가에 반영되었다고 판단됩니다.',
    createdAt: '2024-01-15 10:40',
    expiresAt: '23시간 남음',
    votes: [
      {
        oderId: 1,
        userId: 2,
        userName: '김투자',
        userImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businessman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user002&orientation=squarish',
        vote: '찬성'
      },
      {
        oderId: 2,
        userId: 3,
        userName: '박주식',
        userImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20woman%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user003&orientation=squarish',
        vote: '반대'
      }
    ],
    totalMembers: 5,
    status: 'ongoing'
  }
];