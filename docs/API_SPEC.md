# Uniport MVP API 명세서

Mock 데이터를 기준으로 정의한 API 스펙입니다. 백엔드 연동 시 이 명세에 맞춰 구현하면 프론트엔드와 호환됩니다.

---

## 1. 인증·사용자 (Auth / User)

### 1-1. 로그인

| 항목 | 내용 |
|------|------|
| **용도** | 이메일·비밀번호로 로그인 |
| **사용처** | `AuthContext`, 로그인 페이지 |

**Request** (Body)

```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "profileImage": "string",
    "totalAssets": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossRate": number
  }
}
```

**Response (실패)**  
`success: false`, `message`: 에러 메시지

---

### 1-2. 회원가입

| 항목 | 내용 |
|------|------|
| **용도** | 신규 사용자 가입 |
| **사용처** | `AuthContext`, 회원가입 페이지 |

**Request** (Body)

```json
{
  "email": "string",
  "password": "string",
  "nickname": "string"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "profileImage": "string",
    "totalAssets": number,
    "investmentAmount": number,
    "profitLoss": number,
    "profitLossRate": number
  }
}
```

- 신규 가입 시 `profileImage`는 서버에서 생성 URL 또는 기본값 부여.
- `totalAssets` 등 초기 자산은 서버 정책(예: 10,000,000) 적용.

---

## 2. 내 투자·홈 (My Investment / Home)

| 항목 | 내용 |
|------|------|
| **용도** | 홈 화면: 내 자산 요약, 보유 종목, 진행 중인 토너먼트 요약 |
| **사용처** | `src/pages/home/page.tsx` |

### 2-1. 내 투자 요약 (자산 + 보유 종목 + 토너먼트 요약)

**GET** `/api/me/investment` (또는 `/api/users/me/portfolio`)

**Response (200)**

```json
{
  "investmentData": {
    "totalAssets": number,
    "profitLoss": number,
    "profitLossPercentage": number,
    "investmentPrincipal": number,
    "cashBalance": number
  },
  "stockHoldings": [
    {
      "id": number,
      "name": "string",
      "quantity": number,
      "currentValue": number,
      "profitLoss": number,
      "profitLossPercentage": number,
      "logoColor": "string"
    }
  ],
  "tournamentData": {
    "name": "string",
    "endDate": "string",
    "daysRemaining": number
  }
}
```

- `endDate`: ISO 날짜 문자열 (예: `"2025-02-28"`).

---

## 3. 시장·종목 (Market / Stock)

| 항목 | 내용 |
|------|------|
| **용도** | 시장 지수, 거래량/상승/하락 순 종목, 종목 상세 |
| **사용처** | `mock-investment/page.tsx`, `stock-detail/page.tsx` |

### 3-1. 시장 지수

**GET** `/api/market/indices`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "value": number,
    "change": number,
    "changeRate": number
  }
]
```

### 3-2. 거래량 순 종목

**GET** `/api/market/stocks?sort=volume`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "code": "string",
    "currentPrice": number,
    "change": number,
    "changeRate": number,
    "logoColor": "string"
  }
]
```

### 3-3. 상승률 순 종목

**GET** `/api/market/stocks?sort=rising`

- 응답 배열 구조는 3-2와 동일.

### 3-4. 하락률 순 종목

**GET** `/api/market/stocks?sort=falling`

- 응답 배열 구조는 3-2와 동일.

---

### 3-5. 종목 상세

**GET** `/api/stocks/:id`

**Response (200)**

```json
{
  "id": number,
  "name": "string",
  "code": "string",
  "currentPrice": number,
  "change": number,
  "changeRate": number,
  "logoColor": "string",
  "myHolding": {
    "quantity": number,
    "avgPrice": number,
    "totalValue": number,
    "totalProfit": number,
    "profitRate": number
  } | null,
  "marketData": {
    "openPrice": number,
    "closePrice": number,
    "volume": number,
    "lowPrice": number,
    "highPrice": number
  },
  "financialData": [
    {
      "quarter": "string",
      "revenue": number,
      "grossProfit": number,
      "operatingProfit": number
    }
  ],
  "companyInfo": "string",
  "news": [
    {
      "id": number,
      "title": "string",
      "source": "string",
      "date": "string",
      "summary": "string"
    }
  ]
}
```

