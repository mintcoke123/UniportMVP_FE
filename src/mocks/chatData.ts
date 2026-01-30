export const chatMessages = [
  {
    id: 2,
    type: 'user' as const,
    userId: 2,
    userNickname: '김투자',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businessman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user002&orientation=squarish',
    message: '삼성전자 AI 반도체 뉴스 보셨나요? 이번 기회에 매수 타이밍인 것 같아요!',
    timestamp: '09:18'
  },
  {
    id: 3,
    type: 'trade' as const,
    userId: 2,
    userNickname: '김투자',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businessman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user002&orientation=squarish',
    timestamp: '09:20',
    tradeData: {
      action: '매수' as const,
      stockName: '삼성전자',
      quantity: 10,
      pricePerShare: 71500,
      totalAmount: 715000,
      reason: 'AI 반도체 시장 진출로 장기적 성장 가능성이 높다고 판단됩니다.',
      tags: ['#실적발표', '#장기투자']
    }
  },
  {
    id: 4,
    type: 'user' as const,
    userId: 3,
    userNickname: '박주식',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20woman%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user003&orientation=squarish',
    message: '좋은 분석이네요! 저도 동참하겠습니다 👍',
    timestamp: '09:22'
  },
  {
    id: 6,
    type: 'user' as const,
    userId: 4,
    userNickname: '이재테크',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20man%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user004&orientation=squarish',
    message: 'SK하이닉스 HBM 관련 뉴스 나왔네요. 이미 많이 올라서 고민되네요...',
    timestamp: '10:35'
  },
  {
    id: 7,
    type: 'trade' as const,
    userId: 5,
    userNickname: '최수익',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20businesswoman%20profile%20photo%20clean%20simple%20background%20confident%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user005&orientation=squarish',
    timestamp: '10:40',
    tradeData: {
      action: '매도' as const,
      stockName: 'SK하이닉스',
      quantity: 5,
      pricePerShare: 185000,
      totalAmount: 925000,
      reason: '목표가 도달했고, 단기 과열 우려가 있어 일부 차익 실현합니다.',
      tags: ['#급등기대', '#저평가']
    }
  },
  {
    id: 8,
    type: 'user' as const,
    userId: 3,
    userNickname: '박주식',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20korean%20woman%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user003&orientation=squarish',
    message: '현명한 판단이신 것 같아요. 저도 일부 매도 고려 중입니다.',
    timestamp: '10:42'
  },
  {
    id: 10,
    type: 'user' as const,
    userId: 4,
    userNickname: '이재테크',
    userProfileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20man%20profile%20photo%20clean%20simple%20background%20friendly%20smile%20natural%20lighting%20high%20quality%20portrait&width=100&height=100&seq=user004&orientation=squarish',
    message: 'LG에너지솔루션 북미 공장 증설 소식 좋네요! 전기차 시장 성장세를 고려하면 긍정적입니다.',
    timestamp: '14:25'
  }
];