
export interface User {
  id: string;
  email: string;
  password: string;
  nickname: string;
  profileImage: string;
  totalAssets: number;
  investmentAmount: number;
  profitLoss: number;
  profitLossRate: number;
}

// 기본 자산 설정 (모든 사용자 동일)
export const DEFAULT_ASSETS = {
  totalAssets: 10000000,      // 1000만원
  investmentAmount: 0,         // 투자금 0원
  profitLoss: 0,               // 수익/손실 0원
  profitLossRate: 0            // 수익률 0%
};

export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'test@test.com',
    password: '1234',
    nickname: '투자왕김철수',
    profileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20man%20portrait%20photo%20with%20neutral%20background%20clean%20minimalist%20style%20friendly%20smile&width=100&height=100&seq=user1&orientation=squarish',
    ...DEFAULT_ASSETS
  },
  {
    id: 'user2',
    email: 'demo@demo.com',
    password: 'demo',
    nickname: '주식고수',
    profileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20woman%20portrait%20photo%20with%20neutral%20background%20clean%20minimalist%20style%20confident%20expression&width=100&height=100&seq=user2&orientation=squarish',
    ...DEFAULT_ASSETS
  },
  {
    id: 'user3',
    email: 'investor@test.com',
    password: '1234',
    nickname: '수익률왕',
    profileImage: 'https://readdy.ai/api/search-image?query=professional%20young%20korean%20man%20portrait%20photo%20with%20neutral%20background%20clean%20minimalist%20style%20confident%20business%20look&width=100&height=100&seq=user3&orientation=squarish',
    ...DEFAULT_ASSETS
  }
];

// 사용자 ID로 사용자 찾기
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

// 이메일로 사용자 찾기
export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email);
};

export const currentUser: User = mockUsers[0];
