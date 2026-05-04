import { useEffect, useMemo, useState } from "react";
import {
  AdminUser,
  BootstrapCounts,
  FriendRelation,
  GifticonInventory,
  ManagedCommunityComment,
  ManagedCommunityPost,
  ManagedEtf,
  ManagedGroupInsight,
  ManagedNewsArticle,
  PointShopOrder,
  PointShopProduct,
  PointWallet,
  createCommunityComment,
  createCommunityPost,
  createEtf,
  createFriendRelation,
  createGifticonInventory,
  createNews,
  createPointShopOrder,
  createPointShopProduct,
  deleteCommunityComment,
  deleteCommunityPost,
  deleteEtf,
  deleteFriendRelation,
  deleteGifticonInventory,
  deleteNews,
  deletePointShopOrder,
  deletePointShopProduct,
  deleteUser,
  getBootstrap,
  getCommunityPosts,
  getEtfs,
  getFriendRelations,
  getGifticonInventory,
  getHomeGroupInsight,
  getNews,
  getPointShopOrders,
  getPointShopProducts,
  getPointWallets,
  getUsers,
  updateCommunityComment,
  updateCommunityPost,
  updateEtf,
  updateFriendRelation,
  updateGifticonInventory,
  updateHomeGroupInsight,
  updateNews,
  updatePointShopOrder,
  updatePointShopProduct,
  updatePointWallet,
  updateUser,
} from "./services/adminConsoleService";

type TabKey =
  | "dashboard"
  | "etfs"
  | "news"
  | "community"
  | "insights"
  | "users"
  | "pointshop"
  | "friends";

type PointShopTab = "products" | "inventory" | "wallets" | "orders";

const navItems: Array<{ key: TabKey; label: string; description: string }> = [
  { key: "dashboard", label: "대시보드", description: "전체 현황" },
  { key: "etfs", label: "ETF", description: "편집, 분석, 탐색 데이터" },
  { key: "news", label: "뉴스", description: "기사와 메타데이터" },
  { key: "community", label: "커뮤니티", description: "글과 댓글" },
  { key: "insights", label: "홈 인사이트", description: "상위 그룹 인사이트" },
  { key: "users", label: "회원 관리", description: "조회, 수정, 삭제" },
  { key: "pointshop", label: "포인트샵", description: "상품, 재고, 지갑, 주문" },
  { key: "friends", label: "친구", description: "친구 관계 관리" },
];

const pointShopNav: Array<{ key: PointShopTab; label: string }> = [
  { key: "products", label: "상품" },
  { key: "inventory", label: "기프티콘 재고" },
  { key: "wallets", label: "포인트 지갑" },
  { key: "orders", label: "주문" },
];

const emptyEtfForm: ManagedEtf = {
  etfCode: "",
  title: "",
  theme: "",
  benchmark: "",
  period: "",
  riskLevel: "",
  returnRate: "",
  popularityScore: 0,
  favoriteCount: 0,
  imageUrl: "",
  shortDescription: "",
  holdingsJson: "[]",
  trendPointsJson: "[]",
  analysisSummaryJson: "{}",
  publishedAt: "",
};

const emptyNewsForm: ManagedNewsArticle = {
  newsKey: "",
  title: "",
  sourceLabel: "",
  imageUrl: "",
  stockCode: "",
  stockName: "",
  summary: "",
  content: "",
  companyInfoJson: "{}",
  tagsJson: "[]",
  opinionsJson: "[]",
  publishedAt: "",
};

const emptyPostForm: ManagedCommunityPost = {
  type: "GENERAL",
  authorName: "",
  authorProfileImageUrl: "",
  title: "",
  content: "",
  analysisReportId: "",
  likeCount: 0,
  comments: [],
};

const emptyCommentForm: ManagedCommunityComment = {
  authorName: "",
  authorProfileImageUrl: "",
  content: "",
};

const emptyInsightForm: ManagedGroupInsight = {
  topGroupId: null,
  topGroupName: "",
  dailyReturnRate: "",
  topPick: "",
  comment: "",
  consensusJson: "[]",
};

const emptyProductForm: PointShopProduct = {
  name: "",
  brand: "",
  category: "CAFE",
  pricePoint: 0,
  imageUrl: "",
  description: "",
  notice: "",
  status: "ACTIVE",
  stockCount: 0,
  sortOrder: 0,
};

const emptyInventoryForm: GifticonInventory = {
  productId: null,
  gifticonCode: "",
  gifticonUrl: "",
  expiredAt: "",
  status: "AVAILABLE",
  assignedOrderId: "",
};

const emptyOrderForm: PointShopOrder = {
  userId: null,
  productId: null,
  inventoryId: null,
  usedPoint: 0,
  status: "REQUESTED",
  pointTransactionId: "",
  failureReason: "",
  sentAt: "",
};