- `myHolding`: 해당 사용자 보유 정보 없으면 `null`.

---

## 4. 토너먼트 (Tournament)

| 항목 | 내용 |
|------|------|
| **용도** | 진행 중/예정 토너먼트 목록 |
| **사용처** | `src/pages/tournament/page.tsx` |

### 4-1. 진행 중인 토너먼트

**GET** `/api/tournaments/ongoing`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "endDate": "string"
  }
]
```

- `endDate`: ISO 8601 (예: `"2025-02-15T23:59:59.000Z"`).

### 4-2. 예정 토너먼트

**GET** `/api/tournaments/upcoming`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "startDate": "string"
  }
]
```

---

## 5. 랭킹 (Ranking)

| 항목 | 내용 |
|------|------|
| **용도** | 그룹 랭킹 목록, 내 그룹 순위 |
| **사용처** | `src/pages/ranking/page.tsx` |

### 5-1. 전체 그룹 랭킹

**GET** `/api/ranking/groups`

**Response (200)**

```json
[
  {
    "id": number,
    "groupName": "string",
    "profileImage": "string",
    "currentAssets": number,
    "profitRate": number
  }
]
```

### 5-2. 내 그룹 랭킹

**GET** `/api/ranking/my-group`

**Response (200)**

```json
{
  "id": number,
  "rank": number,
  "groupName": "string",
  "profileImage": "string",
  "currentAssets": number,
  "profitRate": number
}
```

---

## 6. 그룹 포트폴리오 (Group)

| 항목 | 내용 |
|------|------|
| **용도** | 그룹 정보, 보유 종목 요약, 멤버 목록 |
| **사용처** | `group-portfolio/page.tsx`, `feedback-report/page.tsx`, `chat/page.tsx` |

### 6-1. 그룹 포트폴리오 상세

**GET** `/api/groups/:groupId` (또는 `/api/groups/me` 로 현재 그룹)

**Response (200)**

```json
{
  "groupId": number,
  "groupName": "string",
  "profileImage": "string",
  "totalValue": number,
  "investmentAmount": number,
  "profitLoss": number,
  "profitLossPercentage": number,
  "holdings": [
    {
      "id": number,
      "stockName": "string",
      "stockCode": "string",
      "currentPrice": number,
      "quantity": number,
      "averagePrice": number,
      "currentValue": number
    }
  ]
}
```

### 6-2. 그룹 보유 종목 요약 (차트/카드용)

**GET** `/api/groups/:groupId/holdings-summary`

**Response (200)**

```json
[
  {
    "id": number,
    "name": "string",
    "logoColor": "string",
    "currentValue": number,
    "profitLoss": number,
    "profitLossPercentage": number
  }
]
```

### 6-3. 그룹 멤버 목록

**GET** `/api/groups/:groupId/members`

**Response (200)**

```json
[
  {
    "id": number,
    "nickname": "string",
    "profileImage": "string"
  }
]
```

---

## 7. 채팅 (Chat)

| 항목 | 내용 |
|------|------|
| **용도** | 그룹 채팅 메시지 목록 |
| **사용처** | `src/pages/chat/page.tsx` |

### 7-1. 채팅 메시지 목록

**GET** `/api/groups/:groupId/chat/messages`

**Response (200)**

```json
[
  {
    "id": number,
    "type": "user" | "trade",
    "userId": number,
    "userNickname": "string",
    "userProfileImage": "string",
    "message": "string | null",
    "timestamp": "string",
    "tradeData": {
      "action": "매수" | "매도",
      "stockName": "string",
      "quantity": number,
      "pricePerShare": number,
      "totalAmount": number,
      "reason": "string",
      "tags": "string[]"
    } | null
  }
]
```

