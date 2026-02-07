# 하드코딩된 데이터 파악 보고서

프로젝트 루트(`src`) 기준으로 순회하여 발견한 하드코딩 데이터를 분류·정리했습니다.

---

## 1. 외부 URL / API 도메인 (하드코딩)

### 1-1. 이미지·에셋 URL

| 파일                                | 용도                           | 예시                                                                       |
| ----------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `src/contexts/AuthContext.tsx`      | 회원가입 시 프로필 이미지      | `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`              |
| `src/components/feature/Header.tsx` | 로고 이미지                    | `https://static.readdy.ai/image/.../ea3b02d7dfa7aa2392d9ab077f231aca.webp` |
| `src/pages/login/page.tsx`          | 로그인 페이지 이미지           | 동일 readdy.ai static URL                                                  |
| `src/pages/signup/page.tsx`         | 회원가입 페이지 이미지         | 동일 readdy.ai static URL                                                  |
| `src/pages/chat/page.tsx`           | 현재 사용자/채팅 프로필 이미지 | `https://readdy.ai/api/search-image?query=...&seq=user001&...`             |

### 1-2. readdy.ai API (프로필·검색 이미지)

- **도메인**: `https://readdy.ai/api/search-image`, `https://static.readdy.ai/image/...`
- **사용처**
  - `src/mocks/userData.ts` (mock 사용자 프로필 3건)
  - `src/mocks/chatData.ts` (채팅 유저 프로필 7건)
  - `src/mocks/voteData.ts` (투표 제안자·참여자 프로필 6건)
  - `src/mocks/rankingData.ts` (랭킹 그룹 이미지 8건, 동일 static URL)
  - `src/mocks/groupPortfolioData.ts` (그룹·멤버 프로필 6건)
  - `src/mocks/competingTeamsData.ts` (경쟁 팀 프로필 4건)
  - `src/services/matchingRoomService.ts` (매칭방 defaultRooms 멤버 프로필 6건)

### 1-3. 외부 스크립트

| 파일                                               | 용도            |
| -------------------------------------------------- | --------------- | ---------------------------------- |
| `src/pages/stock-detail/components/StockChart.tsx` | 차트 라이브러리 | `https://s3.tradingview.com/tv.js` |

**권장**: API/이미지 베이스 URL은 `.env`(예: `VITE_IMAGE_BASE_URL`, `VITE_READDY_API`)로 분리하고, 코드에서는 `import.meta.env`로 참조하는 것이 좋습니다.

---

## 2. Mock 사용자·인증 관련 (하드코딩)

### 2-1. 테스트 계정 (평문 비밀번호)

**파일**: `src/mocks/userData.ts`

| 이메일              | 비밀번호 | 비고                 |
| ------------------- | -------- | -------------------- |
| `test@test.com`     | `1234`   | 닉네임: 투자왕김철수 |
| `demo@demo.com`     | `demo`   | 닉네임: 주식고수     |
| `investor@test.com` | `1234`   | 닉네임: 수익률왕     |

- `AuthContext.tsx`에서 위 mock 사용자로 로그인 검증 시 사용.
- **보안**: 운영 환경에서는 mock 사용자/평문 비밀번호 제거 또는 환경 변수·백엔드 연동으로 대체 필요.

### 2-2. 기본 자산 상수

**파일**: `src/mocks/userData.ts`

```ts
DEFAULT_ASSETS = {
  totalAssets: 10000000, // 1000만원
  investmentAmount: 0,
  profitLoss: 0,
  profitLossRate: 0,
};
```

- 신규 가입 사용자 초기 자산으로 사용.

---

## 3. 시장·종목 데이터 (하드코딩)

### 3-1. `src/mocks/stockMarketData.ts`

- **지수**: 코스피, 코스닥, 나스닥 (수치, 등락률)
- **종목**: 삼성전자, SK하이닉스, LG에너지솔루션, 현대차, POSCO홀딩스, 네이버 등
  - `stocksByVolume`, `stocksByRising`, `stocksByFalling` (가격, 등락률, 로고 컬러 등)

### 3-2. `src/mocks/stockDetailData.ts`

- 종목 ID 1, 2, 3 (삼성전자, SK하이닉스, LG에너지솔루션)에 대한:
  - 현재가, 등락, 보유 수량·평균단가·손익
  - 시장 데이터(시가, 종가, 거래량, 고/저)
  - 분기별 재무 데이터
  - 뉴스 목록(제목, 매체, 날짜, 요약)
  - 회사 소개 텍스트

실서비스 연동 시 위 데이터는 API 응답으로 대체하는 것이 좋습니다.

---

## 4. 투자·자산·대회 (하드코딩)

### 4-1. `src/mocks/investmentData.ts`

- `investmentData`: 총자산 10,500,000 / 손익 500,000 / 투자원금 10,000,000 / 현금 3,200,000 등
- `stockHoldings`: 삼성전자 50주, SK하이닉스 30주 등 보유 종목
- `competitionData`: 대회 이름, 종료일 `2025-02-28`, D-day 30일 (랭킹 방식: 기간 내 투자 후 최종 수익률로 순위·승자 결정)

### 4-2. `src/mocks/competitionData.ts`

- 진행 중 대회 3건: 종료일 `2025-02-15`, `2025-02-20`, `2025-02-10`
- 예정 대회 4건: 시작일 `2025-03-01`, `2025-03-05`, `2025-03-10`, `2025-02-28`

