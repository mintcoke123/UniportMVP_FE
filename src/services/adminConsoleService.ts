import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./apiClient";

export interface BootstrapCounts {
  counts: {
    etfs: number;
    news: number;
    communityPosts: number;
    products: number;
    users: number;
  };
}

export interface ManagedEtf {
  id?: number;
  etfCode: string;
  title: string;
  theme?: string;
  benchmark?: string;
  period?: string;
  riskLevel?: string;
  returnRate?: number | string | null;
  popularityScore?: number | null;
  favoriteCount?: number | null;
  imageUrl?: string;
  shortDescription?: string;
  holdingsJson?: string;
  trendPointsJson?: string;
  analysisSummaryJson?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedNewsArticle {
  id?: number;
  newsKey: string;
  title: string;
  sourceLabel?: string;
  imageUrl?: string;
  stockCode?: string;
  stockName?: string;
  summary?: string;
  content?: string;
  companyInfoJson?: string;
  tagsJson?: string;
  opinionsJson?: string;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedCommunityComment {
  id?: number;
  postId?: number;
  authorUserId?: number | null;
  authorName: string;
  authorProfileImageUrl?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedCommunityPost {
  id?: number;
  type: string;
  authorUserId?: number | null;
  authorName: string;
  authorProfileImageUrl?: string;
  stockCode?: string;
  stockName?: string;
  sentiment?: string;
  title: string;
  content: string;
  analysisReportId?: string;
  likeCount?: number | null;
  comments?: ManagedCommunityComment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ManagedGroupInsight {
  id?: number;
  insightKey?: string;
  topGroupId?: number | null;
  topGroupName?: string;
  dailyReturnRate?: number | string | null;
  topPick?: string;
  comment?: string;
  consensusJson?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: number;
  studentId: string;
  nickname: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  teamId?: string | null;
  role?: string;
  investmentProfileResult?: string;
  investmentLevel?: string;
  interestSector?: string;
  totalAssets?: number | string | null;
  investmentAmount?: number | string | null;
  profitLoss?: number | string | null;
  profitLossRate?: number | string | null;
  pointBalance?: number | null;
}

export interface PointShopProduct {
  id?: number;
  name: string;
  brand?: string;
  category?: string;
  pricePoint?: number | null;
  imageUrl?: string;
  description?: string;
  notice?: string;
  status?: string;
  stockCount?: number | null;
  sortOrder?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GifticonInventory {
  id?: number;
  productId?: number | null;
  productName?: string;
  gifticonCode: string;
  gifticonUrl?: string;
  expiredAt?: string | null;
  status?: string;
  assignedOrderId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PointWallet {
  id?: number;
  userId?: number | null;
  nickname?: string;
  studentId?: string;
  balance?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PointShopOrder {
  id?: number;
  userId?: number | null;
  nickname?: string;
  productId?: number | null;
  productName?: string;
  inventoryId?: number | null;
  usedPoint?: number | null;
  status?: string;
  pointTransactionId?: string;
  failureReason?: string;
  sentAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FriendRelation {
  id?: number;
  requesterUserId?: number | null;
  requesterNickname?: string;
  addresseeUserId?: number | null;
  addresseeNickname?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const base = "/api/admin-console";

export const getBootstrap = () => apiGet<BootstrapCounts>(`${base}/bootstrap`, { skipAuth: true });

export const getEtfs = () => apiGet<ManagedEtf[]>(`${base}/etfs`, { skipAuth: true });
export const createEtf = (body: ManagedEtf) => apiPost<ManagedEtf>(`${base}/etfs`, body, { skipAuth: true });
export const updateEtf = (id: number, body: ManagedEtf) => apiPut<ManagedEtf>(`${base}/etfs/${id}`, body, { skipAuth: true });
export const deleteEtf = (id: number) => apiDelete<{ success: boolean }>(`${base}/etfs/${id}`, { skipAuth: true });

export const getNews = () => apiGet<ManagedNewsArticle[]>(`${base}/news`, { skipAuth: true });
export const createNews = (body: ManagedNewsArticle) => apiPost<ManagedNewsArticle>(`${base}/news`, body, { skipAuth: true });
export const updateNews = (id: number, body: ManagedNewsArticle) => apiPut<ManagedNewsArticle>(`${base}/news/${id}`, body, { skipAuth: true });
export const deleteNews = (id: number) => apiDelete<{ success: boolean }>(`${base}/news/${id}`, { skipAuth: true });

export const getCommunityPosts = () => apiGet<ManagedCommunityPost[]>(`${base}/community/posts`, { skipAuth: true });
export const createCommunityPost = (body: ManagedCommunityPost) => apiPost<ManagedCommunityPost>(`${base}/community/posts`, body, { skipAuth: true });
export const updateCommunityPost = (id: number, body: ManagedCommunityPost) => apiPut<ManagedCommunityPost>(`${base}/community/posts/${id}`, body, { skipAuth: true });
export const deleteCommunityPost = (id: number) => apiDelete<{ success: boolean }>(`${base}/community/posts/${id}`, { skipAuth: true });
export const createCommunityComment = (postId: number, body: ManagedCommunityComment) => apiPost<ManagedCommunityComment>(`${base}/community/posts/${postId}/comments`, body, { skipAuth: true });
export const updateCommunityComment = (id: number, body: ManagedCommunityComment) => apiPut<ManagedCommunityComment>(`${base}/community/comments/${id}`, body, { skipAuth: true });
export const deleteCommunityComment = (id: number) => apiDelete<{ success: boolean }>(`${base}/community/comments/${id}`, { skipAuth: true });

export const getHomeGroupInsight = () => apiGet<ManagedGroupInsight>(`${base}/group-insights/home`, { skipAuth: true });
export const updateHomeGroupInsight = (body: ManagedGroupInsight) => apiPut<ManagedGroupInsight>(`${base}/group-insights/home`, body, { skipAuth: true });

export const getUsers = () => apiGet<AdminUser[]>(`${base}/users`, { skipAuth: true });
export const updateUser = (id: number, body: Partial<AdminUser>) => apiPatch<AdminUser>(`${base}/users/${id}`, body, { skipAuth: true });
export const deleteUser = (id: number) => apiDelete<{ success: boolean }>(`${base}/users/${id}`, { skipAuth: true });

export const getPointShopProducts = () => apiGet<PointShopProduct[]>(`${base}/point-shop/products`, { skipAuth: true });
export const createPointShopProduct = (body: PointShopProduct) => apiPost<PointShopProduct>(`${base}/point-shop/products`, body, { skipAuth: true });
export const updatePointShopProduct = (id: number, body: PointShopProduct) => apiPut<PointShopProduct>(`${base}/point-shop/products/${id}`, body, { skipAuth: true });
export const deletePointShopProduct = (id: number) => apiDelete<{ success: boolean }>(`${base}/point-shop/products/${id}`, { skipAuth: true });

export const getGifticonInventory = () => apiGet<GifticonInventory[]>(`${base}/point-shop/inventory`, { skipAuth: true });
export const createGifticonInventory = (body: GifticonInventory) => apiPost<GifticonInventory>(`${base}/point-shop/inventory`, body, { skipAuth: true });
export const updateGifticonInventory = (id: number, body: GifticonInventory) => apiPut<GifticonInventory>(`${base}/point-shop/inventory/${id}`, body, { skipAuth: true });
export const deleteGifticonInventory = (id: number) => apiDelete<{ success: boolean }>(`${base}/point-shop/inventory/${id}`, { skipAuth: true });

export const getPointWallets = () => apiGet<PointWallet[]>(`${base}/point-shop/wallets`, { skipAuth: true });
export const updatePointWallet = (userId: number, body: { balance: number; description?: string }) =>
  apiPut<PointWallet>(`${base}/point-shop/wallets/${userId}`, body, { skipAuth: true });

export const getPointShopOrders = () => apiGet<PointShopOrder[]>(`${base}/point-shop/orders`, { skipAuth: true });
export const createPointShopOrder = (body: PointShopOrder) => apiPost<PointShopOrder>(`${base}/point-shop/orders`, body, { skipAuth: true });
export const updatePointShopOrder = (id: number, body: PointShopOrder) => apiPut<PointShopOrder>(`${base}/point-shop/orders/${id}`, body, { skipAuth: true });
export const deletePointShopOrder = (id: number) => apiDelete<{ success: boolean }>(`${base}/point-shop/orders/${id}`, { skipAuth: true });

export const getFriendRelations = () => apiGet<FriendRelation[]>(`${base}/friends`, { skipAuth: true });
export const createFriendRelation = (body: FriendRelation) => apiPost<FriendRelation>(`${base}/friends`, body, { skipAuth: true });
export const updateFriendRelation = (id: number, body: FriendRelation) => apiPut<FriendRelation>(`${base}/friends/${id}`, body, { skipAuth: true });
export const deleteFriendRelation = (id: number) => apiDelete<{ success: boolean }>(`${base}/friends/${id}`, { skipAuth: true });