const emptyFriendForm: FriendRelation = {
  requesterUserId: null,
  addresseeUserId: null,
  status: "ACCEPTED",
};

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [pointShopTab, setPointShopTab] = useState<PointShopTab>("products");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bootstrap, setBootstrap] = useState<BootstrapCounts | null>(null);
  const [etfs, setEtfs] = useState<ManagedEtf[]>([]);
  const [news, setNews] = useState<ManagedNewsArticle[]>([]);
  const [posts, setPosts] = useState<ManagedCommunityPost[]>([]);
  const [insight, setInsight] = useState<ManagedGroupInsight>(emptyInsightForm);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<PointShopProduct[]>([]);
  const [inventory, setInventory] = useState<GifticonInventory[]>([]);
  const [wallets, setWallets] = useState<PointWallet[]>([]);
  const [orders, setOrders] = useState<PointShopOrder[]>([]);
  const [friends, setFriends] = useState<FriendRelation[]>([]);

  const [etfForm, setEtfForm] = useState<ManagedEtf>(emptyEtfForm);
  const [newsForm, setNewsForm] = useState<ManagedNewsArticle>(emptyNewsForm);
  const [postForm, setPostForm] = useState<ManagedCommunityPost>(emptyPostForm);
  const [commentForm, setCommentForm] = useState<ManagedCommunityComment>(emptyCommentForm);
  const [productForm, setProductForm] = useState<PointShopProduct>(emptyProductForm);
  const [inventoryForm, setInventoryForm] = useState<GifticonInventory>(emptyInventoryForm);
  const [orderForm, setOrderForm] = useState<PointShopOrder>(emptyOrderForm);
  const [friendForm, setFriendForm] = useState<FriendRelation>(emptyFriendForm);

  const [selectedEtfId, setSelectedEtfId] = useState<number | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);

  const [userForm, setUserForm] = useState<Partial<AdminUser>>({});
  const [walletForm, setWalletForm] = useState<{ userId: number | null; balance: number; description: string }>({
    userId: null,
    balance: 0,
    description: "Admin wallet adjustment",
  });

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: `${user.nickname} (${user.studentId})` })),
    [users],
  );
  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.id ?? 0, label: `${product.name} · ${product.brand ?? "-"}` })),
    [products],
  );
  const inventoryOptions = useMemo(
    () =>
      inventory.map((item) => ({
        value: item.id ?? 0,
        label: `${item.productName ?? "미지정"} · ${item.gifticonCode}`,
      })),
    [inventory],
  );

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setError(null);
    try {
      const [
        bootstrapRes,
        etfRes,
        newsRes,
        postRes,
        insightRes,
        userRes,
        productRes,
        inventoryRes,
        walletRes,
        orderRes,
        friendRes,
      ] = await Promise.all([
        getBootstrap(),
        getEtfs(),
        getNews(),
        getCommunityPosts(),
        getHomeGroupInsight(),
        getUsers(),
        getPointShopProducts(),
        getGifticonInventory(),
        getPointWallets(),
        getPointShopOrders(),
        getFriendRelations(),
      ]);
      setBootstrap(bootstrapRes);
      setEtfs(etfRes);
      setNews(newsRes);
      setPosts(postRes);
      setInsight({
        ...emptyInsightForm,
        ...insightRes,
        topGroupId: insightRes.topGroupId ?? null,
      });
      setUsers(userRes);
      setProducts(productRes);
      setInventory(inventoryRes);
      setWallets(walletRes);
      setOrders(orderRes);
      setFriends(friendRes);
    } catch (err) {
      setError(extractMessage(err));
    }
  }

  function resetSelection(scope: "etf" | "news" | "post" | "comment" | "user" | "product" | "inventory" | "order" | "friend") {
    if (scope === "etf") {
      setSelectedEtfId(null);
      setEtfForm(emptyEtfForm);
    }
    if (scope === "news") {
      setSelectedNewsId(null);
      setNewsForm(emptyNewsForm);
    }
    if (scope === "post") {
      setSelectedPostId(null);
      setPostForm(emptyPostForm);
      setSelectedCommentId(null);
      setCommentForm(emptyCommentForm);
    }
    if (scope === "comment") {
      setSelectedCommentId(null);
      setCommentForm(emptyCommentForm);
    }
    if (scope === "user") {
      setSelectedUserId(null);
      setUserForm({});
      setWalletForm({ userId: null, balance: 0, description: "Admin wallet adjustment" });
    }
    if (scope === "product") {
      setSelectedProductId(null);
      setProductForm(emptyProductForm);
    }
    if (scope === "inventory") {
      setSelectedInventoryId(null);
      setInventoryForm(emptyInventoryForm);
    }
    if (scope === "order") {
      setSelectedOrderId(null);
      setOrderForm(emptyOrderForm);
    }
    if (scope === "friend") {
      setSelectedFriendId(null);
      setFriendForm(emptyFriendForm);
    }
  }

  async function withMutation(token: string, action: () => Promise<void>) {
    setSaving(token);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setSaving(null);
    }
  }

  function selectEtf(item: ManagedEtf) {
    setSelectedEtfId(item.id ?? null);
    setEtfForm({
      ...emptyEtfForm,
      ...item,
      publishedAt: toLocalDateTimeInput(item.publishedAt),
    });
  }

  function selectNews(item: ManagedNewsArticle) {
    setSelectedNewsId(item.id ?? null);
    setNewsForm({
      ...emptyNewsForm,
      ...item,
      publishedAt: toLocalDateTimeInput(item.publishedAt),
    });
  }

  function selectPost(item: ManagedCommunityPost) {
    setSelectedPostId(item.id ?? null);
    setPostForm({ ...emptyPostForm, ...item });
    resetSelection("comment");
  }

  function selectComment(item: ManagedCommunityComment) {
    setSelectedCommentId(item.id ?? null);
    setCommentForm({ ...emptyCommentForm, ...item });
  }

  function selectUser(item: AdminUser) {
    setSelectedUserId(item.id);
    setUserForm({ ...item });
    setWalletForm({
      userId: item.id,
      balance: Number(item.pointBalance ?? 0),
      description: "Admin wallet adjustment",
    });
  }

  function selectProduct(item: PointShopProduct) {
    setSelectedProductId(item.id ?? null);
    setProductForm({ ...emptyProductForm, ...item });
  }

  function selectInventory(item: GifticonInventory) {
    setSelectedInventoryId(item.id ?? null);
    setInventoryForm({
      ...emptyInventoryForm,
      ...item,
      expiredAt: toLocalDateTimeInput(item.expiredAt),
    });
  }

  function selectOrder(item: PointShopOrder) {
    setSelectedOrderId(item.id ?? null);
    setOrderForm({
      ...emptyOrderForm,
      ...item,
      sentAt: toLocalDateTimeInput(item.sentAt),
    });
  }

  function selectFriend(item: FriendRelation) {
    setSelectedFriendId(item.id ?? null);
    setFriendForm({ ...emptyFriendForm, ...item });
  }

  const selectedPost = posts.find((item) => item.id === selectedPostId) ?? null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#eef2f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur lg:block">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">UniPort Admin</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">데이터 콘솔</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              ETF, 뉴스, 커뮤니티, 포인트샵, 친구, 회원 정보를 한 화면에서 관리합니다.
            </p>
          </div>
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  activeTab === item.key
                    ? "border-sky-300 bg-sky-50 text-sky-900 shadow-sm"
                    : "border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div className="text-sm font-bold">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">{item.description}</div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <header className="mb-6 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Data Workspace</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {navItems.find((item) => item.key === activeTab)?.label}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  인증 없이 운영 데이터 입력과 수정이 가능하도록 구성된 내부 관리 화면입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void loadAll()}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  전체 새로고침
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </header>

          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="ETF" value={bootstrap?.counts.etfs ?? etfs.length} tone="sky" />
            <MetricCard label="뉴스" value={bootstrap?.counts.news ?? news.length} tone="amber" />
            <MetricCard label="커뮤니티 글" value={bootstrap?.counts.communityPosts ?? posts.length} tone="emerald" />
            <MetricCard label="포인트샵 상품" value={bootstrap?.counts.products ?? products.length} tone="rose" />
            <MetricCard label="회원" value={bootstrap?.counts.users ?? users.length} tone="slate" />
          </div>

          {activeTab === "dashboard" && (
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <Panel title="운영 메모" description="문서 기반 우선 관리 범위를 요약했습니다.">
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  <li>ETF는 탐색 카드, 분석 요약, 보유 종목 JSON을 한 번에 편집합니다.</li>
                  <li>뉴스는 종목 연결, 태그, 의견 데이터까지 함께 관리합니다.</li>
                  <li>포인트샵은 상품, 재고, 지갑, 주문을 분리해 운영합니다.</li>
                  <li>회원 정보 수정은 마이페이지 성격의 프로필 필드까지 포함합니다.</li>
                </ul>
              </Panel>
              <Panel title="현재 데이터 규모" description="콘솔이 직접 다루는 항목 수입니다.">
                <div className="space-y-3 text-sm text-slate-700">
                  <DashboardRow label="ETF 항목" value={String(etfs.length)} />
                  <DashboardRow label="뉴스 기사" value={String(news.length)} />
                  <DashboardRow label="커뮤니티 댓글" value={String(posts.reduce((acc, post) => acc + (post.comments?.length ?? 0), 0))} />
                  <DashboardRow label="지갑 수" value={String(wallets.length)} />
                  <DashboardRow label="친구 관계" value={String(friends.length)} />
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "etfs" && (
            <CrudLayout
              listTitle="ETF 목록"
              formTitle={selectedEtfId ? "ETF 수정" : "ETF 생성"}
              onReset={() => resetSelection("etf")}
              list={
                <EntityList
                  items={etfs}
                  selectedId={selectedEtfId}
                  getId={(item) => item.id ?? 0}
                  getTitle={(item) => item.title}
                  getMeta={(item) => `${item.etfCode} · ${item.theme ?? "테마 없음"}`}
                  onSelect={selectEtf}
                  onDelete={(item) =>
                    void withMutation("delete-etf", async () => {
                      if (item.id) await deleteEtf(item.id);
                      await loadAll();
                      resetSelection("etf");
                    })
                  }
                />
              }
              form={
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void withMutation("save-etf", async () => {
                      if (selectedEtfId) {
                        await updateEtf(selectedEtfId, etfForm);
                      } else {
                        await createEtf(etfForm);
                      }
                      await loadAll();
                      resetSelection("etf");
                    });
                  }}
                >
                  <Field label="ETF 코드" value={etfForm.etfCode ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, etfCode: value }))} required />
                  <Field label="제목" value={etfForm.title ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, title: value }))} required />
                  <TwoCol>
                    <Field label="테마" value={etfForm.theme ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, theme: value }))} />
                    <Field label="벤치마크" value={etfForm.benchmark ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, benchmark: value }))} />
                  </TwoCol>
                  <TwoCol>
                    <Field label="기간" value={etfForm.period ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, period: value }))} />
                    <Field label="리스크 레벨" value={etfForm.riskLevel ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, riskLevel: value }))} />
                  </TwoCol>
                  <TwoCol>
                    <Field label="수익률" value={String(etfForm.returnRate ?? "")} onChange={(value) => setEtfForm((prev) => ({ ...prev, returnRate: value }))} />
                    <Field label="발행 시각" type="datetime-local" value={String(etfForm.publishedAt ?? "")} onChange={(value) => setEtfForm((prev) => ({ ...prev, publishedAt: value }))} />
                  </TwoCol>
                  <TwoCol>
                    <Field label="인기 점수" value={String(etfForm.popularityScore ?? 0)} onChange={(value) => setEtfForm((prev) => ({ ...prev, popularityScore: Number(value) }))} />
                    <Field label="즐겨찾기 수" value={String(etfForm.favoriteCount ?? 0)} onChange={(value) => setEtfForm((prev) => ({ ...prev, favoriteCount: Number(value) }))} />
                  </TwoCol>
                  <Field label="이미지 URL" value={etfForm.imageUrl ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, imageUrl: value }))} />
                  <Textarea label="짧은 설명" value={etfForm.shortDescription ?? ""} onChange={(value) => setEtfForm((prev) => ({ ...prev, shortDescription: value }))} />
                  <JsonArea label="보유 종목 JSON" value={etfForm.holdingsJson ?? "[]"} onChange={(value) => setEtfForm((prev) => ({ ...prev, holdingsJson: value }))} hint='예: [{"stockCode":"005930","weight":32.5}]' />
                  <JsonArea label="추세 포인트 JSON" value={etfForm.trendPointsJson ?? "[]"} onChange={(value) => setEtfForm((prev) => ({ ...prev, trendPointsJson: value }))} hint='예: [{"date":"2026-05-01","returnRate":3.2}]' />
                  <JsonArea label="분석 요약 JSON" value={etfForm.analysisSummaryJson ?? "{}"} onChange={(value) => setEtfForm((prev) => ({ ...prev, analysisSummaryJson: value }))} hint='예: {"highlights":[],"allocation":[],"risk":{}}' />
                  <PrimaryButton busy={saving === "save-etf"}>{selectedEtfId ? "ETF 수정 저장" : "ETF 생성"}</PrimaryButton>
                </form>
              }
            />
          )}

          {activeTab === "news" && (
            <CrudLayout
              listTitle="뉴스 기사 목록"
              formTitle={selectedNewsId ? "기사 수정" : "기사 생성"}
              onReset={() => resetSelection("news")}
              list={
                <EntityList
                  items={news}
                  selectedId={selectedNewsId}
                  getId={(item) => item.id ?? 0}
                  getTitle={(item) => item.title}
                  getMeta={(item) => `${item.newsKey} · ${item.sourceLabel ?? "출처 없음"}`}
                  onSelect={selectNews}
                  onDelete={(item) =>
                    void withMutation("delete-news", async () => {
                      if (item.id) await deleteNews(item.id);
                      await loadAll();
                      resetSelection("news");
                    })
                  }
                />
              }
              form={
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void withMutation("save-news", async () => {
                      if (selectedNewsId) {
                        await updateNews(selectedNewsId, newsForm);
                      } else {
                        await createNews(newsForm);
                      }
                      await loadAll();
                      resetSelection("news");
                    });
                  }}
                >
                  <Field label="기사 키" value={newsForm.newsKey ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, newsKey: value }))} required />
                  <Field label="제목" value={newsForm.title ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, title: value }))} required />
                  <TwoCol>
                    <Field label="출처" value={newsForm.sourceLabel ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, sourceLabel: value }))} />
                    <Field label="발행 시각" type="datetime-local" value={String(newsForm.publishedAt ?? "")} onChange={(value) => setNewsForm((prev) => ({ ...prev, publishedAt: value }))} />
                  </TwoCol>
                  <TwoCol>
                    <Field label="종목 코드" value={newsForm.stockCode ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, stockCode: value }))} />
                    <Field label="종목명" value={newsForm.stockName ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, stockName: value }))} />
                  </TwoCol>
                  <Field label="이미지 URL" value={newsForm.imageUrl ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, imageUrl: value }))} />
                  <Textarea label="요약" value={newsForm.summary ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, summary: value }))} />
                  <Textarea label="본문" rows={8} value={newsForm.content ?? ""} onChange={(value) => setNewsForm((prev) => ({ ...prev, content: value }))} />
                  <JsonArea label="회사 정보 JSON" value={newsForm.companyInfoJson ?? "{}"} onChange={(value) => setNewsForm((prev) => ({ ...prev, companyInfoJson: value }))} hint='예: {"stockCode":"005930","stockName":"삼성전자"}' />
                  <JsonArea label="태그 JSON" value={newsForm.tagsJson ?? "[]"} onChange={(value) => setNewsForm((prev) => ({ ...prev, tagsJson: value }))} hint='예: [{"label":"반도체"}]' />
                  <JsonArea label="오피니언 JSON" value={newsForm.opinionsJson ?? "[]"} onChange={(value) => setNewsForm((prev) => ({ ...prev, opinionsJson: value }))} hint='예: [{"source":"Broker","stance":"BUY"}]' />
                  <PrimaryButton busy={saving === "save-news"}>{selectedNewsId ? "기사 수정 저장" : "기사 생성"}</PrimaryButton>
                </form>
              }
            />
          )}

          {activeTab === "community" && (
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <Panel title="커뮤니티 글 목록" description="글 선택 후 수정하거나 바로 삭제할 수 있습니다.">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => resetSelection("post")}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    새 글 작성
                  </button>
                </div>
                <EntityList
                  items={posts}
                  selectedId={selectedPostId}
                  getId={(item) => item.id ?? 0}
                  getTitle={(item) => item.title}
                  getMeta={(item) => `${item.type} · 댓글 ${item.comments?.length ?? 0}개`}
                  onSelect={selectPost}
                  onDelete={(item) =>
                    void withMutation("delete-post", async () => {
                      if (item.id) await deleteCommunityPost(item.id);
                      await loadAll();
                      resetSelection("post");
                    })
                  }
                />
              </Panel>
              <Panel title={selectedPostId ? "커뮤니티 글 수정" : "커뮤니티 글 생성"} description="분석 공유 글도 같은 구조로 관리합니다.">
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void withMutation("save-post", async () => {
                      if (selectedPostId) {
                        await updateCommunityPost(selectedPostId, postForm);
                      } else {
                        await createCommunityPost(postForm);
                      }
                      await loadAll();
                      resetSelection("post");
                    });
                  }}
                >
                  <TwoCol>
                    <SelectField
                      label="글 타입"
                      value={postForm.type ?? "GENERAL"}
                      onChange={(value) => setPostForm((prev) => ({ ...prev, type: value }))}
                      options={[
                        { value: "GENERAL", label: "GENERAL" },
                        { value: "ACHIEVEMENT", label: "ACHIEVEMENT" },
                        { value: "ANALYSIS_SHARE", label: "ANALYSIS_SHARE" },
                      ]}
                    />
                    <Field label="좋아요 수" value={String(postForm.likeCount ?? 0)} onChange={(value) => setPostForm((prev) => ({ ...prev, likeCount: Number(value) }))} />
                  </TwoCol>
                  <Field label="작성자 이름" value={postForm.authorName ?? ""} onChange={(value) => setPostForm((prev) => ({ ...prev, authorName: value }))} required />
                  <Field label="작성자 프로필 이미지 URL" value={postForm.authorProfileImageUrl ?? ""} onChange={(value) => setPostForm((prev) => ({ ...prev, authorProfileImageUrl: value }))} />
                  <Field label="제목" value={postForm.title ?? ""} onChange={(value) => setPostForm((prev) => ({ ...prev, title: value }))} required />
                  <Field label="분석 리포트 ID" value={postForm.analysisReportId ?? ""} onChange={(value) => setPostForm((prev) => ({ ...prev, analysisReportId: value }))} />
                  <Textarea label="본문" rows={7} value={postForm.content ?? ""} onChange={(value) => setPostForm((prev) => ({ ...prev, content: value }))} required />
                  <PrimaryButton busy={saving === "save-post"}>{selectedPostId ? "글 수정 저장" : "글 생성"}</PrimaryButton>
                </form>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">댓글 관리</h3>
                      <p className="mt-1 text-sm text-slate-500">선택한 글의 댓글을 직접 수정하거나 추가합니다.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetSelection("comment")}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      댓글 새로 입력
                    </button>
                  </div>
                  {selectedPost ? (
                    <>
                      <div className="mb-4 space-y-2 rounded-2xl bg-slate-50 p-4">
                        {(selectedPost.comments ?? []).length === 0 && (
                          <p className="text-sm text-slate-500">등록된 댓글이 없습니다.</p>
                        )}
                        {(selectedPost.comments ?? []).map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                                <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => selectComment(comment)}
                                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void withMutation("delete-comment", async () => {
                                      if (comment.id) await deleteCommunityComment(comment.id);
                                      await loadAll();
                                      resetSelection("comment");
                                    })
                                  }
                                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
                                >
                                  삭제
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form
                        className="space-y-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void withMutation("save-comment", async () => {
                            if (!selectedPost.id) return;
                            if (selectedCommentId) {
                              await updateCommunityComment(selectedCommentId, commentForm);
                            } else {
                              await createCommunityComment(selectedPost.id, commentForm);
                            }
                            await loadAll();
                            resetSelection("comment");
                          });
                        }}
                      >
                        <Field label="댓글 작성자" value={commentForm.authorName ?? ""} onChange={(value) => setCommentForm((prev) => ({ ...prev, authorName: value }))} required />
                        <Field label="댓글 작성자 프로필 이미지 URL" value={commentForm.authorProfileImageUrl ?? ""} onChange={(value) => setCommentForm((prev) => ({ ...prev, authorProfileImageUrl: value }))} />
                        <Textarea label="댓글 본문" value={commentForm.content ?? ""} onChange={(value) => setCommentForm((prev) => ({ ...prev, content: value }))} required />
                        <PrimaryButton busy={saving === "save-comment"}>{selectedCommentId ? "댓글 수정 저장" : "댓글 생성"}</PrimaryButton>
                      </form>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                      먼저 왼쪽에서 글을 선택하면 해당 글의 댓글을 관리할 수 있습니다.
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "insights" && (
            <Panel title="홈 대시보드 상위 그룹 인사이트" description="`/api/home/group-insights`에 들어갈 운영 데이터를 관리합니다.">
              <form
                className="grid gap-4 xl:grid-cols-[1fr_1fr]"
                onSubmit={(event) => {
                  event.preventDefault();
                  void withMutation("save-insight", async () => {
                    await updateHomeGroupInsight(insight);
                    await loadAll();
                  });
                }}
              >
                <div className="space-y-4">
                  <Field label="상위 그룹 ID" value={String(insight.topGroupId ?? "")} onChange={(value) => setInsight((prev) => ({ ...prev, topGroupId: value === "" ? null : Number(value) }))} />
                  <Field label="상위 그룹명" value={insight.topGroupName ?? ""} onChange={(value) => setInsight((prev) => ({ ...prev, topGroupName: value }))} />
                  <Field label="일간 수익률" value={String(insight.dailyReturnRate ?? "")} onChange={(value) => setInsight((prev) => ({ ...prev, dailyReturnRate: value }))} />
                  <Field label="Top Pick" value={insight.topPick ?? ""} onChange={(value) => setInsight((prev) => ({ ...prev, topPick: value }))} />
                  <Textarea label="코멘트" rows={7} value={insight.comment ?? ""} onChange={(value) => setInsight((prev) => ({ ...prev, comment: value }))} />
                </div>
                <div className="space-y-4">
                  <JsonArea
                    label="합의 종목 JSON"
                    value={insight.consensusJson ?? "[]"}
                    onChange={(value) => setInsight((prev) => ({ ...prev, consensusJson: value }))}
                    hint='예: [{"stockCode":"NVDA","stockName":"NVIDIA","confidenceRate":92}]'
                  />
                  <PrimaryButton busy={saving === "save-insight"}>인사이트 저장</PrimaryButton>
                </div>
              </form>
            </Panel>
          )}

          {activeTab === "users" && (
            <CrudLayout
              listTitle="회원 목록"
              formTitle={selectedUserId ? "회원 정보 수정" : "회원 선택"}
              onReset={() => resetSelection("user")}
              list={
                <EntityList
                  items={users}
                  selectedId={selectedUserId}
                  getId={(item) => item.id}
                  getTitle={(item) => item.nickname}
                  getMeta={(item) => `${item.studentId} · ${item.role ?? "user"} · ${item.pointBalance ?? 0}P`}
                  onSelect={selectUser}
                  onDelete={(item) =>
                    void withMutation("delete-user", async () => {
                      await deleteUser(item.id);
                      await loadAll();
                      resetSelection("user");
                    })
                  }
                />
              }
              form={
                selectedUserId ? (
                  <div className="space-y-8">
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void withMutation("save-user", async () => {
                          await updateUser(selectedUserId, userForm);
                          await loadAll();
                        });
                      }}
                    >
                      <Field label="학번" value={String(userForm.studentId ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, studentId: value }))} />
                      <Field label="닉네임" value={String(userForm.nickname ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, nickname: value }))} />
                      <TwoCol>
                        <Field label="이메일" value={String(userForm.email ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, email: value }))} />
                        <Field label="전화번호" value={String(userForm.phoneNumber ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, phoneNumber: value }))} />
                      </TwoCol>
                      <Field label="프로필 이미지 URL" value={String(userForm.profileImageUrl ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, profileImageUrl: value }))} />
                      <TwoCol>
                        <Field label="팀 ID" value={String(userForm.teamId ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, teamId: value }))} />
                        <SelectField
                          label="권한"
                          value={String(userForm.role ?? "user")}
                          onChange={(value) => setUserForm((prev) => ({ ...prev, role: value }))}
                          options={[
                            { value: "user", label: "user" },
                            { value: "admin", label: "admin" },
                            { value: "sisu_admin", label: "sisu_admin" },
                          ]}
                        />
                      </TwoCol>
                      <TwoCol>
                        <Field label="투자 성향 결과" value={String(userForm.investmentProfileResult ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, investmentProfileResult: value }))} />
                        <Field label="투자 레벨" value={String(userForm.investmentLevel ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, investmentLevel: value }))} />
                      </TwoCol>
                      <Field label="관심 섹터" value={String(userForm.interestSector ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, interestSector: value }))} />
                      <TwoCol>
                        <Field label="총 자산" value={String(userForm.totalAssets ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, totalAssets: value }))} />
                        <Field label="투자 원금" value={String(userForm.investmentAmount ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, investmentAmount: value }))} />
                      </TwoCol>
                      <TwoCol>
                        <Field label="손익" value={String(userForm.profitLoss ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, profitLoss: value }))} />
                        <Field label="손익률" value={String(userForm.profitLossRate ?? "")} onChange={(value) => setUserForm((prev) => ({ ...prev, profitLossRate: value }))} />
                      </TwoCol>
                      <PrimaryButton busy={saving === "save-user"}>회원 정보 저장</PrimaryButton>
                    </form>

                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-base font-bold text-slate-900">포인트 지갑 조정</h3>
                      <p className="mt-1 text-sm text-slate-500">마이페이지/포인트샵 운영을 위해 지갑 잔액을 직접 맞춥니다.</p>
                      <form
                        className="mt-4 space-y-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!walletForm.userId) return;
                          void withMutation("save-wallet", async () => {
                            await updatePointWallet(walletForm.userId, {
                              balance: walletForm.balance,
                              description: walletForm.description,
                            });
                            await loadAll();
                          });
                        }}
                      >
                        <TwoCol>
                          <Field label="포인트 잔액" value={String(walletForm.balance)} onChange={(value) => setWalletForm((prev) => ({ ...prev, balance: Number(value) }))} />
                          <Field label="조정 사유" value={walletForm.description} onChange={(value) => setWalletForm((prev) => ({ ...prev, description: value }))} />
                        </TwoCol>
                        <PrimaryButton busy={saving === "save-wallet"}>지갑 저장</PrimaryButton>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    왼쪽에서 회원을 선택하면 프로필과 포인트 지갑을 함께 수정할 수 있습니다.
                  </div>
                )
              }
            />
          )}

          {activeTab === "pointshop" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {pointShopNav.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPointShopTab(item.key)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      pointShopTab === item.key ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {pointShopTab === "products" && (
                <CrudLayout
                  listTitle="포인트샵 상품"
                  formTitle={selectedProductId ? "상품 수정" : "상품 생성"}
                  onReset={() => resetSelection("product")}
                  list={
                    <EntityList
                      items={products}
                      selectedId={selectedProductId}
                      getId={(item) => item.id ?? 0}
                      getTitle={(item) => item.name}
                      getMeta={(item) => `${item.brand ?? "-"} · ${item.pricePoint ?? 0}P · ${item.status ?? "-"}`}
                      onSelect={selectProduct}
                      onDelete={(item) =>
                        void withMutation("delete-product", async () => {
                          if (item.id) await deletePointShopProduct(item.id);
                          await loadAll();
                          resetSelection("product");
                        })
                      }
                    />
                  }
                  form={
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void withMutation("save-product", async () => {
                          if (selectedProductId) {
                            await updatePointShopProduct(selectedProductId, productForm);
                          } else {
                            await createPointShopProduct(productForm);
                          }
                          await loadAll();
                          resetSelection("product");
                        });
                      }}
                    >
                      <Field label="상품명" value={productForm.name ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, name: value }))} required />
                      <TwoCol>
                        <Field label="브랜드" value={productForm.brand ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, brand: value }))} />
                        <Field label="카테고리" value={productForm.category ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, category: value }))} />
                      </TwoCol>
                      <TwoCol>
                        <Field label="필요 포인트" value={String(productForm.pricePoint ?? 0)} onChange={(value) => setProductForm((prev) => ({ ...prev, pricePoint: Number(value) }))} />
                        <Field label="노출 순서" value={String(productForm.sortOrder ?? 0)} onChange={(value) => setProductForm((prev) => ({ ...prev, sortOrder: Number(value) }))} />
                      </TwoCol>
                      <TwoCol>
                        <Field label="재고 수량" value={String(productForm.stockCount ?? 0)} onChange={(value) => setProductForm((prev) => ({ ...prev, stockCount: Number(value) }))} />
                        <SelectField
                          label="상태"
                          value={productForm.status ?? "ACTIVE"}
                          onChange={(value) => setProductForm((prev) => ({ ...prev, status: value }))}
                          options={[
                            { value: "ACTIVE", label: "ACTIVE" },
                            { value: "SOLD_OUT", label: "SOLD_OUT" },
                            { value: "HIDDEN", label: "HIDDEN" },
                          ]}
                        />
                      </TwoCol>
                      <Field label="이미지 URL" value={productForm.imageUrl ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, imageUrl: value }))} />
                      <Textarea label="설명" value={productForm.description ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, description: value }))} />
                      <Textarea label="유의사항" value={productForm.notice ?? ""} onChange={(value) => setProductForm((prev) => ({ ...prev, notice: value }))} />
                      <PrimaryButton busy={saving === "save-product"}>{selectedProductId ? "상품 수정 저장" : "상품 생성"}</PrimaryButton>
                    </form>
                  }
                />
              )}

              {pointShopTab === "inventory" && (
                <CrudLayout
                  listTitle="기프티콘 재고"
                  formTitle={selectedInventoryId ? "재고 수정" : "재고 생성"}
                  onReset={() => resetSelection("inventory")}
                  list={
                    <EntityList
                      items={inventory}
                      selectedId={selectedInventoryId}
                      getId={(item) => item.id ?? 0}
                      getTitle={(item) => item.gifticonCode}
                      getMeta={(item) => `${item.productName ?? "미지정"} · ${item.status ?? "-"}`}
                      onSelect={selectInventory}
                      onDelete={(item) =>
                        void withMutation("delete-inventory", async () => {
                          if (item.id) await deleteGifticonInventory(item.id);
                          await loadAll();
                          resetSelection("inventory");
                        })
                      }
                    />
                  }
                  form={
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void withMutation("save-inventory", async () => {
                          if (selectedInventoryId) {
                            await updateGifticonInventory(selectedInventoryId, inventoryForm);
                          } else {
                            await createGifticonInventory(inventoryForm);
                          }
                          await loadAll();
                          resetSelection("inventory");
                        });
                      }}
                    >
                      <SelectField
                        label="상품"
                        value={String(inventoryForm.productId ?? "")}
                        onChange={(value) => setInventoryForm((prev) => ({ ...prev, productId: value === "" ? null : Number(value) }))}
                        options={[{ value: "", label: "상품 선택" }, ...productOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                      />
                      <Field label="기프티콘 코드" value={inventoryForm.gifticonCode ?? ""} onChange={(value) => setInventoryForm((prev) => ({ ...prev, gifticonCode: value }))} required />
                      <Field label="기프티콘 URL" value={inventoryForm.gifticonUrl ?? ""} onChange={(value) => setInventoryForm((prev) => ({ ...prev, gifticonUrl: value }))} />
                      <TwoCol>
                        <Field label="만료 시각" type="datetime-local" value={String(inventoryForm.expiredAt ?? "")} onChange={(value) => setInventoryForm((prev) => ({ ...prev, expiredAt: value }))} />
                        <SelectField
                          label="상태"
                          value={inventoryForm.status ?? "AVAILABLE"}
                          onChange={(value) => setInventoryForm((prev) => ({ ...prev, status: value }))}
                          options={[
                            { value: "AVAILABLE", label: "AVAILABLE" },
                            { value: "RESERVED", label: "RESERVED" },
                            { value: "SENT", label: "SENT" },
                            { value: "EXPIRED", label: "EXPIRED" },
                          ]}
                        />
                      </TwoCol>
                      <Field label="할당 주문 ID" value={inventoryForm.assignedOrderId ?? ""} onChange={(value) => setInventoryForm((prev) => ({ ...prev, assignedOrderId: value }))} />
                      <PrimaryButton busy={saving === "save-inventory"}>{selectedInventoryId ? "재고 수정 저장" : "재고 생성"}</PrimaryButton>
                    </form>
                  }
                />
              )}

              {pointShopTab === "wallets" && (
                <CrudLayout
                  listTitle="포인트 지갑"
                  formTitle={walletForm.userId ? "지갑 조정" : "회원 선택"}
                  onReset={() => resetSelection("user")}
                  list={
                    <EntityList
                      items={wallets}
                      selectedId={walletForm.userId}
                      getId={(item) => item.userId ?? 0}
                      getTitle={(item) => item.nickname ?? "미지정"}
                      getMeta={(item) => `${item.studentId ?? "-"} · ${item.balance ?? 0}P`}
                      onSelect={(item) =>
                        setWalletForm({
                          userId: item.userId ?? null,
                          balance: Number(item.balance ?? 0),
                          description: "Admin wallet adjustment",
                        })
                      }
                    />
                  }
                  form={
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!walletForm.userId) return;
                        void withMutation("save-wallet-only", async () => {
                          await updatePointWallet(walletForm.userId!, {
                            balance: walletForm.balance,
                            description: walletForm.description,
                          });
                          await loadAll();
                        });
                      }}
                    >
                      <SelectField
                        label="회원"
                        value={String(walletForm.userId ?? "")}
                        onChange={(value) => setWalletForm((prev) => ({ ...prev, userId: value === "" ? null : Number(value) }))}
                        options={[{ value: "", label: "회원 선택" }, ...userOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                      />
                      <Field label="잔액" value={String(walletForm.balance)} onChange={(value) => setWalletForm((prev) => ({ ...prev, balance: Number(value) }))} />
                      <Field label="조정 사유" value={walletForm.description} onChange={(value) => setWalletForm((prev) => ({ ...prev, description: value }))} />
                      <PrimaryButton busy={saving === "save-wallet-only"}>지갑 저장</PrimaryButton>
                    </form>
                  }
                />
              )}

              {pointShopTab === "orders" && (
                <CrudLayout
                  listTitle="포인트샵 주문"
                  formTitle={selectedOrderId ? "주문 수정" : "주문 생성"}
                  onReset={() => resetSelection("order")}
                  list={
                    <EntityList
                      items={orders}
                      selectedId={selectedOrderId}
                      getId={(item) => item.id ?? 0}
                      getTitle={(item) => `${item.nickname ?? "-"} / ${item.productName ?? "-"}`}
                      getMeta={(item) => `${item.status ?? "-"} · ${item.usedPoint ?? 0}P`}
                      onSelect={selectOrder}
                      onDelete={(item) =>
                        void withMutation("delete-order", async () => {
                          if (item.id) await deletePointShopOrder(item.id);
                          await loadAll();
                          resetSelection("order");
                        })
                      }
                    />
                  }
                  form={
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void withMutation("save-order", async () => {
                          if (selectedOrderId) {
                            await updatePointShopOrder(selectedOrderId, orderForm);
                          } else {
                            await createPointShopOrder(orderForm);
                          }
                          await loadAll();
                          resetSelection("order");
                        });
                      }}
                    >
                      <SelectField
                        label="회원"
                        value={String(orderForm.userId ?? "")}
                        onChange={(value) => setOrderForm((prev) => ({ ...prev, userId: value === "" ? null : Number(value) }))}
                        options={[{ value: "", label: "회원 선택" }, ...userOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                      />
                      <SelectField
                        label="상품"
                        value={String(orderForm.productId ?? "")}
                        onChange={(value) => setOrderForm((prev) => ({ ...prev, productId: value === "" ? null : Number(value) }))}
                        options={[{ value: "", label: "상품 선택" }, ...productOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                      />
                      <SelectField
                        label="재고"
                        value={String(orderForm.inventoryId ?? "")}
                        onChange={(value) => setOrderForm((prev) => ({ ...prev, inventoryId: value === "" ? null : Number(value) }))}
                        options={[{ value: "", label: "재고 선택" }, ...inventoryOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                      />
                      <TwoCol>
                        <Field label="사용 포인트" value={String(orderForm.usedPoint ?? 0)} onChange={(value) => setOrderForm((prev) => ({ ...prev, usedPoint: Number(value) }))} />
                        <SelectField
                          label="상태"
                          value={orderForm.status ?? "REQUESTED"}
                          onChange={(value) => setOrderForm((prev) => ({ ...prev, status: value }))}
                          options={[
                            { value: "REQUESTED", label: "REQUESTED" },
                            { value: "SENT", label: "SENT" },
                            { value: "FAILED", label: "FAILED" },
                            { value: "REFUNDED", label: "REFUNDED" },
                            { value: "CANCELED", label: "CANCELED" },
                          ]}
                        />
                      </TwoCol>
                      <Field label="포인트 트랜잭션 ID" value={orderForm.pointTransactionId ?? ""} onChange={(value) => setOrderForm((prev) => ({ ...prev, pointTransactionId: value }))} />
                      <Field label="실패 사유" value={orderForm.failureReason ?? ""} onChange={(value) => setOrderForm((prev) => ({ ...prev, failureReason: value }))} />
                      <Field label="발송 시각" type="datetime-local" value={String(orderForm.sentAt ?? "")} onChange={(value) => setOrderForm((prev) => ({ ...prev, sentAt: value }))} />
                      <PrimaryButton busy={saving === "save-order"}>{selectedOrderId ? "주문 수정 저장" : "주문 생성"}</PrimaryButton>
                    </form>
                  }
                />
              )}
            </div>
          )}

          {activeTab === "friends" && (
            <CrudLayout
              listTitle="친구 관계"
              formTitle={selectedFriendId ? "친구 관계 수정" : "친구 관계 생성"}
              onReset={() => resetSelection("friend")}
              list={
                <EntityList
                  items={friends}
                  selectedId={selectedFriendId}
                  getId={(item) => item.id ?? 0}
                  getTitle={(item) => `${item.requesterNickname ?? "-"} → ${item.addresseeNickname ?? "-"}`}
                  getMeta={(item) => item.status ?? "-"}
                  onSelect={selectFriend}
                  onDelete={(item) =>
                    void withMutation("delete-friend", async () => {
                      if (item.id) await deleteFriendRelation(item.id);
                      await loadAll();
                      resetSelection("friend");
                    })
                  }
                />
              }
              form={
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void withMutation("save-friend", async () => {
                      if (selectedFriendId) {
                        await updateFriendRelation(selectedFriendId, friendForm);
                      } else {
                        await createFriendRelation(friendForm);
                      }
                      await loadAll();
                      resetSelection("friend");
                    });
                  }}
                >
                  <SelectField
                    label="요청자"
                    value={String(friendForm.requesterUserId ?? "")}
                    onChange={(value) => setFriendForm((prev) => ({ ...prev, requesterUserId: value === "" ? null : Number(value) }))}
                    options={[{ value: "", label: "회원 선택" }, ...userOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                  />
                  <SelectField
                    label="대상자"
                    value={String(friendForm.addresseeUserId ?? "")}
                    onChange={(value) => setFriendForm((prev) => ({ ...prev, addresseeUserId: value === "" ? null : Number(value) }))}
                    options={[{ value: "", label: "회원 선택" }, ...userOptions.map((item) => ({ value: String(item.value), label: item.label }))]}
                  />
                  <SelectField
                    label="상태"
                    value={friendForm.status ?? "ACCEPTED"}
                    onChange={(value) => setFriendForm((prev) => ({ ...prev, status: value }))}
                    options={[
                      { value: "PENDING", label: "PENDING" },
                      { value: "ACCEPTED", label: "ACCEPTED" },
                      { value: "REJECTED", label: "REJECTED" },
                    ]}
                  />
                  <PrimaryButton busy={saving === "save-friend"}>{selectedFriendId ? "친구 관계 수정 저장" : "친구 관계 생성"}</PrimaryButton>
                </form>
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function CrudLayout({
  listTitle,
  formTitle,
  onReset,
  list,
  form,
}: {
  listTitle: string;
  formTitle: string;
  onReset: () => void;
  list: React.ReactNode;
  form: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Panel title={listTitle}>{list}</Panel>
      <Panel title={formTitle}>
        <div className="mb-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            폼 초기화
          </button>
        </div>
        {form}
      </Panel>
    </div>
  );
}

function EntityList<T>({
  items,
  selectedId,
  getId,
  getTitle,
  getMeta,
  onSelect,
  onDelete,
}: {
  items: T[];
  selectedId?: number | null;
  getId: (item: T) => number;
  getTitle: (item: T) => string;
  getMeta?: (item: T) => string;
  onSelect: (item: T) => void;
  onDelete?: (item: T) => void;
}) {
  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">아직 등록된 데이터가 없습니다.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const itemId = getId(item);
        const selected = selectedId === itemId;
        return (
          <div
            key={itemId}
            className={`rounded-2xl border p-4 transition ${
              selected ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => onSelect(item)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-bold text-slate-900">{getTitle(item)}</div>
                {getMeta && <div className="mt-1 text-xs leading-5 text-slate-500">{getMeta(item)}</div>}
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "sky" | "amber" | "emerald" | "rose" | "slate";
}) {
  const toneClass =
    tone === "sky"
      ? "from-sky-500/15 to-sky-500/5 text-sky-900"
      : tone === "amber"
        ? "from-amber-500/15 to-amber-500/5 text-amber-900"
        : tone === "emerald"
          ? "from-emerald-500/15 to-emerald-500/5 text-emerald-900"
          : tone === "rose"
            ? "from-rose-500/15 to-rose-500/5 text-rose-900"
            : "from-slate-500/15 to-slate-500/5 text-slate-900";
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-gradient-to-br ${toneClass} px-5 py-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function DashboardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span>{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </label>
  );
}

function JsonArea({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Textarea label={label} value={value} onChange={onChange} rows={7} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function PrimaryButton({
  children,
  busy,
}: {
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "저장 중..." : children}
    </button>
  );
}

function extractMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return "요청 처리 중 오류가 발생했습니다.";
}

function toLocalDateTimeInput(value?: string | null) {
  if (!value) return "";
  return value.length >= 16 ? value.slice(0, 16) : value;
}

export default App;