### 4-3. `src/mocks/groupPortfolioData.ts`

- 그룹 정보: 이름 "투자의 신", 총 평가액 12,500,000, 투자원금 10,000,000 등
- 보유 종목 4건 (삼성전자, SK하이닉스, NAVER, 카카오) 및 그룹 멤버 5명

---

## 5. 랭킹·채팅·투표 (하드코딩)

### 5-1. `src/mocks/rankingData.ts`

- `allGroupsRanking`: 7개 그룹 (자산 9,550,000 ~ 9,999,999, 수익률 -5% ~ 9%)
- `myGroupRanking`: 내 그룹 1건 (동일 구조)
- 그룹명: "그룹 이름", "나 그룹 이름" 등 반복

### 5-2. `src/mocks/chatData.ts`

- 채팅 메시지 목록: 유저 닉네임(김투자, 박주식, 이재테크, 최수익), 메시지 내용, 매수/매도 거래 내역, 타임스탬프

### 5-3. `src/mocks/voteData.ts`

- 투표 2건: 삼성전자 매수, SK하이닉스 매도
- 제안자·참여자 닉네임, 수량, 가격, 사유, 찬성/반대, 만료 텍스트("23시간 남음") 등

---

## 6. UI/라우팅 관련 하드코딩

### 6-1. 라우트 경로

**파일**: `src/router/config.tsx`

- `/`, `/competition`, `/ranking`, `/group-portfolio`, `/mock-investment`, `/stock-detail`, `/chat`, `/login`, `/signup`, `/feedback-report`, `/matching-rooms`, `*`(NotFound)

### 6-2. 페이지 내 한국어 문구

- `src/pages/home/page.tsx`: "진행 중인 대회", "대회 이름" 등
- 기타 페이지에도 버튼/레이블/에러 메시지 등 한국어 문자열이 직접 포함되어 있음  
  → 다국어 적용 시 i18n 키로 분리하는 것이 좋습니다.

### 6-3. AuthContext 메시지

**파일**: `src/contexts/AuthContext.tsx`

- "로그인 성공!", "이메일 또는 비밀번호가 올바르지 않습니다.", "이미 존재하는 이메일입니다", "이미 존재하는 닉네임입니다", "회원가입이 완료되었습니다"  
  → i18n 또는 상수 파일로 분리 권장.

---

## 7. 요약 표

| 구분              | 위치                                               | 내용                                      |
| ----------------- | -------------------------------------------------- | ----------------------------------------- |
| **외부 URL**      | AuthContext, Header, login/signup/chat, mocks 다수 | readdy.ai, dicebear, TradingView 스크립트 |
| **테스트 계정**   | `mocks/userData.ts`                                | 이메일 3건, 평문 비밀번호                 |
| **초기 자산**     | `mocks/userData.ts`                                | DEFAULT_ASSETS (1000만원 등)              |
| **시장/종목**     | `stockMarketData.ts`, `stockDetailData.ts`         | 지수, 종목 리스트, 종목 상세, 뉴스        |
| **투자/대회**     | `investmentData.ts`, `competitionData.ts`          | 자산, 보유 종목, 대회 일정(랭킹 방식)     |
| **그룹/랭킹**     | `groupPortfolioData.ts`, `rankingData.ts`          | 그룹 포트폴리오, 랭킹 리스트              |
| **채팅/투표**     | `chatData.ts`, `voteData.ts`                       | 메시지, 투표 건                           |
| **매칭방/경쟁팀** | `matchingRoomService.ts`, `competingTeamsData.ts`  | 매칭방 멤버·경쟁 팀 프로필(readdy URL)    |
| **문구**          | AuthContext, 각 페이지                             | 로그인/회원가입 메시지, UI 라벨           |

---

## 8. API 명세 대비 미연동 항목

| 명세 항목 | 사용처 | 비고 |
| --------- | ------ | ----- |
| **POST** `/api/trades` 또는 `/api/orders` (매수/매도 체결) | stock-detail | 종목 상세에서 "계획 공유"만 수행, 주문 체결 API 미호출 |
| **POST** `/api/groups/:groupId/votes/:voteId` (투표 제출) | chat | 투표 시 로컬 state만 갱신, 서버 제출 API 미호출 |
| **POST** `/api/groups/:groupId/chat/messages` (채팅/거래 계획 전송) | chat | 메시지 전송 시 로컬 추가만, REST/WebSocket 미연동 |

- 상세 스키마는 `docs/API_SPEC.md`, 경로는 `docs/BACKEND_API_LIST.md` 참고.

## 9. 권장 조치

1. **환경 변수**: API/이미지 베이스 URL, (필요 시) mock 사용 여부를 `.env`로 분리.
2. **Mock 데이터**: 개발용으로만 사용하고, API 연동 시 `mocks` import를 서비스 레이어(API 호출)로 교체.
3. **테스트 계정**: 운영 빌드에서는 mock 사용자 로그인 비활성화 또는 제거.
4. **문구**: 공통 메시지·라벨은 `src/i18n` 또는 `constants/messages.ts` 등으로 모아 i18n 적용.
5. **API 연동**: §8 항목(주문 체결, 투표 제출, 채팅 전송)은 백엔드 준비 시 서비스 레이어에서 해당 API 호출 추가.

이 문서는 `src` 디렉토리 기준으로 작성되었으며, `node_modules` 및 설정 파일 내 하드코딩은 제외했습니다.