- `type === "user"` 이면 `message` 사용, `type === "trade"` 이면 `tradeData` 사용.

---

## 8. 투표 (Vote)

| 항목 | 내용 |
|------|------|
| **용도** | 그룹 내 매수/매도 투표 목록 |
| **사용처** | `src/pages/chat/page.tsx` |

### 8-1. 투표 목록

**GET** `/api/groups/:groupId/votes`

**Response (200)**

```json
[
  {
    "id": number,
    "type": "매수" | "매도",
    "stockName": "string",
    "proposerId": number,
    "proposerName": "string",
    "proposerImage": "string",
    "quantity": number,
    "proposedPrice": number,
    "reason": "string",
    "createdAt": "string",
    "expiresAt": "string",
    "votes": [
      {
        "oderId": number,
        "userId": number,
        "userName": "string",
        "userImage": "string",
        "vote": "찬성" | "반대"
      }
    ],
    "totalMembers": number,
    "status": "ongoing" | "passed" | "rejected" | "expired"
  }
]
```

- 참고: mock 필드명 `oderId` 는 오타일 수 있음, API에서는 `orderId` 권장.

---

## 9. 페이지–API 매핑 요약

| 페이지 | 사용 API (명세 섹션) |
|--------|------------------------|
| home | 내 투자 요약 (2-1) |
| mock-investment | 시장 지수(3-1), 거래량/상승/하락 종목(3-2~3-4) |
| stock-detail | 종목 상세(3-5) |
| tournament | 진행 중(4-1), 예정(4-2) 토너먼트 |
| ranking | 전체 랭킹(5-1), 내 그룹 랭킹(5-2) |
| group-portfolio | 그룹 상세(6-1), 보유 요약(6-2), 멤버(6-3) |
| feedback-report | 그룹 상세(6-1) |
| chat | 그룹 상세(6-1), 채팅 메시지(7-1), 투표(8-1) |
| login/signup | 로그인(1-1), 회원가입(1-2) — AuthContext 연동 |

---

## 10. 공통

- **Base URL**: 환경 변수로 관리 (예: `VITE_API_BASE_URL`).
- **인증**: 로그인 후 토큰 또는 세션 쿠키로 API 요청 시 사용 (명세 상세는 백엔드와 협의).
- **에러**: HTTP 4xx/5xx 시 공통 에러 형식 정의 권장 (예: `{ code, message }`).
- **날짜**: 서버는 ISO 8601 문자열 권장, 클라이언트는 필요 시 `Date` 변환.

이 명세는 현재 mock 구조를 반영하였으며, 백엔드 구현 시 필드 추가·이름 변경이 있을 수 있습니다. 변경 시 프론트 타입·서비스 레이어를 함께 수정하면 됩니다.

---

## 11. Mock 데이터 정리 (프론트 구조)

API로 받아야 할 데이터는 **mock**으로만 두고, **페이지는 서비스를 통해** 가져오도록 구성했습니다.

| 구분 | 위치 | 설명 |
|------|------|------|
| **Mock 데이터** | `src/mocks/` | `userData`, `investmentData`, `stockMarketData`, `stockDetailData`, `tournamentData`, `rankingData`, `groupPortfolioData`, `chatData`, `voteData` |
| **타입** | `src/types/index.ts` | API 응답·요청 타입 (명세 §1~8과 동일) |
| **서비스** | `src/services/` | 각 도메인별 함수. 현재는 mock 반환, 이후 `fetch(API_BASE_URL + ...)` 등으로 교체 |
| **페이지** | `src/pages/*` | `useEffect` 등으로 서비스 호출 후 state에 저장해 사용. **mocks 직접 import 없음** (AuthContext는 로그인/회원가입용 mock 유지) |

- **백엔드 연동 시**: `src/services/*.ts` 내부만 수정 (예: `getMyInvestment()` → `fetch('/api/me/investment')`). 페이지 코드는 그대로 둬도 됨.
- **인증**: 로그인/회원가입은 `AuthContext`에서 `mocks/userData` 사용. 실서비스 시 백엔드 인증 API로 교체.
